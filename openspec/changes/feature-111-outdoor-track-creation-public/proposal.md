# Proposal

## Why

Today, every track in the system is born from a GPX file: an owner must record with a GPS device, export the GPX, and upload it through `TrackFormDialog` to create a `Track` row. There is no way for an owner to create a track from scratch on the site — even to plan a route ahead of time, share a hand-drawn route, or record a walk without a GPS device. This slice adds a "Place on map" creation path on the existing `/my/tracks` and `/admin/tracks` pages so verified or trusted owners can drop a polyline directly on the Leaflet map and persist it as a regular `Track` row, attachable to a trip through the existing `HikesToTracks` flow. The MVP intentionally ships a minimal end-to-end flow (points + title/description/status) and defers optional metadata fields (activity type, recording start time + IANA timezone, total movement time) and any public entry-point to a follow-up slice, to keep this PR reviewable and isolate the new map-editor UX risk.

## What Changes

- **New `TrackEditorMap` component** at `components/track-pages/track-editor-map.tsx` (Leaflet via `react-leaflet`, `useMapEvents` click handler, draggable point list with up/down reorder and remove, live distance preview via existing Haversine math in `lib/track-gpx-parser.ts`).
- **New `TrackEditor` shared shell** wrapping the map, the point list, and the form fields, with the existing `TrackFormDialog` dirty-close guard pattern (`markDiscardedTrackGpxFileAssetsPendingDelete` plumbing kept ready even though the MVP path generates geometry server-side and never uploads a client file).
- **New "Place on map" tab** inside `TrackFormDialog` in `components/admin-pages/tracks-admin-panel.tsx`, parallel to the existing GPX-upload tab. Same tab surface renders on `/admin/tracks` (admin) and `/my/tracks` (owner) because both already share `TrackFormDialog` via `TrackManagementPanel`.
- **New server action `createManualTrack`** in `app/_data/tracks.ts` (or a new sibling module if the file-split plan from `docs/data-layer-refactor-plan-2026-10-08.md` lands first):
  - Gates: `requireTrustGatedAction("track-upload")` and `assertVerifiedResourceQuota(tx, user, "track", 10)` — identical to the existing `createTrack` and `createTrackAndAttachToHike`.
  - Input: `{ title, slug?, description?, status? (default DRAFT), points: { lat: number; lng: number }[] (>= 2) }`.
  - Implementation: build a synthetic GPX byte string from the placed points server-side, write it via `UTApi.uploadFiles` from `uploadthing/server` to obtain an UploadThing key/URL, then create a `FileAsset(purpose: TRACK_GPX, ownerUserId: actor.id, visibility: PRIVATE, status: ACTIVE)`, create the `Track` row with that `fileAssetId`, and run the existing `parseTrackGpx` (or its shared inner call to `parseTrackGpxMetadata`) so `Track.metadata` is populated through the same pipeline GPX uploads use. The synthetic GPX keeps `Track.fileAssetId` required, avoids new `FileAssetPurpose` enum values, and produces a `Track` that every downstream consumer (`TrackMap`, `TrackMapViewModel`, `CombinedTrackMap`, photo time matching, day filtering, public trip linked-track cards) renders without further changes.
  - Manual tracks SHALL NOT expose a public GPX download link on `/tracks/[slug]`: the synthetic GPX is an implementation detail, not a user artifact. The existing `downloadAvailable` projection in `app/_data/tracks.ts` is restricted to `fileAsset.visibility ∈ {PUBLIC, UNLISTED}` already; manual tracks land with `visibility: PRIVATE` so no download button renders without a separate rule change.
- **New localization keys** under `app/i18n/locales/{en,ru}/trips.json` (the existing `addTrack*` group at lines 37–49 is the natural sibling) and/or a new `app/i18n/locales/{en,ru}/tracks.json` namespace if the new strings grow. Strings cover: tab label, point-list empty/help, distance preview, validation errors, server rejection messages (trust/quota/slug/internal).
- **Capability projection unchanged**: the existing `HikeTrackContributionCapability` (5-state, trip-scoped, from feature-110) and the existing per-track `getCreatorUnlinkedTracks` cover the trip-side attach path. No new free-standing capability helper is added in this slice — the new tab in `TrackFormDialog` reads trust + quota inline through the same server-action gate the existing form already uses, and any future public entry-point on `/tracks` or `/trips/[slug]` will get a `getPublicTrackCreationCapability` in feature-112.

## Capabilities

### New Capabilities

None. All observable behavior added by this slice lives inside the existing `outdoor-tracks` capability.

### Modified Capabilities

- `outdoor-tracks`: extends the track-creation surface with a map-point-placement path that produces a regular `Track` row through the existing GPX parsing pipeline, attached to the existing `TrackFormDialog` dirty-close guard, gated by the existing `track-upload` trust action and the existing `track: 10` verified quota, and rendered on the existing `/admin/tracks` and `/my/tracks` pages.

## Impact

- **Code**
  - **New**: `components/track-pages/track-editor-map.tsx` (Leaflet `useMapEvents` editor).
  - **New**: `components/track-pages/track-editor-shell.tsx` (or co-located with the map) wrapping the editor state, dirty guard, distance preview, and form-fields slot for forward compatibility with `outdoor-track-point-deletion`.
  - **Modified**: `components/admin-pages/tracks-admin-panel.tsx` — `TrackFormDialog` gains a `Place on map` tab alongside the existing GPX upload section.
  - **Modified**: `app/_data/tracks.ts` — new `createManualTrack(input)` server action, new `TrackEditorFileAssetPurpose` constant or similar internal marker for "synthetic manual track GPX", reuse of `parseTrackGpx` / `parseTrackGpxMetadata` for metadata population.
  - **Possibly new**: `lib/uploadthing/server-gpx.ts` — thin wrapper around `UTApi.uploadFiles` to write the synthetic GPX bytes server-side and return the resulting file URL/key.
- **APIs**
  - New exported server action `createManualTrack` with the input shape above and a result discriminated by `code` (`TRUST | QUOTA | SLUG | VALIDATION | INTERNAL`) parallel to `createTrackAndAttachToHike` from feature-110.
- **Dependencies**
  - `uploadthing/server` `UTApi.uploadFiles` — already installed (UploadThing is the project's only file storage). No new external dependency.
- **Schemas**
  - None. `Track.fileAssetId` remains required; `FileAssetPurpose.TRACK_GPX` is reused; `Track.metadata` shape is unchanged (the same `TrackGpxMetadata` factory used by GPX uploads).
- **Localization**
  - `app/i18n/locales/{en,ru}/trips.json` — add `addTrackPlaceOnMap*`, `placeOnMap*`, `trackEditor*`, `trackEditorDistance*` keys.
- **Specs**
  - Delta file at `openspec/changes/feature-111-outdoor-track-creation-public/specs/outdoor-tracks/spec.md` extending the existing capability.
- **Out of scope (deferred to feature-112)**
  - Activity type select on the new form (reuse existing `getActiveTrackActivityTypes` helper, deferred so feature-111 stays focused on the editor + storage path).
  - Recording start time + IANA timezone picker (reuse `lib/track-recording-timezone` patterns from feature-110, deferred).
  - Total movement time field.
  - Public entry-point on `/tracks` or `/trips/[slug]` for "place and attach in one workflow" (a new `createManualTrackAndAttachToHike` mutation parallel to `createTrackAndAttachToHike`, plus a new `getPublicTrackCreationCapability`).
  - The existing P0 candidate `outdoor-trip-owner-draft-track-visibility` — independent candidate, unchanged by this slice.