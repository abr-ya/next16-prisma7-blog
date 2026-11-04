# Proposal

## Why

Feature-129 made a table's declared initial sort visible on that column's header, but two states still have no glyph at all: when the owner clears the sort, the rows silently fall back to the page-supplied order while every header shows the neutral indicator, and a table whose meaningful order has no sortable column cannot express it. The result is that a deliberate order can look like a broken or random one.

## What Changes

- Extend the shared `DataTable` with an optional, already-localized `defaultSortHint` that names the order the page supplies. The hint is non-interactive and renders only while no column sort is active, so it never competes with a header glyph.
- Wire the hint into the owner/admin track table and the owner workout table, naming `recently updated` and `most recently started` respectively.
- Add the English and Russian copy for the hint to the `trips` resource namespace, matching the existing `workoutWeek*` keys.
- Keep the adoption path to one prop per table, so the remaining tables can be rolled out in a follow-up change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `admin-sortable-headers`: the shared data table gains a fallback-order hint for the states where no header glyph can describe the effective order.

## Impact

- `components/common/data-table.tsx`: new optional prop and the footer slot that renders the hint next to the pagination controls.
- `components/admin-pages/tracks-admin-panel.tsx`: passes the variant-appropriate hint for `/my/tracks`, `/admin/tracks`, and `/my/workouts`.
- `app/i18n/locales/{en,ru}/trips.json`: the localized hint wording.
- No schema change, no new query, no change to sorting, pagination, or row order, and no change to tables outside the three track/workout surfaces.

## Non-goals

- Rolling the hint out to every admin table; that is the follow-up candidate `admin-default-sort-hint-rollout`.
- Adding a new toolbar or moving the existing table controls.
- Changing the three-state sort cycle, the initial sort, or the server-supplied row order.
- Localizing the rest of the admin tables; that remains `feature-137-my-workspace-localization`.
