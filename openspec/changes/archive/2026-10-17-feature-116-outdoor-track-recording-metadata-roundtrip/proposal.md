# Proposal

## Why

Feature-112 added the three optional `Track` columns — `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` — and the `Place on map` editor for hand-placed tracks. Feature-113 then surfaced them on the four display surfaces. Today the data still flows one way: `parseTrackGpx` populates `Track.metadata.summary.time` but never mirrors `summary.time.start` / `summary.time.durationSeconds` into the new columns, and the admin / owner edit dialog (`tracks-admin-panel.tsx`) hard-resets `recordingStartAt` and `recordingDurationSeconds` to `""` / `"0"` on every open and the submit path never reads them. The practical consequence, observed while editing a `MANUAL` track on `2026-10-16`, is that an owner can fill the start and duration on the editor, save, and immediately re-open the dialog to find the values gone — neither saved nor shown — and a `GPX` track with parsed timestamps never gets a column-level start/duration at all, forcing the four display surfaces to special-case GPX rows against `metadata.summary.time`. This change closes the loop: every `Track` row ends up with consistent `recordingStartAt` / `recordingDurationSeconds` values, editable on the form for `MANUAL` rows and derived-but-persisted for `GPX` rows, so a single read path serves every surface and the form reflects the truth.

## What Changes

- **GPX parse writes the new columns**: `parseTrackGpx` in `app/_data/tracks.ts` reads `metadata.summary.time.start` and `metadata.summary.time.durationSeconds` from the parse result and writes them to `Track.recordingStartAt` and `Track.recordingDurationSeconds` (or leaves them `null` when `summary.time` is `null`). The existing `metadata.summary.time` block is untouched and remains the authoritative GPX source for the four display surfaces — the column values become a column-level mirror so the read path is uniform.
- **Edit dialog pre-fills the saved values**: the form reset hook in `tracks-admin-panel.tsx` (currently hard-coded to `""` / `"0"` per feature-112 decision 7) is split by `timeSource`. For `timeSource === MANUAL` the four optional fields (`recordingStartAt`, `recordingTimezone`, the `HH:MM`/`HH:MM:SS` duration trio) load the saved values from the row so the owner can edit them. For `timeSource === GPX` the four fields render read-only with the parsed values from the row, so the dialog can no longer suggest the fields are editable when the values come from a file.
- **MANUAL edit persists through a new server action**: add `updateTrackRecordingMetadata` in `app/_data/tracks.ts` (parallel to the existing `updateTrackRecordingTimezone`) that the edit submit path calls after `updateTrack` for `MANUAL` rows. It writes `recordingStartAt` (parsed through `parseManualTrackStartAt` when a wall-clock + IANA timezone is present) and `recordingDurationSeconds` (parsed through `parseDurationInput`), both with the same trust/ownership gate the other track mutations already enforce.
- **Spec correction**: the feature-113 ADDED requirement `GPX tracks keep parsed times as the source of truth and do not write the new columns` is MODIFIED to the opposite — `GPX tracks write recordingStartAt and recordingDurationSeconds from metadata.summary.time during parse`. The display-side scenarios from feature-113 are unchanged; only the persistence rule flips so a single read path (`Track.recordingStartAt` / `Track.recordingDurationSeconds`) can serve every surface.

### Non-goals

