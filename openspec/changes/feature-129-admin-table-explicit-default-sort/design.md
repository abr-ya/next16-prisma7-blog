# Design

## Context

`components/common/data-table.tsx` builds a TanStack table without a sorting state. `getSortedRowModel()` is registered, so a click on `SortableHeader` sorts the rows in memory, but the initial render is whatever order the server sent.

The track queries order by `[{ updatedAt: "desc" }, { createdAt: "desc" }]`. The full track columns already carry an `updatedAt` accessor with a plain **Updated** header; the workout variant has no Updated column at all. **Title** is the only sortable header in the full variant, and its neutral `ArrowUpDown` glyph is easy to read as "the current sort".

`feature-119` made the glyph reflect the actual state and `fix-006` restored the unsorted leg of the cycle. Neither gives the table an initial state to reflect.

## Decision: an optional initial sorting state owned by the caller

`DataTable` gains `initialSorting?: SortingState` and passes it to TanStack through `initialState: { sorting: initialSorting }`. The caller decides whether its page has a meaningful default; the shared component does not guess one.

The track panel passes `[{ id: "updatedAt", desc: true }]` — the same order the data layer already uses. The **Updated** accessor becomes sortable, so a fresh load shows `ArrowDown` there and no longer implies Title is active.

The workout variant gains a sortable **Updated** column for the same reason: without a column bound to `updatedAt`, the declared initial sort would have no header to render it.

### Why not sort by Title by default

It would make the glyph truthful without new columns, but it changes which rows an owner sees first on every visit. The recent-first order is deliberate; the defect is that it is invisible, not that it is wrong.

### Why not move sorting into the server query

Sorting is client-side and applies across the already-loaded owner dataset. Sending the sort to SQL would add a round trip and a URL/state contract that this slice does not need.

### Why not control the sorting state from the panel

Controlled state adds a prop and a callback for every table and buys nothing here: nothing but the table reads the sort. `initialState` is exactly TanStack's hook for "the state the table starts with".

## Interaction with the three-state cycle

The initial sort is a starting state, not a special mode:

1. Fresh load: `updatedAt desc`, **Updated** shows `ArrowDown`.
2. Click **Updated**: asc.
3. Click again: desc.
4. Click again: the sort clears, rows return to the page-supplied array order — which is still `updatedAt desc` — and the glyph becomes neutral.

Step 4 is intentionally unchanged. Making the visible hint cover that cleared state is `feature-130-admin-table-default-sort-hint`, not this change.

## Risks

- A declared sort id must match an accessor/column id. `updatedAt` exists in both track variants after this change, so the initial state is rendered rather than silently ignored.
- Adding a column to the workout table changes its visible layout. That is accepted as the smallest change that makes the default order representable, and it is the "add a sortable column" kind of work the existing table already expects.
- The server order and the client default can drift if a query changes without the panel. Both are `updatedAt desc` today; a future query change must update the panel constant.
