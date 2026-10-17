# Proposal

## Why

Feature-112 added three optional `Track` columns — `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` (`GPX` / `MANUAL` / `NONE`) — plus the `Place on map` form fields, but it explicitly deferred all display work to feature-113. Today a hand-placed track the owner knows the timing of still shows "Recording time unavailable" everywhere a viewer looks, and there is no visible signal that distinguishes a `GPX`-parsed track from a `MANUAL`-created one. This change exposes the four new data points on the existing track surfaces so a visitor, owner, or administrator can see where each track's time metadata came from without leaving the page they were reading.

## What Changes

- Add a localized `timeSource` badge (`GPX` / `MANUAL` / `NONE`) on the public track detail page, public track list card, `/admin/tracks` row, and published-trip linked-track card.
- On the same four surfaces, when `timeSource === MANUAL`, render an optional `Recording start` line (formatted via the existing `formatTrackRecordingDateTime` helper using the track's `recordingTimezone`) and an optional `Recording duration` line (formatted via `formatTrackDuration`) when each respective column is non-null.
- Extend the read-side `PublicTrack`, admin track list row, and hike linked-track card projections in `app/_data/tracks.ts` to expose `recordingStartAt`, `recordingDurationSeconds`, and `timeSource`.
- Add new i18n keys under `app/i18n/locales/{en,ru}/trips.json` for the `GPX` badge variant and the two new optional display labels; reuse the existing `placeOnMapTimeSourceManual` / `placeOnMapTimeSourceNone` keys (already used by the `Place on map` tab) for the badge variants so the editor and the public surfaces agree on the wording.

### Non-goals

- Not changing the existing `parsed.summary.time` block on `/tracks/[slug]` for GPX tracks — that block already renders start/finish/duration/timezone/timezone-evidence from GPX parsing and continues to be the source of truth for GPX-sourced tracks. The new MANUAL-only lines sit alongside, not on top of, the existing block.
- Not changing the `Place on map` editor's existing `timeSource` read-only badge or the four input fields on that tab (already shipped by feature-112).
- Not changing owner-side editing of `recordingStartAt` / `recordingDurationSeconds` / `recordingTimezone` for GPX tracks (already shipped in admin/my-tracks edit flows; affects a separate candidate — `outdoor-track-edit-hide-manual-recording-fields-for-gpx`).
- Not adding sorting, filtering, badges in lists beyond the four surfaces above, or a public-facing badge legend.
- Not persisting `recordingStartAt` / `recordingDurationSeconds` on GPX-uploaded tracks — those rows always continue to use `metadata.summary.time` for derived times and remain `recordingStartAt = recordingDurationSeconds = null` at the column level.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: extends the existing track summary requirements to render the stored `timeSource` enum as a localized badge on the four surfaces above, and to render the optional `recordingStartAt` / `recordingDurationSeconds` columns as new display lines when `timeSource === MANUAL`.

## Impact

- **Schemas**: no Prisma changes. `Track.recordingStartAt`, `Track.recordingDurationSeconds`, `Track.timeSource`, and `TrackTimeSource { GPX, MANUAL, NONE }` are already in place from feature-112.
- **Code**
  - **Modified**: `app/_data/tracks.ts` — extend `publicTrackInclude`, the admin track list select, and the linked-track card projection in `getPublicTripMediaWithTracks` (or its successor) to expose `recordingStartAt`, `recordingDurationSeconds`, `timeSource` alongside the existing `recordingTimezone`.
  - **Modified**: `app/(public)/tracks/[slug]/page.tsx`, `app/(public)/tracks/page.tsx`, `app/admin/tracks/page.tsx`, and `components/hike-pages/hike-trip-media.tsx` — add the `timeSource` badge and the conditional MANUAL-only lines using existing formatters (`formatTrackDuration`, `formatTrackRecordingDateTime`) from `lib/track-gpx-metadata.ts`.
  - **Read-only helpers**: optional small addition in `lib/track-gpx-metadata.ts` — a `formatTrackTimeSource` helper to render `GPX` / `MANUAL` / `NONE` from the enum (mirrors the existing `formatTrackTimezoneEvidence` shape).
- **Localization**: new keys under `app/i18n/locales/{en,ru}/trips.json` — `trackTimeSourceGpx` (badge label), `trackTimeSourceManual` (alias of the existing `placeOnMapTimeSourceManual` for shared use, or a new key with identical value), `trackTimeSourceNone` (alias or new), `trackRecordingStartLabel` (display-only "Recording start" label that mirrors the existing `placeOnMapRecordingStartLabel`), `trackRecordingDurationLabel` (display-only "Recording duration" label).
- **Spec**: delta at `openspec/changes/feature-113-outdoor-track-recording-metadata-display/specs/outdoor-tracks/spec.md` extending the `outdoor-tracks` capability with the four new display scenarios.