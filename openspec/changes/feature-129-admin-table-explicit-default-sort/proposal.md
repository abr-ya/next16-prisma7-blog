# Proposal

## Why

The track tables arrive from the server already ordered by `updatedAt desc`, but that order exists only in the query. `DataTable` starts with no sorting state, so no header shows a direction — on `/my/tracks` the only sortable header, **Title**, renders the neutral glyph while the rows are visibly not alphabetical. An owner reads that as "sorted by Title, but broken", even though the shared sort cycle works as designed.

This is the gap left after `feature-119` and `fix-006`: the header reflects the sort state correctly, but the table has no declared initial sort to reflect. Adding sortable columns elsewhere does not fix it until the default order becomes part of the table state.

## What Changes

- Let `DataTable` accept an optional initial sorting state and apply it on first render.
- Have the track tables declare the order the server already returns: `updatedAt desc`.
- Make the **Updated** column sortable in the full track table, so the active direction is visible.
- Add a sortable **Updated** column to the workout table variant, which currently has no column that represents its server order.
- Keep the three-state sort cycle and the server query order unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `admin-sortable-headers`: a table can declare its initial sort, and that sort is visible in the header on first render.

## Impact

- `components/common/data-table.tsx`: optional initial sorting input.
- `components/admin-pages/tracks-admin-panel.tsx`: passes `updatedAt desc` for the track tables.
- `components/admin-pages/tracks-admin-columns.tsx`: **Updated** header becomes sortable.
- `components/admin-pages/tracks-workout-columns.tsx`: gains a sortable **Updated** column.
- No data, schema, route, or query change. The server keeps returning the same order.

## Non-goals

- No "Sorted by …" text hint — that is `feature-130-admin-table-default-sort-hint`.
- No persisted sort across reloads or sessions.
- No sorting added to every column or every table in the repository; only the default order and the one column that carries it become explicit.
- No change to the three-state toggle cycle or to how a cleared sort returns rows to the page-supplied order.
