## 1. Public Hike Map Read Model

- [ ] 1.1 Extend the public hike detail read model to include stored map-ready geometry and summary bounds for linked published tracks.
- [ ] 1.2 Reuse the existing track metadata state helper so only current successful map geometry with at least one point becomes map-eligible.
- [ ] 1.3 Keep draft tracks, failed or stale parse payloads, provider URLs, and raw GPX file URLs out of the public hike map view model.

## 2. Combined Track Map Component

- [ ] 2.1 Generalize the existing client-only Leaflet renderer to accept one or more serializable track map view models without changing `/tracks/[slug]` call sites.
- [ ] 2.2 Fit the map viewport to the combined stored bounds of the rendered tracks, with single-point fallback consistent with the current track map.
- [ ] 2.3 Preserve start and end markers when exactly one mapped track has at least two geometry points.
- [ ] 2.4 Render distinct polylines for two or more mapped tracks without requiring per-track start and end markers.
- [ ] 2.5 Keep Leaflet behind the existing dynamic client-only import and stable map container sizing.

## 3. Public Hike UI

- [ ] 3.1 Render the combined track map on `/hikes/[slug]` under the hike title and description when at least one linked published track is map-eligible.
- [ ] 3.2 Omit the hike map when no linked published track has current map-ready geometry, while keeping the existing linked-track list.
- [ ] 3.3 Keep the existing linked published track list and photo section; do not add photo markers, day filters, or notes.
- [ ] 3.4 Leave `/hikes` listing and `/tracks/[slug]` map behavior unchanged.

## 4. Documentation And Validation

- [ ] 4.1 Update outdoor map notes or other implementation docs that still describe the hike combined map as future work.
- [ ] 4.2 Run `openspec validate feature-059-outdoor-hike-combined-track-map --strict`.
- [ ] 4.3 Run `npm run tsc`.
- [ ] 4.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 4.5 Ask the user to run `npm run build` locally and confirm the result before considering routing/map behavior complete.
- [ ] 4.6 Manually check `/hikes/[slug]` in the browser for hikes with zero, one, and several mapped tracks, plus a mixed-geometry hike, on desktop and a narrow viewport.
