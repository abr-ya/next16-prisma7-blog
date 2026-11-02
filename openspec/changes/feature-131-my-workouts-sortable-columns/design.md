# Design

## Context

The workout table is built by `createTrackWorkoutColumns` in `components/admin-pages/tracks-workout-columns.tsx`. It is a short owner-side list: badges, title, started, timezone, distance, duration, type, and row actions. `feature-129` made **Started** sortable through an accessor and set `started desc` as the default. The other columns still render without a sort control.

Distance and duration are computed at render time:

- distance is `state.summary.distanceMeters` when the parse state is successful;
- duration prefers the stored `recordingDurationSeconds` and falls back to `state.summary.time.durationSeconds`.

A plain string sort on those cells would order `10 km` before `9 km` and `2 h` before `45 min`, so the sort value has to be the raw number.

## Decision: accessors mirror the cell values

Each sortable column exposes exactly the value its cell renders:

| Column | Accessor | Sorting |
| --- | --- | --- |
| Title | `accessorKey: "title"` | default text comparison |
| Started | effective start (already present from feature-129) | datetime |
| Distance | parsed `distanceMeters`, or `undefined` | numeric |
| Duration | stored or parsed duration in seconds, or `undefined` | numeric |
| Type | localized activity-type name, or the unclassified label | text |

**Type** sorts by the label the owner sees, so switching the interface language keeps the visible order consistent with the words in the column. Sorting by the underlying activity-type key would put rows in an order the owner cannot predict from the screen.

### Missing values

Distance and duration exist only when the GPX parse succeeded; started exists once a recording start is known. Those accessors return `undefined` and the column sets TanStack's `sortUndefined: "last"`. That option returns before the descending inversion, so blank rows stay at the bottom in both directions instead of jumping to the top when the owner clicks a second time.

### Why not format strings

Sorting the rendered strings is simpler but wrong for the two numeric columns and couples the order to the current units and locale. The accessors keep the numbers as numbers and leave formatting to the cell.

### Why not sort on the server

The owner's workouts are already loaded as one set before pagination. Client-side sorting is instant, composes with the existing `DataTable`, and needs no URL state or query change. `feature-132` will filter the same loaded set; both features keep the table's client model.

## Interaction with the existing default

The default remains `started desc`. Clicking any sortable header replaces the active sort through the same three-state cycle: unsorted → ascending → descending → unsorted. Clearing all sorts returns rows to the page-supplied order, which is still `updatedAt desc` on the server.

## Risks

- `getTrackParseState` is called by both the accessor and the cell, doubling the per-row work for those columns. The owner list is small and paginated after sorting; the parse state is derived from already-loaded metadata.
- A column's accessor and cell can drift. The accessor and the cell must keep using the same fallback chain; the tasks call this out for duration and started.
- Type labels depend on the active language. Sorting by the visible label is deliberate, but a locale switch can change the relative order of names across languages.
