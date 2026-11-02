# Design

## Context

`components/common/data-table.tsx` builds a TanStack table without a sorting state. `getSortedRowModel()` is registered, so a click on `SortableHeader` sorts the rows in memory, but the initial render is whatever order the server sent.

The track queries order by `[{ updatedAt: "desc" }, { createdAt: "desc" }]`. The full track columns carry an `updatedAt` accessor with a plain **Updated** header. The workout variant is deliberately short and has no Updated column; the meaningful order there is when the workout was recorded — the **Started** value, which falls back from the recording-start mirror to the parsed summary. **Title** is the only sortable header in the full variant, and its neutral `ArrowUpDown` glyph is easy to read as "the current sort".

`feature-119` made the glyph reflect the actual state and `fix-006` restored the unsorted leg of the cycle. Neither gives the table an initial state to reflect.

## Decision: an optional initial sorting state owned by the caller

`DataTable` gains `initialSorting?: SortingState` and passes it to TanStack through `initialState: { sorting: initialSorting }`. The caller decides whether its page has a meaningful default; the shared component does not guess one.

The panel declares a default per table variant:

- the full track table (My Tracks, admin tracks) passes `[{ id: "updatedAt", desc: true }]` — the same order the data layer already uses; the **Updated** accessor becomes sortable, so a fresh load shows `ArrowDown` there and no longer implies Title is active;
- the workout table passes `[{ id: "started", desc: true }]` and makes **Started** sortable, so the owner opens on the most recently recorded workout. Its short column set stays as it is: **Updated** is not business information for this list.

The **Started** column gets an accessor that returns the same effective value its cell renders — the recording-start mirror or the parsed-summary fallback. The client sorts the already-loaded owner set on first render, then paginates. Rows without a start sort after dated rows in descending order.

### Why not sort by Title by default

It would make the glyph truthful without new columns, but it changes which rows an owner sees first on every visit. The recent-first order is deliberate; the defect is that it is invisible, not that it is wrong.

### Why not move sorting into the server query

Sorting is client-side and applies across the already-loaded owner dataset. Sending the sort to SQL would add a round trip and a URL/state contract that this slice does not need.

### Why not control the sorting state from the panel

Controlled state adds a prop and a callback for every table and buys nothing here: nothing but the table reads the sort. `initialState` is exactly TanStack's hook for "the state the table starts with".

## Interaction with the three-state cycle

The initial sort is a starting state, not a special mode:

1. Fresh load on the full table: `updatedAt desc`, **Updated** shows `ArrowDown`.
2. Fresh load on workouts: `started desc`, **Started** shows `ArrowDown`, and rows without a start sit at the end.
3. Clicking the active header moves it through asc and desc.
4. Clicking once more clears the sort, rows return to the page-supplied array order — still `updatedAt desc` — and the glyph becomes neutral.

Step 4 is intentionally unchanged. Making the visible hint cover that cleared state is `feature-130-admin-table-default-sort-hint`, not this change.

## Risks

- A declared sort id must match an accessor/column id. `updatedAt` exists in the full variant and `started` exists in the workout variant after this change, so the initial state is rendered rather than silently ignored.
- The workout default overrides the server's `updatedAt` order on first render. That is deliberate: the owner set is fully loaded before pagination, and "most recently recorded first" is the order that matters on this page.
- Rows without a start have no natural position. Returning `null` from the accessor and using the datetime sorting function puts them after dated rows in descending order; this must stay consistent when `feature-131` adds the remaining columns.
- The server order and the full-table client default can drift if a query changes without the panel. Both are `updatedAt desc` today; a future query change must update the panel constant.
