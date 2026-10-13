# Design

## Context

Today, every `Track` is born from a GPX file the owner already has. The existing `TrackFormDialog` (defined inside `components/admin-pages/tracks-admin-panel.tsx:159–525`) is the single creation surface shared by `/admin/tracks` and `/my/tracks`, and it accepts only one input shape: a `TRACK_GPX` `FileAsset` that the admin/my-tracks user uploaded through the existing `trackGpxUploader` UploadThing route and validated through `lib/gpx-validation.ts`. There is no map-edit primitive in the codebase today (`components/track-pages/track-map-leaflet.tsx` is read-only — `useMapEvents` is installed via `react-leaflet@5.0.0` but unused). The existing parsing pipeline (`app/_data/tracks.ts:610–663` `parseTrackGpx`, calling `lib/track-gpx-metadata.ts` `parseTrackGpxMetadata` and feeding `TrackGpxCoordinate[]` through `computeDistance`, `computeBounds`, `computeElevation`, `computeTime`, `simplifyMapGeometry`, and `createSuccessfulTrackGpxMetadata`) is the single entry point that produces the `TrackGpxMetadata` shape every downstream consumer (public `/tracks/[slug]` map, public trip linked-track cards, admin track list, combined trip map, photo-time matching) already reads. There is no `TrackPoint`/`TrackSegment` model, so the only durable representation of a track's geometry is the parsed JSON in `Track.metadata`.

The proposal asks for a map-point-placement creation path on the existing track workspace. This design reuses every existing consumer unchanged and introduces one new component (the editor), one new server action (`createManualTrack`), one thin wrapper around `UTApi.uploadFiles` for server-side GPX writing, and one shared `TrackEditor` shell designed to be the future base for `outdoor-track-point-deletion`.

## Goals / Non-Goals

**Goals**

- Let a verified, trusted, or administrator viewer create a `Track` from at least two placed map points through a tab inside the existing `TrackFormDialog`, without touching the GPX-upload tab.
- Keep `Track.fileAssetId` required, keep `FileAssetPurpose.TRACK_GPX` as the backing purpose, and keep `Track.metadata` shape unchanged by reusing `parseTrackGpx` and `parseTrackGpxMetadata` against a synthetic GPX byte string generated server-side from the placed points.
- Keep the existing dirty-close guard, trust gate, quota, slug validation, and revalidation paths unchanged.
- Introduce a reusable `TrackEditor` shell so `outdoor-track-point-deletion` can later reuse the map, point list, distance preview, and form-field slot without duplication.
- Keep the public GPX download hidden for manual tracks (the synthetic GPX is an implementation detail, not a user artifact).

**Non-Goals**

- No activity type select, no recording start time + IANA timezone picker, no total movement time field. Deferred to a separate slice.
- No public-facing `Place on map` entry-point on `/tracks`, `/trips/[slug]`, or anywhere else outside the existing track workspace. Deferred to a separate slice.
- No `Track.fileAssetId` relaxation and no new `FileAssetPurpose` enum value. The MVP fits into the existing shape.
- No schema migration.
- No client-side GPX generation, no client-side `parseTrackGpxMetadata`, no separate manual-track rendering branch.
- No refactor of `TrackFormDialog` beyond adding the new tab.

## Decisions

### 1. Synthetic GPX byte string generated server-side from placed points

**Decision**: `createManualTrack` builds a minimal valid GPX 1.1 byte string server-side from the placed points, writes it via `UTApi.uploadFiles` from `uploadthing/server`, and then reuses the existing `parseTrackGpx` pipeline against the synthetic file.

**Why**: Keeps every downstream consumer (`TrackMap`, `TrackMapViewModel`, `CombinedTrackMap`, public trip linked-track cards, admin track list, photo time matching, day filtering) rendering manual tracks through the same code paths that render uploaded GPX tracks. Avoids a new `FileAssetPurpose` enum value, a `Track.fileAssetId` nullable column, a new `TrackPoint` table, and a new manual-track rendering branch.

**GPX shape** (synthesized in `app/_data/tracks.ts` next to the new action):

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="manual-track-editor" xmlns="http://www.topografix.com/GPX/1/1">
  <trk>
    <name>{track.title}</name>
    <trkseg>
      <trkpt lat="{p1.lat}" lon="{p1.lng}"/>
      <trkpt lat="{p2.lat}" lon="{p2.lng}"/>
      ...
    </trkseg>
  </trk>
