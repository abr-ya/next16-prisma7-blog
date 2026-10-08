# Proposal

## Why

Photos taken on mirrorless cameras without a configured EXIF timezone (or whose EXIF was stripped during import) are currently shown on public trip pages with a red "Capture date unavailable" badge, even when the system already has strong evidence for the correct capture time: the camera-local wall time from EXIF plus exactly one linked track with a known IANA timezone. The track-time matching pipeline already uses this evidence to propose map coordinates, so the gallery's "undated" state is conservative rather than incorrect.

The only path to clear the badge is buried inside a dialog titled "GPX coordinates", so users have no obvious next step when they see the warning. This blocks the common case (a single-timezone trip shot on a camera whose "Time zone" menu was off) and makes the recovery action discoverable only by accident.

## What Changes

- Apply a view-time `TRACK_DEFAULT` timezone fallback in the public trip photo projection so single-track photos with `MISSING` EXIF timezone evidence are dated automatically from the linked track.
- Add a dedicated owner/admin/participant control on each trip photo card that opens a focused timezone dialog (separate from "GPX coordinates") for cases the fallback cannot resolve: multi-track timezones, no linked track, or an explicit user override.
- Add a paired `clearHikePhotoCaptureTimezone` server action that removes a previously confirmed normalization, mirroring the `INFERRED_TRACK_TIME` coordinate review behavior of the existing confirm action.
- Localize the new affordance and dialog in the existing `trips` namespace, with English fallback. No new global dependencies.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-photos`: Add view-time timezone inference for the public trip photo projection and a discoverable owner/admin/participant timezone confirm-and-clear flow.

## Impact

- Affects `app/_data/hikes/{internal,mutations,index,types}.ts`, `lib/photo-exif-metadata.ts`, `components/hike-pages/{hike-photo-gallery,hike-photo-timezone-confirm}.tsx`, `app/i18n/locales/{en,ru}/trips.json`.
- Reuses the existing `derivePhotoCaptureInstantUtc`, `normalizeTrackRecordingTimezone`, `getPhotoDetailAccess`, and `confirmHikePhotoCaptureTimezone` primitives. No schema, migration, or trust/quota change.
- Does not add MakerNote timezone extraction (covered separately by `outdoor-photo-exif-gps-fixture-coverage`), manual capture date entry (covered separately by `outdoor-photo-manual-capture-date`), or changes to the matching/coordinate-review pipeline.
