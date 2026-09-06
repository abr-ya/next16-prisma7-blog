## Why

On multi-day hikes, the all-days map can combine route geometry and photo markers from many separate days into a crowded, hard-to-read view. Visitors need to isolate one day without losing the useful default overview, and the control must remain compact for hikes lasting up to two weeks.

## What Changes

- Add a public hike-map view selector adjacent to the map with `All days` as the default and one option for each calendar day in the hike's inclusive date range.
- Filter only confidently date-assigned public track geometry and photo markers when a day is selected; keep all eligible map layers visible in the default all-days view.
- Refit and recenter the map from the visible layers whenever the selection changes, returning to all visible hike layers on `All days`.
- Show a clear empty state when the selected day has no confidently date-assigned map layers instead of displaying other days' data.

Non-goals:

- No manual day assignment, date correction, timezone correction, track splitting, or changes to coordinate inference/review.
- No URL/query-state persistence, map notes layer, clustering changes, or changes to photo/track visibility and download rules.
- No date filter on the hike gallery or linked-track cards outside the map.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Turn the planned all-days/single-day map mode into a public, date-safe filter with visible-layer bounds behavior.

## Impact

- Affected public surface: `/hikes/[slug]` interactive map and its immediate controls.
- Affected data/view models: public map layers need visibility-safe, date-assignment information derived from existing hike dates and stored track/photo time metadata; no Prisma schema change is expected.
- Affected components: hike map wrapper and Leaflet rendering/filter bounds behavior.
- Security and privacy: the filter must never surface draft/private layers or turn ambiguous timestamps into a claimed day; all existing thumbnail and full-image boundaries remain unchanged.
