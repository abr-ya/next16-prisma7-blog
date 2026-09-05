## Why

Published hike detail pages already show a combined track map and a guest-safe photo gallery, but photos with stored EXIF GPS still do not appear on the map. Visitors should see where linked published photos were taken when direct GPS coordinates already exist in photo metadata, without reparsing image files or exposing private EXIF details.

## What Changes

- Place markers on the public `/hikes/[slug]` hike map for linked published photos that have stored direct EXIF GPS latitude/longitude.
- Include those photo markers in the same map viewport as linked track geometry and expand map bounds to cover both tracks and markers.
- Show visibility-safe marker tooltips with photo title and an optional thumbnail/preview URL; never expose provider URLs, full-size image bytes, raw EXIF, extraction errors, or private file details.
- Keep photos without direct GPS in the hike photo gallery only; do not invent marker positions in this slice.
- Keep the hike page usable when there are tracks but no GPS photos, GPS photos but no tracks, or neither.
- Reuse stored photo EXIF GPS summaries and the existing thumbnail route; do not parse images or fetch originals during public hike rendering.

Non-goals:

- No timestamp-based inferred coordinates, confidence scoring, or admin approval workflow.
- No manual coordinate correction UI or separate persistent map-coordinate entity beyond reading existing EXIF GPS.
- No day filtering, notes layer, or map on `/hikes` listing.
- No change to guest thumbnail / signed-in full-photo access rules from feature-057.
- No Prisma schema migration unless a later design proves one is required; this slice prefers reading existing `Photo.metadata` GPS summary.
- No photo click-to-open gallery wiring from the map marker as a required outcome (optional if low-cost and auth-safe).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Turns the planned direct-GPS photo marker and visibility-safe tooltip requirements into implemented public hike map behavior alongside the existing combined track map.
- `outdoor-photos`: Clarifies that stored direct EXIF GPS summaries are the accepted public map-marker coordinate source for this slice, while inferred/manual coordinate models remain later work.

## Impact

- Affected routes: public `/hikes/[slug]` only.
- Affected data helpers: public hike read models must derive visibility-safe marker view models (lat/lng, title, thumbnail URL) from linked published photos with successful GPS summaries; do not ship full metadata JSON to the client.
- Affected UI: hike map / Leaflet composition gains photo markers and tooltips; track polylines remain unchanged in role.
- Affected data models: existing `Photo.metadata` EXIF GPS summary; no migration planned.
- Dependencies: reuse installed `leaflet` / `react-leaflet`; no new package.
- Validation: `npm run tsc`, `npm run lint`, targeted ESLint for changed non-`app` files, local `npm run build`, and manual browser checks for hikes with tracks+GPS photos, GPS-only, tracks-only, and neither.
