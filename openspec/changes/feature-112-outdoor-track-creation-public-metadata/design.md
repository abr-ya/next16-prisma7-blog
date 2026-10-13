# Design

## Context

After feature-111, a verified/trusted/administrator owner can create a hand-placed `Track` through the `Place on map` tab inside `TrackFormDialog`. The created `Track` row stores only `title`, `slug`, `description`, `status`, the synthetic `FileAsset` (purpose `TRACK_GPX`, visibility `PRIVATE`), and the parsed `metadata` JSON. The `Track` model already exposes `recordingTimezone String?` and `activityTypeId String?` (added by feature-110 and feature-101 respectively); the `TrackActivityType` catalog is live; `lib/track-recording-timezone` is the canonical timezone helper; and `parseTrackGpx` is the single post-commit parser that populates `Track.metadata`. The `TrackEditor` shell (`components/track-pages/track-editor.tsx`) was deliberately designed in feature-111 with a `renderFormFields` slot so future metadata could be added without restructuring the editor. `docs/outdoor-tracks-feature-research-2026-10-07.md` open decision #3 explicitly identifies the four new fields and the `TrackTimeSource` enum as the second half of the candidate. The duration-input UX variant (`HH:MM:SS` vs `HH:MM` vs hybrid) was flagged in the original candidate and the user chose hybrid (`HH:MM` by default + optional "include seconds" toggle) during the proposal phase.

## Goals / Non-Goals

**Goals**

- Let a verified/trusted/administrator viewer fill activity type, recording start (+ IANA timezone), and duration on the `Place on map` tab, and persist them on the new `Track` row.
- Derive `timeSource` server-side: `GPX` for any uploaded-GPX track after `parseTrackGpx`; `MANUAL` for a `Place on map` track with start or duration; `NONE` for a `Place on map` track with neither.
- Render `timeSource` (as a localized badge) and the new optional fields on the existing public track list, public track detail, admin track list, and hike linked-track cards.
- Backfill `timeSource = GPX` for every existing `Track` row in the same migration.
- Stay inside the existing `TrackEditor` `renderFormFields` slot; no editor refactor.

**Non-Goals**

- No edit flow for the four new fields on existing GPX tracks in this slice (the existing admin/my-tracks edit dialog already supports `activityTypeId` and `recordingTimezone`; `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` become display-only there until a future slice wires edit).
- No new public entry-point on `/tracks` or `/trips/[slug]` for hand-placed creation.
- No schema change beyond the additive enum + three nullable columns (no `Track.fileAssetId` relaxation, no `FileAssetPurpose` value, no `metadata` shape change).
- No client-side duration math or format switching beyond the toggle UI; storage stays whole-second `Int`.
- No new display components — all additions live inside the existing track summary renderers.

## Decisions

### 1. Three nullable columns + one new enum, backfilled in the same migration

**Decision**: Add `Track.recordingStartAt DateTime?`, `Track.recordingDurationSeconds Int?`, and `Track.timeSource TrackTimeSource?` (nullable for migration safety). Add new enum `TrackTimeSource { GPX MANUAL NONE }`. The migration includes a single `UPDATE "Track" SET "timeSource" = 'GPX'` backfill that classifies every pre-existing row as `GPX`. Subsequent `createTrack` / `createManualTrack` / `parseTrackGpx` write `timeSource` explicitly.

**Why**: Every existing track was born from a GPX upload (there is no pre-feature-111 path to create a `Track` without one), so backfilling all rows to `GPX` is correct. Keeping `timeSource` nullable during migration avoids a `NOT NULL` constraint conversion on a populated column and lets future code distinguish "legacy row that was backfilled" from "row written by the new code path" if needed (the new code path always writes the column, so the distinction is informational only).

**Alternatives considered**

- *Non-nullable `timeSource` with default `NONE`*: rejected — the migration backfill becomes a multi-step `ADD COLUMN DEFAULT NONE → UPDATE TO GPX → ALTER COLUMN DROP DEFAULT → ALTER COLUMN SET NOT NULL` dance, and "old rows have `NONE` until their next parse" would be a transient confusing state.
- *Stuffing `timeSource` into the existing `Track.metadata` JSON*: rejected — JSON is the wrong shape for a queryable enum (no index, no `enum` validation, no Prisma type) and the four other JSON consumers (parse pipeline, day filter, photo matching, public summary) would have to special-case it.

