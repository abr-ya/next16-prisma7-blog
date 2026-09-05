## Why

Many hike-linked photos lack EXIF GPS, so they cannot appear as map markers even when their capture time overlaps linked track recordings. Before persisting inferred coordinates, we need a small admin-facing spike that proposes track-time match candidates, lets an admin accept a suggestion, and only logs the choice so we can learn from real data.

## What Changes

- Add an admin-only control for hike-linked photos that have capture time but no direct EXIF GPS.
- Opening the control shows a modal with candidate explanations such as “within the recording window of track X” or “between track A end and track B start when those endpoints are close in time/space.”
- On admin accept, log the selected candidate details to the server/console only; do not persist inferred coordinates, map markers, or schema changes in this slice.
- Document what current track metadata can and cannot support: today tracks store `time.start` / `time.end` and simplified geometry without per-point timestamps, so true along-track interpolation may be unavailable until a later timeline-retention change.
- Keep guests and non-admin signed-in users unaffected; do not show inferred markers on the public hike map.

Non-goals:

- No Prisma migration and no stored inferred-coordinate entity.
- No public map markers from track-time inference.
- No automatic placement without explicit admin accept.
- No full timezone policy finalization beyond documenting assumptions used by the spike.
- No day filtering, notes, or participant contribution upload changes.
- No replacement for feature-060 direct EXIF GPS markers.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Adds an admin-only track-time matching spike interaction for photos without direct GPS, without public inferred markers.
- `outdoor-photos`: Clarifies spike-only candidate presentation and accept→log behavior before persistence/review workflows.
- `outdoor-tracks`: Clarifies current time-range limits versus future timestamped timeline needs for real interpolation.

## Impact

- Affected surfaces: admin hike/photo management and/or admin-only controls on hike detail; not guest public map behavior.
- Affected data: read existing photo EXIF capture time and track `metadata.summary.time` (+ geometry for optional nearness checks); may temporarily re-read GPX during spike experiments if needed, but must not require public-page reparsing.
- Follow-up: `outdoor-photo-track-time-inferred-coordinates` remains the persistence/review/map-display slice after this spike.
- Validation: OpenSpec, tsc, lint, local build, and manual admin checks with photos inside a track window, between nearby tracks, and with missing times.
