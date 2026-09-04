## 1. Planning Artifacts

- [x] 1.1 Create the planning proposal for the hike map and photo coordinate roadmap.
- [x] 1.2 Add delta specs for hike map layering, direct GPS markers, inferred coordinates, day filtering, and visibility boundaries.
- [x] 1.3 Add design notes for implementation sequencing, coordinate provenance, matching risks, and day-filter semantics.

## 2. Backlog Coordination

- [x] 2.1 Mark `feature-057-outdoor-hike-photo-gallery-viewer` as paused while preserving its existing artifacts.
- [x] 2.2 Promote the map/coordinate planning work as `feature-058-outdoor-hike-map-coordinate-planning`.
- [x] 2.3 Update outdoor roadmap candidate ordering so the next slices follow combined track map, direct GPS markers, matching spike, inferred coordinates, day filtering, and later notes.
- [x] 2.4 Add or update backlog candidates for day filtering and future hike notes map behavior.

## 3. Validation

- [x] 3.1 Run `openspec validate feature-058-outdoor-hike-map-coordinate-planning --strict`.
- [x] 3.2 Confirm no application code changed, so `npm run tsc`, `npm run lint`, and `npm run build` are not required for this planning-only slice.
