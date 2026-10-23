# Proposal

## Why

A third click on a sortable admin column header does not clear the sort — the column goes straight back to ascending, so there is no way to return a table to its original row order without reloading the page. The cause is a single argument: every header passes an explicit boolean into `column.toggleSorting(...)`, and an explicit boolean sets `hasManualValue` in TanStack's `RowSorting`, which skips the only branch that can *remove* a sort. Restoring the third state is now a one-line change to the shared `SortableHeader`, and `feature-119` shipped the direction-aware glyphs that make a cleared sort readable — which is precisely why this fix was sequenced to come after it rather than before.

## What Changes

- `SortableHeader` calls `column.toggleSorting()` with no argument instead of `column.toggleSorting(column.getIsSorted() === "asc")`. The sort cycle becomes three-state: unsorted → ascending → descending → unsorted.
- Every other `SortableHeader` behavior is unchanged: the click still re-sorts the same column in normal (non-multi) mode, the glyph mapping from `feature-119` is untouched, and no call site is edited.
- The component's header comment is updated: its central claim — that the two-state cycle is a deliberate choice — becomes false.

### Non-goals

- **The glyph for a cleared sort.** A cleared column renders the neutral `ArrowUpDown` glyph, which is what `feature-119` already shipped and what its "Sort state is cleared" scenario already specifies. This change makes that state reachable; it does not redesign how it looks. A distinct third chevron would be a separate visible change.
- **Multi-column sorting.** None of the 10 admin tables enable `enableMultiSort`, so all of them sort one column at a time and the `remove` branch is the only branch in play. Adding or changing shift-click multi-sort is not in scope.
- **`sortDescFirst`, `manualSorting`, or per-column `enableSorting` overrides.** All admin tables run on library defaults; the fix relies on those defaults and does not introduce any.
- **The `/admin/videos` horizontal overflow** surfaced in the same refactor-002 QA session (`admin-videos-table-horizontal-overflow`). Unrelated defect, separate candidate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `admin-sortable-headers`: the requirement that pinned the two-state cycle is superseded — "Header indicator does not change sort behavior" is removed and replaced by "Header cycles through unsorted, ascending, and descending", which specifies the three-state cycle. The other two requirements (glyph reflects the current sort state, header preserves label and caller-supplied width) already describe the post-fix behavior correctly and are unchanged.

## Impact

- **Code:** `components/common/sortable-header.tsx` only — the `onClick` argument and the surrounding comment.
- **Call sites:** none. All 19 headers across 10 admin table files (categories, files, hikes, links, md-docs, photos, posts, tracks-admin-columns, video-channels, videos) inherit the new cycle without an edit.
- **Behavior:** user-visible, and therefore a `fix-XXX` rather than a refactor under the hybrid rule.
- **Surfaces:** admin tables only. No public page, route, server action, data model, migration, or auth/visibility rule is touched.