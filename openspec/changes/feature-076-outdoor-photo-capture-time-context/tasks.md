## 1. Labelled photo capture-time presentation

- [x] 1.1 Add a shared formatter for a stored photo capture instant that returns readable UTC context and an explicit timezone-evidence label without relying on the browser timezone for the comparison value.
- [x] 1.2 Render that labelled context in the existing authorized photo details, preserving the unavailable state and current access boundaries.

## 2. Coordinate-review context

- [x] 2.1 Extend the authorized hike/trip photo-detail projection with the candidate source track recording timezone needed to render a labelled range.
- [x] 2.2 Render the photo UTC/evidence context and source-track range in the coordinate-review dialog for every automatic candidate, without altering candidate construction or approval payloads.
- [x] 2.3 Add deterministic coverage for the Sofia case: distinguish the stored photo UTC instant from its viewer-local display and preserve the existing previous-day/inside-window outcome.

## 3. Documentation and verification

- [x] 3.1 Mark the promoted backlog candidate as In Progress and keep `outdoor-photo-capture-timezone-normalization` as the separate future correction path.
- [x] 3.2 Run `openspec validate feature-076-outdoor-photo-capture-time-context --strict`, `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` for changed `app` files.
- [ ] 3.3 Ask the user to run `npm run build` locally and manually verify the labelled photo timestamp in the authorized photo-detail flow. Defer real-photo coordinate-review QA until a suitable photo without direct GPS is available.
