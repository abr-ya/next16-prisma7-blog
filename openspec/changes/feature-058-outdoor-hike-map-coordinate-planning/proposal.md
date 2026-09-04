## Why

Published hike detail pages should eventually show one coherent map under the hike title and description, combining linked tracks, photo markers, and later hike notes with an all-days or single-day view. The current backlog has the right pieces, but the boundaries between track rendering, direct GPS markers, timestamp-based inference, manual correction, day filtering, and future notes need to be planned before implementation slices begin.

## What Changes

- Plan the hike map roadmap as small reviewable slices instead of implementing the full map experience at once.
- Clarify the public hike map behavior for combined linked track rendering, direct GPS photo markers, future inferred photo coordinates, tooltip-safe photo previews, and all-days/day-specific filtering.
- Define the coordinate-source model needed for photos: direct EXIF GPS first, inferred-from-track later, and manually corrected/admin-approved coordinates before public display when inference is involved.
- Identify the track timeline data needed for future photo-to-track matching, including timestamp availability and timezone ambiguity.
- Add backlog sequencing for the next outdoor map/photo-coordinate slices after the current gallery pause.
- Keep the active `feature-057-outdoor-hike-photo-gallery-viewer` paused without deleting its existing proposal/design/tasks.

Non-goals:

- No public map implementation in this planning slice.
- No schema migration, Prisma model change, GPX parser change, EXIF parser change, or route/UI code change in this slice.
- No hike note entity implementation; notes remain a future map layer once the note domain exists.
- No automatic timestamp-based coordinate inference yet.
- No standalone public photo gallery or public photo detail route.
- No hike-to-trip domain rename; this plan keeps the current `Hike` and `/hikes` terminology while remaining compatible with a future rename.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Clarifies the planned hike detail map behavior, layer ordering, photo marker sources, note deferral, and all-days/single-day filtering requirements.
- `outdoor-photos`: Clarifies how photo map coordinates should be sourced, provenanced, reviewed, and manually corrected before public map display.
- `outdoor-tracks`: Clarifies the future track timeline data expectations needed for timestamp-based photo coordinate inference.

## Impact

- Affected planning artifacts: outdoor map/photo/track specs, backlog ordering, and task sequencing for the outdoor roadmap.
- Affected future routes: `/hikes/[slug]`, `/admin/photos`, `/admin/tracks`, and any later admin review/correction surface for inferred photo coordinates.
- Affected future data models: `Hike`, hike-track associations, hike-photo associations, `Photo` extracted metadata, future photo coordinate provenance fields, and track parsed metadata/timeline representation.
- Affected public surfaces: published hike detail pages only; no standalone public photo routes are introduced.
- No runtime dependency or implementation impact in this planning slice.
