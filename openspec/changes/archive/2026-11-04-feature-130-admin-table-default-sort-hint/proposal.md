# Proposal

## Why

Feature-129 made a table's declared initial sort visible on that column's header, but the glyph alone is easy to miss and cannot express the order when the sort has been cleared: the rows silently fall back to the page-supplied order while every header shows the neutral indicator. A table whose meaningful order has no sortable column cannot express it either. The result is that a deliberate order can look broken or random.

## What Changes

- Add an always-visible sort status above the shared `DataTable`: it names the active column and direction, or the fallback order supplied by the page when no column is sorted. The line is non-interactive and never changes sorting, row order, or pagination.
- Give the sortable columns of the track and workout tables a textual `sortLabel`, because their rendered headers are components rather than strings; the status uses that label so it matches the header the owner sees.
- Add an optional `headerActions` slot to the same table header row, so the page's primary action (the quick-upload buttons and `Add track`) sits on the status line instead of one row above it.
- Wire the status into the owner/admin track table and the owner workout table, with `recently updated` and `most recently started` as their fallback copy.
- Add the English and Russian wording for the active-sort and fallback sentences to the `trips` resource namespace.
- Keep the adoption path to one status configuration per table, so the remaining tables can be rolled out in a follow-up change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `admin-sortable-headers`: the shared data table gains an always-visible sort status that names the current column sort or the fallback order.

## Impact

- `components/common/data-table.tsx`: new `defaultSortHint` / `formatSortStatus` props, a `headerActions` slot, and the row above the table that renders them.
- `components/admin-pages/tracks-admin-panel.tsx`: passes the variant-appropriate status formatter and moves the quick-upload/`Add track` group into the table header row for `/my/tracks`, `/admin/tracks`, and `/my/workouts`.
- `components/admin-pages/tracks-admin-columns.tsx` and `components/admin-pages/tracks-workout-columns.tsx`: textual `sortLabel` metadata on the sortable columns.
- `app/i18n/locales/{en,ru}/trips.json`: the localized active-sort and fallback sentences.
- No schema change, no new query, no change to sorting, pagination, or row order, and no change to tables outside the three track/workout surfaces.

## Non-goals

- Rolling the hint out to every admin table; that is the follow-up candidate `admin-default-sort-hint-rollout`.
- Adding a new toolbar or moving the existing table controls.
- Changing the three-state sort cycle, the initial sort, or the server-supplied row order.
- Localizing the rest of the admin tables; that remains `feature-137-my-workspace-localization`.