</gpx>
```

No `<time>` elements are written: synthetic points have no timestamps, so the parse pipeline will produce no `time.start`/`time.end`, no timeline, and the existing recording-timezone/timezone-evidence displays will render as unavailable — the same behavior as a coordinate-only uploaded GPX.

**Alternatives considered**

- *Make `Track.fileAssetId` nullable and store points in `Track.metadata` directly*: rejected. Breaks the GPX download/parse back-link, requires a schema migration, requires a manual-track rendering branch in `TrackMapViewModel`, and complicates the existing `getTrackData` validation.
- *Add a new `FileAssetPurpose.TRACK_MANUAL_POINTS` and bypass `parseTrackGpx`*: rejected. Doubles the rendering and metadata surface area for marginal benefit; adds an enum migration.
- *Generate synthetic GPX client-side and POST the bytes to a new internal route*: rejected. Splits the byte-authority between client and server and introduces a second upload path.

### 2. New `createManualTrack` server action, separate from `createTrack` and `createTrackAndAttachToHike`

**Decision**: Add a new exported server action `createManualTrack(input)` in `app/_data/tracks.ts` (or in the new `app/_data/tracks/` module if the split from `docs/data-layer-refactor-plan-2026-10-08.md` lands first). The signature mirrors `createTrackAndAttachToHike`:

```ts
type CreateManualTrackInput = {
  title: string;
  slug?: string | null;
  description?: string | null;
  status?: TrackStatus;     // default DRAFT
  points: { lat: number; lng: number }[]; // length >= 2
};

type CreateManualTrackResult =
  | { ok: true; trackId: string; trackSlug: string }
  | { ok: false; code: "TRUST" | "QUOTA" | "SLUG" | "VALIDATION" | "INTERNAL"; message: string };
