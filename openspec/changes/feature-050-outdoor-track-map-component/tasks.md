## 1. Public Map Data

- [ ] 1.1 Confirm public track detail helpers expose successful `mapGeometry` and bounds only for `PUBLISHED` tracks.
- [ ] 1.2 Keep public track listing helpers from requiring full map geometry payloads.
- [ ] 1.3 Add or refine a serializable track map view model for the detail page.

## 2. Client Map Component

- [ ] 2.1 Add a browser-only public track map component that renders Leaflet/React Leaflet without server-side Leaflet access.
- [ ] 2.2 Render OSM-compatible tiles and the stored route geometry as one ordered polyline.
- [ ] 2.3 Fit the map viewport to route bounds and handle one-point or small-geometry edge cases.
- [ ] 2.4 Render visually distinct start and end markers based on geometry order.
- [ ] 2.5 Ensure Leaflet CSS and marker assets render correctly in Next.js.
- [ ] 2.6 Give the map stable responsive dimensions so it cannot render as a zero-height or overlapping container.

## 3. Track Detail Integration

- [ ] 3.1 Add the map to `/tracks/[slug]` only when successful map-ready geometry is available.
- [ ] 3.2 Show a non-failing fallback when geometry is missing, failed, stale, or too small to map.
- [ ] 3.3 Preserve existing public track title, description, GPX summary, file metadata, and download behavior.
- [ ] 3.4 Ensure draft track detail requests still respond as not found and never expose geometry.

## 4. OpenSpec Tracking and Validation

- [ ] 4.1 Update `openspec/backlog.md` so `outdoor-track-map-component` is marked `In Progress` with `feature-050-outdoor-track-map-component`.
- [ ] 4.2 Update docs/checklists if implementation changes the outdoor map package notes or public track behavior documentation.
- [ ] 4.3 Run `npm run tsc`.
- [ ] 4.4 Run `npm run lint`.
- [ ] 4.5 Run targeted ESLint for changed non-app files when needed.
- [ ] 4.6 Ask the user to run `npm run build` locally and report the result because this slice adds browser-only map rendering.
- [ ] 4.7 Ask the user to manually check `/tracks/[slug]` in desktop and mobile browser widths with parsed geometry, missing geometry, stale/failed metadata, and draft track cases.
