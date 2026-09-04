## Why

Published hike detail pages already list linked tracks, but the route story still lives on each `/tracks/[slug]` map. Visitors should see all linked visible tracks together on `/hikes/[slug]`, under the hike title and description, using stored map-ready geometry and combined bounds. Feature-058 planned this as the first public hike map slice, and hike-track associations plus the single-track Leaflet map are now in place.

## What Changes

- Add one public combined track map to published `/hikes/[slug]` pages when at least one linked published track has current successful map-ready geometry.
- Place that map under the hike title and description, before the linked-track list and photo section.
- Render all eligible linked track polylines in one map viewport and frame the combined bounds.
- Reuse stored parsed track geometry and bounds; do not parse or fetch raw GPX during public hike rendering.
- Keep the hike page usable when no linked published track has map-ready geometry, without showing a broken map.
- Preserve the existing linked published track list, public track detail maps, and public visibility boundaries.

Non-goals:

- No photo GPS markers, inferred coordinates, marker tooltips, or day filtering.
- No hike notes layer.
- No map on `/hikes` listing.
- No GPX parser, simplification, or Prisma schema change.
- No change to `/tracks/[slug]` map behavior, GPX downloads, or draft/private visibility rules.
- No layer toggles, track legend as a required UI, or route editing.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Turns the planned combined hike track map into implemented public hike detail behavior for linked published tracks with current map-ready geometry, including placement, combined bounds, mixed-geometry fallback, and explicit exclusion of photo markers in this slice.

## Impact

- Affected routes: public `/hikes/[slug]` only.
- Affected data helpers: public hike read models need visibility-safe map geometry and bounds for linked published tracks; admin hike reads do not need a map in this slice.
- Affected UI: a hike-centered map component composed from the existing Leaflet/React Leaflet track map direction.
- Affected data models: existing `Hike`, hike-track associations, and `Track.metadata` map geometry; no migration.
- Dependencies: reuse installed `leaflet` and `react-leaflet`; no new package.
- Validation: `npm run tsc`, `npm run lint`, targeted ESLint for changed non-`app` files, local `npm run build`, and a manual browser check of `/hikes/[slug]` with zero, one, and several mapped tracks.