### 2. `timeSource` semantics: GPX for any uploaded GPX, MANUAL if start or duration, NONE if neither

**Decision**: `parseTrackGpx` writes `timeSource = GPX` for every successful (or attempted) parse of a `Track.fileAssetId` that was created via the `Upload GPX` tab — including re-parses — independent of whether the GPX file carries `<time>` elements. `createManualTrack` writes `timeSource = MANUAL` when the submitted input has at least one of `recordingStartAt` or `recordingDurationSeconds`; otherwise it writes `timeSource = NONE`. Filling `activityTypeId` alone does not flip `timeSource` away from `NONE` (activity type is orthogonal to timeline source).

**Why**: This matches the research-doc #3 definition ("tracks whose timeline came from an uploaded GPX, from tracks whose owner typed the times in, and from tracks with no time data at all"). The `GPX` value communicates the source, not the presence of timestamps — a coordinate-only GPX track is still GPX-sourced. `MANUAL` means the user typed in some timeline data; without start/duration there's no timeline to source from. Activity type does not affect timeSource because it doesn't carry timeline information.

**Alternatives considered**

- *`MANUAL` whenever any of the four fields is filled, including activity type*: rejected — misclassifies "I tagged a type but no time" as a manual timeline, conflates catalog metadata with timeline metadata.
- *A `MIXED` enum value for tracks that get re-parsed after a manual edit*: deferred — out of scope for this slice (matches the `outdoor-track-gpx-revisions` and `outdoor-track-point-deletion` backlog candidates).

### 3. Hybrid duration input: HH:MM default + optional "include seconds" toggle

**Decision**: The duration field on the `Place on map` tab defaults to two numeric inputs (`HH` and `MM`). A single toggle labeled with the localized "include seconds" string switches the input to three numeric inputs (`HH`, `MM`, `SS`). In either mode the system stores `recordingDurationSeconds` as `Int` seconds. The toggle state is local form state, not persisted.

**Why**: This is the user's chosen UX variant from the proposal phase (per the original candidate's open UX question). It matches the storage model (whole seconds, no formatting in the database) and reuses the existing `formatTrackDuration` helper for both display modes on the public surface.

**Alternatives considered**

- *Single text input accepting `HH:MM` or `HH:MM:SS` based on length*: rejected — visually ambiguous, harder to localize, no clear UX signal.
- *Native `<input type="number">` with seconds unit selector*: rejected — the project already follows a custom numeric-input pattern across forms and a custom toggle is more consistent.
- *Always `HH:MM:SS`*: rejected — the user explicitly preferred the hybrid for casual entries.

### 4. The four form fields live inside the existing `TrackEditor` `renderFormFields` slot

**Decision**: Add the four fields inside `TrackFormDialog`'s `renderFormFields={() => (...)}` callback, which the existing `TrackEditor` (`components/track-pages/track-editor.tsx`) renders once above the map. The existing react-hook-form schema (`title`, `slug`, `description`, `status`) gains four new optional fields and is the single source of truth; the new fields participate in the same dirty-close guard `TrackFormDialog` already owns. No new `TrackEditor` prop is added beyond the four new field handlers.

**Why**: feature-111 explicitly designed `TrackEditor` with this slot to absorb future metadata without restructuring the editor or duplicating the dirty-close guard. Reusing the slot keeps the editor shell unchanged, lets the existing point-list / distance preview / map interactions stay stable, and lets the future `outdoor-track-point-deletion` slice continue to reuse the shell unchanged.

**Alternatives considered**

- *Introduce a new "Metadata" sub-section inside the editor shell*: rejected — the existing `renderFormFields` slot is the established forward-compat hook and adding a second slot would be premature.
- *Add a fourth tab to `TrackFormDialog`*: rejected — the four fields are extensions of the same creation intent, not a separate creation path.

### 5. `parseTrackGpx` sets `timeSource = GPX`

