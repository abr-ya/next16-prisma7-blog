## Why

People viewing a trip photo need to inspect its capture details and understand where it belongs on the route without leaving the gallery. Photo owners, trip creators, and administrators also need to review or correct a track-time coordinate from that same context instead of navigating through a separate administrator trip editor.

## What Changes

- Extend the trip photo viewer with a read-only details section for authorized viewers: extracted EXIF summary, coordinate source, and map location when a public-ready coordinate exists.
- Reuse the established EXIF presentation and track-time candidate rules, but present them in a photo-centric dialog launched from a gallery card.
- Allow the photo owner, trip creator, or administrator to propose, approve, reject, or manually correct a track-time coordinate for that photo from the dialog; preserve administrator authority over any linked photo.
- Keep anonymous and unauthorized signed-in viewers on the existing image-only gallery/viewer path, with no new EXIF, exact-coordinate, candidate, or review data projection.
- Surface coordinate provenance and confidence so a direct EXIF GPS result remains distinguishable from an approved inferred or manually corrected location.

### Non-goals

- Changing EXIF extraction, GPX parsing, coordinate inference algorithms, photo ownership, or existing stored coordinate formats.
- Making exact coordinate data public to anonymous visitors or allowing unreviewed inferred coordinates onto the public map.
- Adding reverse geocoding, route editing, a standalone public photo page, or allowing ordinary viewers to modify another person's photo coordinate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Add authorized photo-detail and coordinate-review behavior from the trip gallery viewer while retaining the existing public gallery and map visibility boundaries.
- `outdoor-photos`: Define authorized read access to extracted photo metadata and owner/creator/admin coordinate-review controls without altering metadata extraction or coordinate persistence rules.

## Impact

- Affected public route and UI: `/trips/[slug]`, including the linked-photo gallery dialog and map-focus affordance.
- Affected server/data boundaries: narrow trip-photo detail capability and projection helpers plus existing coordinate-review actions; no Prisma migration is expected.
- Affected administration: factor the current trip-editor coordinate review UI into reusable photo-detail pieces without relaxing server-side authorization.
