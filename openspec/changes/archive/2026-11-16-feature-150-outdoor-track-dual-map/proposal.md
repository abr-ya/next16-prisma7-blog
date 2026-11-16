# Proposal

## Why

After a workout takes a route as its primary geometry, the public page shows only the route shape. The actual recorded trace is still stored, but a visitor cannot compare what was recorded with the route that replaced it. Showing both lets the owner and readers see the real recording next to the cleaned-up shape.

## What Changes

- Render the primary route map and every parsed secondary recording map on the same public track map.
- Draw the route as the primary solid line with its start/end markers; draw each recording as a thinner dashed line in a secondary color.
- Add a compact legend that names each rendered line.
- Fit the map viewport to all rendered lines, not only the primary one.
- Reuse the stored `TrackGeometry.metadata`; no re-parse, fetch, schema change, or migration.
- Show the recorded trace to every viewer. Downloading the GPX file remains visibility-gated and unchanged: the shape is public, the file is not.

## Non-goals

- Per-track visibility toggles or an owner-only recording layer; the public decision is fixed in this slice.
- Layer toggles, per-line downloads, or ordering controls.
- Rendering secondary geometry on trip maps, admin maps, or any surface other than the public track detail page.
- Parsing, repairing, or re-fetching a secondary file's GPX at render time.
- A generic N-geometry editor; `feature-143` owns managing several secondary files.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: the public track map requirement gains multiple stored geometries, the legend and secondary line style, the primary endpoints on a dual map, and bounds across all rendered lines.

## Impact

- `app/_data/tracks.ts`: select `metadata` for secondary geometries, derive a `TrackMapViewModel` per secondary file, and expose it on the public detail projection.
- `app/(public)/tracks/[slug]/page.tsx`: render the primary and secondary maps together and pass the legend flag.
- `components/track-pages/track-map.tsx` and `track-map-leaflet.tsx`: legend, secondary line style, primary endpoints when a secondary line is present, and bounds across all lines.
- `openspec/specs/outdoor-tracks/spec.md`: modified public-map requirement.
- No database migration and no new dependency.
