## 1. Date-safe map layer inputs

- [x] 1.1 Extend the versioned photo EXIF metadata reader/writer with optional capture-time timezone evidence, preserving compatibility for existing metadata.
- [x] 1.2 Add focused date-key helpers that create the hike's inclusive UTC day range and only assign a timestamp to a day when its timezone evidence is `UTC_OR_OFFSET`.
- [x] 1.3 Extend public map track and photo view models with visibility-safe day-key membership, assigning timezone-safe tracks to each overlapping hike day and keeping ambiguous or legacy layers all-days-only.

## 2. Public map day selector

- [x] 2.1 Add a client-side hike-map wrapper with a compact select adjacent to the map for multi-day hikes, defaulting to `All days` and omitting the control for a single-day hike.
- [x] 2.2 Filter tracks and photo markers by the selected day while keeping all layers in the default view and preserving existing marker grouping and visibility-safe popup behavior.
- [x] 2.3 Refit and recenter Leaflet bounds using only selected-day layers; render a clear empty state without stale map content when no confidently dated layer matches.

## 3. Validation

- [x] 3.1 Run `openspec validate feature-067-outdoor-hike-map-day-filter --strict`.
- [x] 3.2 Run `npm run tsc` and targeted ESLint for changed non-`app` files.
- [ ] 3.3 Ask the user to run `npm run build` locally and manually verify all-days, a selected day with layers, a selected empty day, a multi-day hike with 10+ options, and a single-day hike.