**Decision**: Inside `parseTrackGpx(trackId)` (the post-commit hook in `app/_data/tracks.ts` already used by `createTrack`, `createManualTrack`, and any re-parse action), write `Track.timeSource = "GPX"` as part of the existing `prisma.track.update` that stores parsed `metadata`. This includes failed parses — even a failed parse on a GPX file is still GPX-sourced, so `timeSource = "GPX"` stays accurate. Subsequent successful or failed re-parses overwrite the same value.

**Why**: One write point covers every GPX code path (initial upload, future re-parse, future `outdoor-track-gpx-revisions` rollback). `createTrack` does not need to know about `timeSource` — `parseTrackGpx` is its post-commit hook. The seed command can leave the column null because `parseTrackGpx` will run on first parse after the migration.

**Alternatives considered**

- *`createTrack` writes `timeSource = "GPX"` directly, `parseTrackGpx` only writes on success*: rejected — leaves a window where a `createTrack` followed by a failed parse has `timeSource = "GPX"` anyway, but introduces a second write site and risks drift if `createTrack` is ever called without the parse hook.
- *Use a database trigger to default `timeSource` to `GPX` when `fileAssetId` resolves to a `TRACK_GPX` asset*: rejected — adds database-side complexity for a small win and the application-side write is simpler.

### 6. Public/admin display surfaces reuse the existing track summary renderers

**Decision**: Add the `timeSource` badge and the optional `recordingStartAt` / `recordingDurationSeconds` lines to the existing public track list card (`app/(public)/tracks/page.tsx`), public track detail page (`app/(public)/tracks/[slug]/page.tsx`), admin track list row (`components/admin-pages/tracks-admin-panel.tsx`), and hike linked-track card (consumed via the existing `TrackMapViewModel`-style projection read in `components/hike-pages/hike-trip-media.tsx` or its current equivalent). All four surfaces use the same localized badge label keys. No new display components are introduced; existing renderers gain small additions.

**Why**: Keeps the slice small and reviewable. Every display surface that reads a `Track` already reads `recordingTimezone` and parses `metadata` for time summaries; adding the new fields is incremental.

**Alternatives considered**

- *New `TrackSummary` component used by all four surfaces*: rejected — would force a refactor of every consumer as a prerequisite, expands scope. The surfaces already have distinct layouts (card vs row vs detail page).
- *Render the new fields inside `TrackGpxMetadata`*: rejected — `TrackGpxMetadata` is owned by the parse pipeline, and a manual track's `timeSource` and `recordingStartAt` come from the new schema columns, not the synthetic GPX bytes.

### 7. Existing admin/my-tracks edit dialog is not extended in this slice

**Decision**: The existing edit dialog (already supports `activityTypeId` and `recordingTimezone` editing) is left unchanged. The three new columns (`recordingStartAt`, `recordingDurationSeconds`, `timeSource`) become display-only there: the existing display surfaces show them, but no edit affordance is added. Owners and admins can edit them only on the `Place on map` create path in this slice.

**Why**: Adding an edit affordance on a third surface for the same fields expands scope without a clear UX win — the existing pattern is "set on create" and re-setting requires editing the synthetic GPX bytes, which is a separate `outdoor-track-point-deletion` concern. Display-only keeps the slice focused.

**Alternatives considered**

- *Add an "Edit metadata" affordance on the existing edit dialog*: deferred to a future slice that bundles edit-with-geometry changes.

### 8. Server-side input validation reuses the existing helpers

