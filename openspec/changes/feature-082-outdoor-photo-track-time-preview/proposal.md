## Why

Coordinate reviewers can read a track-time candidate's explanation and proposed latitude/longitude, but cannot see where that point sits on the source track or explore a small possible capture-time discrepancy before deciding. A protected visual preview makes the review decision more understandable without treating a speculative offset as saved photo metadata.

## What Changes

- Add a compact map preview to the authorized trip-photo coordinate-review modal for an inside-track-window candidate with usable timed GPX geometry.
- Let the reviewer select temporary offsets from the stored capture time in one-hour steps from -2 to +2 hours and see the recalculated point on that candidate's source track.
- Display the previewed time, coordinate, and an explicit out-of-track state when the offset falls outside the source track's recorded timeline.
- Keep approval tied to the original server-proposed candidate; the preview offset does not modify EXIF capture time, candidate selection, matching logic, or persisted coordinate data.

## Non-goals

- Re-run candidate selection across multiple tracks, change between-track or after-finish candidates, or persist a chosen time offset.
- Add public map data, expose protected track timeline/geometry to unauthorized viewers, or introduce a new mapping dependency.
- Change manual-coordinate approval or the existing public trip-map behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: Extend authorized photo coordinate review with a protected, non-persistent inside-track time-offset map preview.

## Impact

- Affects the authenticated owner-or-admin coordinate-review modal on published `/trips/[slug]` pages, its private detail projection, and existing client-only Leaflet map composition.
- No Prisma schema, migration, server write contract, public map projection, or new dependency is required.