```

The action:

1. Calls `requireTrustGatedAction("track-upload")` (no new trust action registered).
2. Opens a `prisma.$transaction` that runs `assertVerifiedResourceQuota(tx, user, "track")`, validates the input through `getTrackData` (with a relaxed `fileAssetId` requirement that the helper is updated to accept `null` at this single call site, or with a synthetic placeholder), runs `ensureSlugAvailable`, builds the synthetic GPX bytes, uploads via `UTApi.uploadFiles`, creates `FileAsset(purpose: TRACK_GPX, ownerUserId: user.id, visibility: PRIVATE, status: ACTIVE)`, and creates `Track` with that `fileAssetId`.
3. After the transaction commits, calls `parseTrackGpx(trackId).catch(() => null)` (same pattern as `createTrackAndAttachToHike`).

**Why**: Mirrors the existing mutation shape so the client and any future verification script (e.g. `verify-002-hike-track-attach-verify` from `openspec/backlog.md:117`) can read the result by `code` without learning a new error vocabulary. Reuses every existing gate, validation, and revalidation helper.

**Alternatives considered**

- *Modify `createTrack` to accept `null fileAssetId`*: rejected. That helper is the canonical admin-path and changing its file-asset semantics would weaken the GPX upload flow.
- *Modify `createTrackAndAttachToHike` to detect "no uploaded file, build synthetic"*: rejected. Couples two flows together and complicates the trip-side dialog with a third input shape (points). Keep the trip-side slice separate (deferred to feature-112).

### 3. Synthetic GPX file asset is `PRIVATE` so the public download link hides

**Decision**: The new `FileAsset` created by `createManualTrack` has `visibility = PRIVATE`. This intentionally fails the existing public-track-download affordance (`app/_data/tracks.ts:427–455` `getPublicTrackBySlug` only renders the download link for `PUBLIC` or `UNLISTED` file assets), so manual tracks never expose the synthetic GPX as a downloadable artifact.

**Why**: The synthetic GPX is an implementation detail. Exposing it as a downloadable file would mislead users (a hand-placed route is not a recorded GPS track) and would leak the constant `<gpx creator="manual-track-editor">` metadata.

**Alternatives considered**

- *Add a `synthetic: true` flag to `FileAsset` and a separate UI rule*: rejected. Adds a new column and a parallel rendering branch for one class of asset.
- *Store synthetic GPX bytes outside UploadThing entirely*: rejected. Splits storage paths and breaks the existing file-route download flow.

### 4. New `TrackEditor` shell, shared between this slice and `outdoor-track-point-deletion`

**Decision**: Extract the map editor, ordered point list, distance preview, and form-fields slot into a single reusable component (e.g. `components/track-pages/track-editor.tsx` exporting a `TrackEditor` that takes `points`, `onChangePoints`, `renderExtraFields`, and `onSubmit`). The new `Place on map` tab inside `TrackFormDialog` renders `TrackEditor`; future `outdoor-track-point-deletion` will render the same shell over an existing track's parsed geometry.

**Why**: The grounds doc (`docs/outdoor-tracks-feature-research-2026-10-07.md:184–187`) explicitly calls out that `outdoor-track-point-deletion` will reuse this base. Designing the shell now avoids a second near-duplicate when the point-deletion slice lands.

**Alternatives considered**

- *Inline the editor in `TrackFormDialog` and refactor later*: rejected. The candidate already says "Split scope aggressively" — designing the boundary once is cheaper than refactoring later.
- *Pass `mode: "view" | "create" | "edit"` to the existing read-only map*: rejected. Mode flags inside a read-only renderer blur read and write semantics and make it hard to add `useMapEvents` cleanly.

### 5. New `TrackEditorMap` Leaflet primitive using `useMapEvents`

**Decision**: A new client component `components/track-pages/track-editor-map.tsx` (dynamic-imported with `ssr: false` from `TrackEditor`, the same pattern `components/track-pages/track-map.tsx` uses for the read-only map) renders a `MapContainer` with OSM tiles, an ordered `Polyline` for placed points, a `CircleMarker` per placed point (using the existing `TRACK_LINE_COLORS` palette), and a `useMapEvents({ click(e) { ... } })` handler that calls back into the parent editor's `onAddPoint({ lat, lng })`. The existing `FitMapBounds` helper (private to `track-map-leaflet.tsx`) is lifted to a small shared `lib/track-map-bounds.ts` module so the editor can reuse it for initial bounds fitting; the read-only map keeps importing it from the new location.

**Why**: Keeps the read-only map pure, isolates the editor's interactivity behind a single new file, and lets `outdoor-track-point-deletion` reuse the editor's map without touching the view-mode map.

**Alternatives considered**

- *Add a `mode` prop and `useMapEvents` to `TrackMapLeaflet`*: rejected. Conflates read and write paths and adds non-trivial conditional logic to a stable view component.
- *Use a third-party drawing plugin (`leaflet-draw`, `leaflet-editable`)*: rejected. The project explicitly avoids new dependencies unless they reduce implementation risk; a click-to-add-point + ordered-list UX is well within what `react-leaflet@5.0.0` already exposes.

### 6. Export `distanceBetweenPoints` and `computeBounds` from `lib/track-gpx-parser.ts` for client and server reuse

**Decision**: Promote `distanceBetweenPoints` (Haversine, `EARTH_RADIUS_METERS = 6371000`) and `computeBounds` from private functions in `lib/track-gpx-parser.ts` to exported helpers, both consumed by the new `TrackEditor` (live distance preview, initial bounds fit) and by the existing server-side `parseTrackGpxMetadata`. The `EARTH_RADIUS_METERS` constant is also exported so any future client-side check (e.g. `outdoor-track-cleanup-improvements` outlier speed) can reuse the same value.

**Why**: Single source of truth for Haversine math; matches the pattern `lib/outdoor-photo-track-time-matching.ts` already duplicates Haversine inline and would benefit from the same export. Avoids drift between client and server distance numbers.

**Alternatives considered**

- *Duplicate Haversine in a new `lib/track-distance.ts`*: rejected. Splits math across two files; the existing private helper already has the right constants.
- *Compute distance server-side on every point change*: rejected. Defeats "live" preview and round-trips on every click.

### 7. Reuse `requireTrustGatedAction("track-upload")` and the existing `track: 10` verified quota

**Decision**: No new trust action is registered for the manual creation flow. The existing `requireTrustGatedAction("track-upload")` already gates `createTrack` and `createTrackAndAttachToHike`, and the verified quota cap of 10 tracks in `lib/auth-trust-quotas.server.ts:9–13` already limits the total live track count regardless of how the track was created.

**Why**: Manual creation is, from the trust gate's perspective, the same action as uploading a GPX. Counting manual tracks against the same quota prevents a verified user from circumventing the 10-track cap by switching creation methods. Reusing the existing gate avoids a new entry in `TrustGatedAction` and keeps `account-trust-gates` unchanged.

**Alternatives considered**

- *Register `"track-create"` and `"track-edit"` separately*: rejected. Splits one user-facing capability into two gate entries without changing any observable trust boundary.
- *Treat manual creation as zero-cost (no quota)*: rejected. Defeats the existing quota; a verified user could create an unlimited number of routes and clutter their own list.

### 8. Localize the new strings into the existing `trips` namespace and a new `tracks` namespace

**Decision**: Add the new strings to `app/i18n/locales/{en,ru}/trips.json` under the existing `addTrack*` group when the string is trip-side or shared (e.g. validation messages); create `app/i18n/locales/{en,ru}/tracks.json` only if the new strings grow past a small handful (point-list labels, distance preview, etc.). The implementation decides based on string count; either path is acceptable. All new strings SHALL have both `en` and `ru` values at implementation time.

**Why**: Reuses the established pattern (feature-110 added `addTrack*` keys to `trips.json`) and keeps the existing `trips` namespace the home of track-related copy that already lives next to the trip-side dialog.

**Alternatives considered**

- *Create a new `tracks` namespace immediately*: rejected without evidence the string count justifies it; the existing `addTrack*` group already covers similar copy.
- *Skip localization and use English defaults*: rejected. Breaks the Russian-language experience the project already ships.

## Risks / Trade-offs

- **[Risk]** `UTApi.uploadFiles` server-side semantics differ from the existing browser-side `trackGpxUploader` route (no client file validation, no middleware, no onUploadComplete). **Mitigation**: Validate the synthetic GPX shape in `createManualTrack` before calling `UTApi.uploadFiles` (parse the generated bytes with `parseGpxPoints` to confirm at least two valid `trkpt` elements), and reuse `validateGpxContent` from `lib/gpx-validation.ts` if it accepts a string instead of a buffer; if it does not, add a thin `validateGpxString` wrapper at the same location so the validation surface stays in `lib/gpx-validation.ts`. Document the new internal helper in `docs/outdoor-tracks-feature-research-2026-10-07.md` follow-up notes.
- **[Risk]** Synthetic GPX bytes uploaded via `UTApi.uploadFiles` may bypass the existing UploadThing route's `TRACK_GPX` size cap and `validateGpxContent` middleware. **Mitigation**: Cap the synthetic GPX size in `createManualTrack` (a 5,000-point polyline at ~80 bytes per `trkpt` is ~400 KB, well under the existing 16 MB cap) and run `validateGpxContent` (or its string variant) before upload.
- **[Risk]** Manual tracks leave no recording-time evidence, so the existing public track detail page will display "Recording time unavailable" badges where GPX tracks show start/finish. **Mitigation**: This is the intended behavior — manual routes have no recording time. The existing display already tolerates missing time metadata per `outdoor-tracks` spec `Track time summaries expose timezone evidence` and `Track summaries display recording start and finish times`.
- **[Risk]** `useMapEvents({ click })` ignores clicks on existing markers and on the polyline, so a viewer cannot fine-tune a point by clicking on it. **Mitigation**: The MVP UX adds the remove button in the point list as the explicit removal action; fine-tuning by re-click on a marker is a future refinement tracked separately and does not block this slice.
- **[Risk]** The `TrackEditor` shell designed for forward reuse may overfit to manual creation and require refactor when `outdoor-track-point-deletion` lands. **Mitigation**: Keep the shell's API narrow (`points`, `onChangePoints`, `renderExtraFields`, `onSubmit`) and push trip-specific state (e.g. attaching to a hike) to the consuming surface, not the shell. Document the boundary in the new file's top comment so the next slice's author sees it.
- **[Risk]** Promoting `distanceBetweenPoints` and `computeBounds` from private to exported changes the public surface of `lib/track-gpx-parser.ts`. **Mitigation**: Mark the existing `EARTH_RADIUS_METERS` constant as the canonical single export, leave `computeDistance`/`computeBounds`/`computeElevation`/`computeTime` private and unchanged, and export only the leaf functions that the editor needs. No behavior change for any existing caller.

## Migration Plan

- No schema migration. `Track.fileAssetId` remains required + unique. `FileAssetPurpose` enum is unchanged. `Track.metadata` JSON shape is unchanged. No data backfill needed.
- No backwards-incompatible change to public APIs. `getPublicTracks`, `getPublicTrackBySlug`, `getAllTracks`, and `parseTrackGpx` keep their existing signatures and behavior. Manual tracks become readable through the existing projections the moment `createManualTrack` runs.
- Deploy steps:
  1. Land the `docs/outdoor-tracks-feature-research-2026-10-07.md` follow-up note describing `UTApi.uploadFiles` server-side usage and the `FileAsset(visibility: PRIVATE)` convention for manual tracks.
  2. Land the new `createManualTrack` action, the `TrackEditor`/`TrackEditorMap` components, and the new tab inside `TrackFormDialog` in one PR (the slice's tasks split this into reviewable steps but ships together).
  3. `npm run tsc`, `npm run lint`, `npm run build`. Browser-check on `/my/tracks` and `/admin/tracks` as a verified user with both quota-remaining and quota-reached states. Manual QA deferred to `outdoor-track-creation-public-manual-qa` in the backlog if any browser matrix case is skipped.
- Rollback: revert the PR. No data needs to be removed because manual tracks are ordinary `Track` rows and the new server action is the only new entry point that creates them. If a manual track was created before rollback, it continues to behave like a regular track after rollback (read-only through the existing public/admin surfaces, no edit path beyond what already existed).

## Open Questions

- None at design time. The deferred items (activity type, recording start + timezone, movement time, public entry-point on `/trips/[slug]` or `/tracks`) are intentionally out of scope per the proposal and do not change this design.