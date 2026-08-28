## Why

Published track detail pages should let readers see the route shape directly on the page, not only download the GPX file or read summary numbers. The previous GPX parsing slice now stores simplified map-ready geometry, so this slice can add the first public map rendering without parsing GPX files during page requests.

## What Changes

- Add an interactive public map to `/tracks/[slug]` when a published track has successful parsed `mapGeometry`.
- Render the stored simplified polyline over OpenStreetMap-compatible tiles using the existing Leaflet/React Leaflet package direction.
- Fit the map viewport to the stored track bounds and show start/end points when geometry is available.
- Keep a graceful fallback on track detail pages when parsed geometry is missing, failed, or stale.
- Keep existing public track metadata, GPX summary, and GPX download availability behavior.
- Keep map rendering client-only so Next.js server rendering does not load browser-only Leaflet APIs.

Non-goals:

- No GPX parsing, reparsing, or geometry simplification changes in this slice.
- No map on `/tracks` listing.
- No hike detail combined track map.
- No photo GPS markers, time matching, manual points, layer controls, or route editing.
- No new public geometry API endpoint.
- No changes to draft/private visibility rules or GPX download authorization.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: Add public single-track map rendering on published track detail pages when stored map-ready geometry is available.

## Impact

- Routes/UI: update `/tracks/[slug]` detail rendering with a client-only track map component and fallback state.
- Components: add a reusable public track map component under the existing component/module layout.
- Data: reuse stored `Track.metadata.mapGeometry` and summary bounds exposed by existing public track helpers; do not read or parse raw GPX in the map slice.
- Dependencies: use existing `leaflet` and `react-leaflet`; no new package is expected.
- Styling/assets: include Leaflet marker/tile CSS handling compatible with Next.js client components.
- Validation: run `npm run tsc`, `npm run lint`, targeted ESLint for changed non-app files, ask for local `npm run build`, and manually check the map in a browser because Leaflet is browser-only.