- Not changing the public track map, public track list, public track detail, admin track list, or hike linked-track card render path. The four display surfaces already read `Track.recordingStartAt` / `Track.recordingDurationSeconds` / `Track.timeSource` after feature-113, so this change only affects what those columns contain, not how the surfaces render them.
- Not changing the `Place on map` create flow. feature-112 already persists `recordingStartAt` / `recordingDurationSeconds` correctly through `createManualTrack`; this slice does not touch that path.
- Not introducing a separate `recordingStartAt` / `recordingDurationSeconds` server action for `GPX` rows. The values land through the existing `parseTrackGpx` path; there is no admin / owner "edit recording metadata on a GPX track" affordance in this slice.
- Not adding timezone-evidence-driven re-derivation of `recordingStartAt` after the fact, and not changing the existing `recordingTimezone` selection action (`updateTrackRecordingTimezone`). The four new fields share the same `recordingTimezone` the row already carries.
- Not changing the `upload-thing` / `fileAsset` lifecycle, the parse pipeline shape, the `TrackGpxMetadata` shape, or the `TrackTimeSource` enum. This slice is purely a column-write fix and a form-rendering fix on top of the schema feature-112 already shipped.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: the requirement added in feature-113 named `GPX tracks keep parsed times as the source of truth and do not write the new columns` is MODIFIED to the opposite (`GPX tracks write recordingStartAt and recordingDurationSeconds from metadata.summary.time during parse`) and its two scenarios are rewritten. A new ADDED requirement covers the `updateTrackRecordingMetadata` server action and the read-only vs editable form behaviour for `MANUAL` vs `GPX` rows. The display-side requirements added in feature-113 stay as they are; their behaviour does not change.

## Impact

- **Schemas**: no Prisma migration. `Track.recordingStartAt`, `Track.recordingDurationSeconds`, and `Track.timeSource` are already in place from feature-112; this slice only changes which code paths write them.
- **Code**
  - **Modified**: `app/_data/tracks.ts`
    - `parseTrackGpx` (~line 676) — extract `summary.time.start` and `summary.time.durationSeconds` from the parsed `metadata` (or `metadataToPersist`) and add `recordingStartAt: new Date(summary.time.start)` and `recordingDurationSeconds: summary.time.durationSeconds` to the `prisma.track.update` payload when `summary.time` is non-null; fall back to `null` when `summary.time` is `null`. The `timeSource: "GPX"` write is unchanged.
    - New `updateTrackRecordingMetadata` (~line 635, parallel to `updateTrackRecordingTimezone`) — accepts `{ id, recordingStartAt?, recordingDurationSeconds?, recordingTimezone? }`; runs the existing `requireTrackRecordingTimezone` gate on the timezone; runs `parseManualTrackStartAt` on the wall-clock+timezone pair when both are non-empty; runs `parseDurationInput` on the duration triple; writes the four columns through a single `prisma.track.update`; calls `revalidateTrackDetailPaths(track.slug)` and revalidates the trip pages for every `HikesToTracks` association, matching the existing action's pattern.
  - **Modified**: `components/admin-pages/tracks-admin-panel.tsx`
    - The form reset `useEffect` (~line 260-286) splits by `track.timeSource`:
      - `MANUAL` — populate `recordingStartAt` from `track.recordingStartAt?.toISOString().slice(0, 16)` (or `""` when `null`), `recordingTimezone` from `track.recordingTimezone ?? ""`, the three duration fields from `parseStoredDurationToHms(track.recordingDurationSeconds)`, and `includeSeconds` from whether the original seconds were non-zero.
      - `GPX` (and the legacy `null` fallback while older rows are still in flight) — populate the same fields from the row, but render the four inputs with `readOnly` / `disabled` and a localized "from file" hint.
    - The `onSubmit` (~line 371) path for the edit branch (`track` is set) — after the existing `updateTrack` call, dispatch to the new `updateTrackRecordingMetadata` server action when `track.timeSource === "MANUAL"`, sending the parsed `recordingStartAt` / `recordingDurationSeconds` from the same parse block the create path already runs.
- **Localization**: small add to `app/i18n/locales/{en,ru}/trips.json` — a single new key per locale, e.g. `trackRecordingMetadataFromFileHint` (the read-only "from file" hint shown on the four inputs when `timeSource === "GPX"`). All other labels (`Recording start`, `Recording duration`, `timeSource` badge) already exist in both locales after feature-113 and are reused.
- **Spec**: delta at `openspec/changes/feature-116-outdoor-track-recording-metadata-roundtrip/specs/outdoor-tracks/spec.md` with one MODIFIED requirement (the GPX no-write rule from feature-113) and one ADDED requirement (the new server action + form rendering for `MANUAL` vs `GPX`).
