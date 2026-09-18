## 1. Map-navigation foundation

- [x] 1.1 Add a stable, labelled, programmatically focusable trip-map wrapper owned by the trip media surface.
- [x] 1.2 Route an authorized photo-details map action through the trip media parent so it closes the viewer, reveals the map, and requests focus for each selection.

## 2. Map and viewer behavior

- [x] 2.1 Preserve accepted-coordinate eligibility, all-days visibility during map focus, and existing Leaflet fly-to/zoom behavior.
- [x] 2.2 Keep the action unavailable when no accepted coordinate or rendered trip map exists, without changing unrelated photo viewer, thumbnail, or access behavior.

## 3. Verification and documentation

- [x] 3.1 Run `npm run tsc` and targeted ESLint for changed non-`app` files.
- [x] 3.2 Ask for or perform browser checks: keyboard and pointer activation from photo details; viewer close; map scroll and accessible focus; focus/zoom on direct and approved inferred/manual coordinates; no action when the map or coordinate is unavailable.
- [x] 3.3 Ask the user to run `npm run build` locally; record the result and update the OpenSpec checklist, specs, backlog, and history workflow state as appropriate.

## Validation Notes

- `npm run tsc`, targeted ESLint, `openspec validate feature-081-outdoor-trip-photo-details-map-focus --strict`, and `git diff --check` passed.
- Local `npm run build` completed successfully on 2026-09-18. Next.js emitted non-fatal `Couldn't load fs` / `Couldn't load zlib` messages while collecting page data.
- Manual browser verification passed on 2026-09-18 for keyboard/pointer map focus, viewer close, scrolling/focus, direct/inferred/manual coordinates, and unavailable-map/coordinate cases.