**Decision**: `createManualTrack` validates the four new fields with the existing helpers where possible:
- `activityTypeId`: server-side existence + `isActive` check via `getActiveTrackActivityTypes` (or a small sibling that returns one by id).
- `recordingTimezone`: `requireTrackRecordingTimezone(value)` from `lib/track-recording-timezone` (already used by `updateTrackRecordingTimezone`).
- `recordingStartAt`: parsed by `new Date(value)` with an explicit `isNaN` check, normalized to UTC via `Intl.DateTimeFormat` using the validated timezone.
- `recordingDurationSeconds`: parsed from the `HH:MM` or `HH:MM:SS` form payload, range-checked (0 ≤ seconds ≤ 86,400 — at most 24 hours; matches the project's reasonable track-length ceiling).

Any malformed input falls under `VALIDATION` in the existing `code` vocabulary; trust/quota/slug/internal codes are inherited from feature-111's gates.

**Why**: Reuses the established validation surface. `VALIDATION` is the same code feature-111 already maps to from `getTrackData` / `ensureSlugAvailable` failures, so the client toast/toast-mapping does not need a new code.

**Alternatives considered**

- *Introduce a `METADATA` rejection code*: rejected — overloads the existing `VALIDATION` code without adding signal.

## Risks / Trade-offs

- **[Risk]** Existing GPX tracks all become `timeSource = GPX` after the backfill, including tracks whose GPX has no timestamps. **Mitigation**: the existing display surfaces already handle "no timestamp" via the recording-time-unavailable fallback. The badge communicates source, not timestamp presence — by design.
- **[Risk]** The four input fields extend the existing react-hook-form schema. A typing bug in one field could reject an otherwise-valid submission. **Mitigation**: each field's parser returns a discriminated `null` for malformed input and is called once at submit time, so the error is reported with a single localized message per field rather than mid-typing.
- **[Risk]** The "include seconds" toggle state lives only in client memory. If the user toggles on, types seconds, then reloads, the seconds are lost. **Mitigation**: the project has no precedent for persisting form-local UI state across reloads; the form is expected to be re-entered on reload. The toggle UX matches the form's broader "start fresh" expectation.
- **[Risk]** The duration range cap of 86,400 seconds (24 hours) silently rejects ultra-long tracks (multi-day hikes). **Mitigation**: the project already has no support for multi-day tracks (a track is one recording); 24h is the existing practical ceiling. The error message names the cap.
- **[Risk]** Adding three nullable columns to `Track` plus a data backfill `UPDATE` is the first real schema-migration scope in this slice. **Mitigation**: the columns are additive and nullable, the backfill is a single `UPDATE`, and the migration is reversible by dropping the columns.
- **[Risk]** The new enum creates a third letter-shape in the codebase (`TrackTimeSource` joins `UserTrustLevel`, `FileAssetPurpose`, etc.). **Mitigation**: matches the existing enum-naming pattern (`Track*` prefix matches `HikeStatus`, `TrackStatus`, etc.).
- **[Risk]** `parseTrackGpx` writing `timeSource` adds a write to a hot path (every track create + re-parse). **Mitigation**: the write is a single column assignment alongside the existing `metadata` write, no measurable cost difference.

## Migration Plan

1. Update `prisma/schema.prisma`: add the `TrackTimeSource` enum, add the three new columns to `Track`, run `npx prisma migrate dev --name <slice-name>` to produce the migration.
2. In the generated migration, append a single `UPDATE "Track" SET "timeSource" = 'GPX' WHERE "timeSource" IS NULL` SQL statement so the backfill is atomic with the column add.
3. Run `npx prisma generate` (also runs on `npm postinstall`).
4. Land the application code in one PR (the slice's tasks split this into reviewable steps but ships together):
   - Schema-aware server-action extension in `app/_data/tracks.ts`.
   - Form fields inside the existing `TrackFormDialog` `renderFormFields` slot.
   - `parseTrackGpx` writes `timeSource = "GPX"`.
   - Display-surface additions across the four existing renderers.
   - Localization additions to `app/i18n/locales/{en,ru}/trips.json` (or a new `tracks.json` if the string count justifies it).
5. Validation: `npm run tsc`, `npm run lint`, `npm run build`.
6. Browser-check the happy path on `/my/tracks` and `/admin/tracks` as a verified user: create a manual track with each combination of the four fields (all filled, only activity type, only start, only duration, none), and confirm the new badge and fields render on the public track detail, public track list, and an attached hike card. Verify a re-parse of an existing GPX track keeps `timeSource = GPX`. Manual QA for the persona matrix deferred to the existing `outdoor-track-creation-public-manual-qa` candidate (this slice extends the same surface and shares the same personas).
7. Rollback: revert the PR. The schema migration drops the three columns; the backfill is lost with them. Synthetic GPX tracks created during the slice behave like regular tracks after rollback because the new columns are display-only on existing surfaces. No data needs cleanup.

## Open Questions

None — every decision above is final. Future slices that may revisit `timeSource` semantics (e.g. a `MIXED` value for re-parsed-and-edited tracks) are tracked separately on the backlog under `outdoor-track-gpx-revisions` and `outdoor-track-point-deletion`.