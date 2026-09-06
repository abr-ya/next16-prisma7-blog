## 1. Coordinate grouping

- [ ] 1.1 Add a focused, deterministic helper that groups existing public hike photo markers only when their latitude and longitude are identical, preserving the supplied photo order.
- [ ] 1.2 Keep the original eligible marker list as the source for map bounds and preserve the current single-photo marker presentation.

## 2. Grouped marker experience

- [ ] 2.1 Render multi-photo coordinate groups as one count-labelled map marker that is distinct from a single-photo marker.
- [ ] 2.2 Add a compact click popup that exposes every grouped photo's visibility-safe title and eligible thumbnail, with a bounded layout for larger groups.
- [ ] 2.3 Preserve public image and metadata boundaries: do not add provider URLs, full-image links, or unsafe metadata to map tooltips/popups.

## 3. Validation

- [ ] 3.1 Run `openspec validate feature-066-outdoor-hike-map-coincident-photo-markers --strict`.
- [ ] 3.2 Run `npm run tsc` and targeted ESLint for changed non-`app` files.
- [ ] 3.3 Ask the user to run `npm run build` locally and manually verify a single-photo marker plus a 2+ photo shared-coordinate marker on desktop and touch-sized viewports.
