## Why

The hike map can already combine tracks and photos, but it cannot capture or explain important moments that have no media asset: a viewpoint, route decision, campsite, or warning. This slice establishes a small, admin-curated hike-note domain and makes eligible published notes useful on the public hike map.

## What Changes

- Add admin-managed hike notes with a title, optional body, optional map coordinate, optional hike-day assignment, and explicit draft/published status.
- Keep every note owned by one hike; validate an assigned date against that hike's inclusive date range and require latitude/longitude as a valid pair.
- Add note management to the existing admin hike workflow, including create, edit, and confirmed delete actions for admins.
- Render published, coordinate-bearing notes as visibility-safe markers on the public published hike map; include them in the existing all-days/single-day filtering when a note has an assigned hike day.
- Keep notes with no coordinate out of the map and notes without a day assignment in the all-days view only.

**Non-goals:** public note authoring, participant permissions, rich text/media attachments, standalone public note pages, route-segment snapping, timestamp interpolation, and map-marker editing by dragging.

## Capabilities

### New Capabilities

- `outdoor-hike-notes`: Admin-curated hike notes with scoped location, day, status, and lifecycle rules.

### Modified Capabilities

- `outdoor-hike-media-map`: Render visibility-safe published hike-note markers and apply existing day filtering rules to them.

## Impact

- Affected data: new `HikeNote` model and note status enum, related to `Hike`, with a Prisma migration and generated client refresh.
- Affected admin surface: `/admin/hikes` and its server actions/components.
- Affected public surface: `/hikes/[slug]` map view model and Leaflet map component.
- No new dependency or external API is expected.
