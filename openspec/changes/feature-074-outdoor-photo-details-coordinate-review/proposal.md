## Why

People viewing a trip photo need to inspect its capture details and understand where it belongs on the route without leaving the gallery. Photo owners, trip creators, and administrators also need to review or correct a track-time coordinate from that same context instead of navigating through a separate administrator trip editor.

## What Changes

- Extend the trip photo viewer with a read-only details section for authorized viewers: extracted EXIF summary, coordinate source, and map location when a public-ready coordinate exists.
- Reuse the established EXIF presentation and track-time candidate rules, but present them in a photo-centric dialog launched from a gallery card.
- Let the photo owner or an administrator refresh the photo's stored EXIF metadata and work with its track-time coordinate candidates from the trip page; preserve administrator authority over any linked photo.
- Add compact `EXIF` and `GPX coordinates` controls to an eligible photo card. Each opens a focused modal rather than overloading the read-only viewer.
- Keep anonymous and unauthorized signed-in viewers on the existing image-only gallery/viewer path, with no new EXIF, exact-coordinate, candidate, or review data projection.
- Surface coordinate provenance and confidence so a direct EXIF GPS result remains distinguishable from an approved inferred or manually corrected location.

### Non-goals

- Changing GPX parsing, coordinate inference algorithms, photo ownership, or existing stored coordinate formats.
- Making exact coordinate data public to anonymous visitors or allowing unreviewed inferred coordinates onto the public map.
- Adding reverse geocoding, route editing, a standalone public photo page, or allowing ordinary viewers to modify another person's photo coordinate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Add authorized photo-detail, EXIF-refresh, and coordinate-review behavior from the trip gallery while retaining the existing public gallery and map visibility boundaries.
- `outdoor-photos`: Define authorized read access to extracted photo metadata plus owner-or-admin EXIF-refresh and coordinate-review controls without altering metadata extraction or coordinate persistence formats.

## Impact

- Affected public route and UI: `/trips/[slug]`, including compact photo-card controls, focused EXIF/coordinate modals, the linked-photo gallery dialog, and map-focus affordance.
- Affected server/data boundaries: narrow trip-photo detail capability and projection helpers, a server-authoritative EXIF refresh action, and coordinate-review actions; no Prisma migration is expected.
- Affected administration: factor the current trip-editor coordinate review UI into reusable photo-detail pieces without relaxing server-side authorization.
