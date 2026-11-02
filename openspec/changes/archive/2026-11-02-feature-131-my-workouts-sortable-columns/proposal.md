# Proposal

## Why

`feature-129-admin-table-explicit-default-sort` made **Started** sortable and gave `/my/workouts` its `started desc` default. The rest of the short workout list — **Title**, **Distance**, and **Duration** — still renders as static text, so an owner who wants the longest workout or the farthest one first has no header to click. **Type** stays an informational badge: it classifies the workout rather than ranking it, and the owner did not ask to sort by it.

Two of the sortable columns are derived rather than stored: distance and duration come from the parsed GPX summary (with the recording-duration mirror preferred). They cannot reuse a plain `accessorKey` and must sort by the same numeric value the cell renders, not by the formatted label.

## What Changes

- Make **Title**, **Distance**, and **Duration** sortable with the shared `SortableHeader`.
- Give the derived columns accessor functions that return the numeric distance and duration the cell displays, so `9 km` and `10 km` sort numerically instead of lexicographically.
- Keep **Type** as a static classification badge with no sort control.
- Keep the `started desc` default from feature-129 and the three-state sort cycle.
- Make workouts without parsed values sort after workouts that have them, in both directions.
- Keep the short workout column set unchanged: no new columns and no return of the **Updated** column.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `admin-sortable-headers`: the workout table's remaining columns sort by the values they display, and missing derived values have a defined position.

## Impact

- `components/admin-pages/tracks-workout-columns.tsx`: three headers become sortable and two columns gain accessor functions.
- The full track table and the server query are unchanged; sorting stays client-side over the already-loaded owner set.
- No data, schema, route, or localization change.

## Non-goals

- No sorting on **Type** — the activity-type badge stays informational.
- No period filtering — that is `feature-132-my-workouts-period-filter`.
- No new workout columns, no admin-only columns, and no change to the column model — that is `feature-133-track-table-column-model`.
- No persisted sort across reloads or sessions, and no server-side sorting.
- No sorting on the timezone badge or row actions.
