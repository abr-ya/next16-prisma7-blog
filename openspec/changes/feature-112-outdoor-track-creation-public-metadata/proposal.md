# Proposal

## Why

After feature-111, a verified/trusted owner can create a hand-placed route through the `Place on map` tab. The created `Track` row carries only geometry, title, slug, description, and status — no activity type, no recording start, no duration, and no source-of-time annotation. As a result, the public track list, public track detail, trip linked-track cards, combined trip map, photo-time matching, and recording-timezone displays all show "Recording time unavailable" for a route the owner actually knows the timing of. This change lets the owner attach those four optional metadata fields at creation time so a hand-placed track carries the same time-related metadata shape an uploaded GPX does, and downstream surfaces can render it without guessing.

## What Changes

- Add three new schema columns to `Track` and one new enum `TrackTimeSource { GPX | MANUAL | NONE }` (all nullable + a data backfill that classifies every existing track as `GPX`).
- Extend `CreateManualTrackInput` to accept `activityTypeId?`, `recordingStartAt?`, `recordingDurationSeconds?`, `recordingTimezone?`, and a derived `timeSource` (computed server-side: `MANUAL` when start or duration is provided, `NONE` otherwise).
- Persist the new fields through `createManualTrack` and pass the synthetic GPX bytes through the existing `parseTrackGpx` pipeline unchanged (the new fields live on `Track`, not in `metadata`).
- Set `Track.timeSource = GPX` inside `parseTrackGpx` so uploaded GPX tracks keep their source-of-time classification when parsed or re-parsed.
- Add four optional form fields to the `Place on map` tab on `/admin/tracks` and `/my/tracks`: activity type select (reuses `getActiveTrackActivityTypes` from feature-101), datetime + IANA recording-timezone picker (reuses `lib/track-recording-timezone`), and a duration input that defaults to `HH:MM` with an optional "include seconds" toggle (storage stays `Int` seconds).
- Add a `timeSource` display badge on the new tab while editing, and on the public track detail, public track list, admin track list, and hike linked-track cards alongside the existing recording-time summaries.
- Localize the new labels and validation messages into both `en` and `ru` under the existing `tracks`/`trips` namespace.

## Non-Goals

- Not adding the four input fields to the existing `Upload GPX` tab in this slice — GPX tracks pick up the new columns automatically from `parseTrackGpx`.
- Not changing owner-side editing of activity type or recording timezone on existing GPX tracks (already shipped in admin/my-tracks edit flows; unaffected by this slice).
- Not introducing a public-facing entry-point on `/tracks` or `/trips/[slug]` for creating hand-placed tracks (deferred, parallel to feature-111's explicit deferral).
- Not adding bulk operations, undo/redo within the modal, speed-from-last-point outlier detection, or any other 111 follow-ups listed in `docs/outdoor-tracks-feature-research-2026-10-07.md` (`outdoor-track-point-deletion`, `outdoor-track-cleanup-improvements`, `outdoor-track-gpx-revisions`).
- Not changing `Track.fileAssetId` (still required), `FileAssetPurpose` (still `TRACK_GPX`), or `Track.metadata` shape.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: extends the track schema with three new nullable columns + `TrackTimeSource` enum, extends the `Place on map` creation surface with four optional metadata fields and a derived `timeSource`, classifies GPX tracks on parse, and exposes `timeSource` + the new optional fields on the existing track summary surfaces.

## Impact

- **Schemas**: additive Prisma migration adding `Track.recordingStartAt DateTime?`, `Track.recordingDurationSeconds Int?`, `Track.timeSource TrackTimeSource?` (nullable for safe backfill), new `TrackTimeSource { GPX MANUAL NONE }` enum, and a data backfill that sets every existing `Track.timeSource` to `GPX`.
- **APIs**: `CreateManualTrackInput` in `app/_data/tracks.ts` gains the four optional fields; existing `createManualTrack` result `code` vocabulary is unchanged.
- **Code**
  - **Modified**: `components/admin-pages/tracks-admin-panel.tsx` (Place on map tab renders the four new fields), `components/track-pages/track-editor.tsx` (consumes the four fields via existing `renderFormFields` slot), `app/_data/tracks.ts` (`createManualTrack` validates + persists the new fields; `parseTrackGpx` writes `timeSource = GPX`).
  - **Modified**: existing admin track list, public track list, public track detail, hike linked-track cards, and combined trip map surfaces (`components/admin-pages/tracks-admin-panel.tsx`, `components/track-pages/track-map-view-model.ts` or equivalent projection, `app/(public)/tracks/page.tsx`, `app/(public)/tracks/[slug]/page.tsx`, `components/hike-pages/hike-trip-media.tsx`) add the `timeSource` badge and the new optional fields where currently rendered as "unavailable".
- **Dependencies**: none. `lib/track-recording-timezone` and `getActiveTrackActivityTypes` are reused.
- **Localization**: new keys under `app/i18n/locales/{en,ru}/trips.json` (and/or `tracks.json` if string count justifies a new namespace) for the activity-type select, datetime+timezone picker labels, "include seconds" toggle, `timeSource` badge variants (`GPX`, `MANUAL`, `NONE`), and the duration validation message.
- **Spec**: delta at `openspec/changes/feature-112-outdoor-track-creation-public-metadata/specs/outdoor-tracks/spec.md` extending the `outdoor-tracks` capability.