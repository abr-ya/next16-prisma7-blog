# Design

## Context

See `proposal.md` for motivation. The state this design has to work with:

- `components/common/sortable-header.tsx` is a `"use client"` component from `refactor-002-sortable-header`, extended by `feature-119`. All **19 headers across 10 admin table files** (categories, files, hikes, links, md-docs, photos, posts, tracks-admin-columns, video-channels, videos) use it, and none of them needs to change.
- The click handler currently reads `onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}`. `feature-119` copied that expression verbatim from the inline JSX `refactor-002` replaced; it is not an artifact of either extraction.
- Verified against the installed `@tanstack/table-core` **8.21.3**, `build/lib/features/RowSorting.js`:
  - `toggleSorting(desc, multi)` computes `hasManualValue = typeof desc !== 'undefined' && desc !== null`. Calling it with no argument makes `hasManualValue` false.
  - The removal branch is `if (sortAction === 'toggle') { if (!hasManualValue) { if (!nextSortingOrder) sortAction = 'remove' } }` — reachable only when no explicit value was passed.
  - `getNextSortingOrder()` returns `firstSortDirection` when unsorted, `false` when the current direction differs from the first and sorting removal is enabled, and otherwise the opposite direction.
  - `getFirstSortDir()` returns `sortDescFirst ? 'desc' : 'asc'`, and `sortDescFirst` defaults to false.
  - `enableSortingRemoval` defaults to true.
- Grepped the admin tables: **none of them** sets `enableSortingRemoval`, `enableMultiSort`, `sortDescFirst`, `manualSorting`, or `enableColumnSorting`. Every table runs on library defaults, so one argument change yields the same cycle at all 19 sites. Verified 2026-10-23.
- The `Button` and the glyph mapping from `feature-119` (`false` → `ArrowUpDown`, `"asc"` → `ArrowUp`, `"desc"` → `ArrowDown`) are untouched by this change.

## Goals / Non-Goals

**Goals:**

- Make the third state reachable with the smallest possible diff: one argument removed.
- Keep every call site, prop, glyph, and width contract exactly as they are.

**Non-Goals:**

- Redesigning how a cleared sort looks. `feature-119` already renders the neutral glyph there and already has a scenario for it.
- Multi-sort, manual sorting, or any per-column sort override — no admin table uses them and this change introduces none.
- Deciding whether three-state is the right product behavior. That was the backlog's "decide before implementing" gate; it was resolved in favour of the three-state cycle when this change was opened.

## Decisions

### 1. Call `toggleSorting()` with no argument rather than computing the next direction ourselves

Dropping the argument is the only way to reach TanStack's `remove` branch. The alternative — computing the next state by hand, e.g. `column.toggleSorting(column.getIsSorted() !== "asc" ? undefined : true)` — re-implements a state machine the library already owns, and would silently drift from it if the library's rules changed (for example if `enableSortingRemoval` were later set to false anywhere).

### 2. Remove and replace the requirement rather than modify it in place

The existing requirement is named "Header indicator does not change sort behavior" and its text states that no unsorted state is reachable by clicking. `feature-119` wrote it that way on purpose, to pin the pre-existing cycle while shipping the glyphs alone. Both the name and the text are now false, and a MODIFIED delta would have had to keep a requirement name that describes the opposite of the change. The delta therefore REMOVES it with a reason and a migration note and ADDS "Header cycles through unsorted, ascending, and descending", which states the three states, their order, their indefinite repetition, and that the indicator only reflects the result.

The other two requirements are untouched and stay correct: `feature-119`'s "Sort state is cleared" scenario already says a cleared column renders the neutral glyph indistinguishable from a never-sorted one, and the label/width requirement is unaffected.

### 3. Rely on library defaults rather than setting them explicitly

The fix depends on `enableSortingRemoval` defaulting to true and `sortDescFirst` defaulting to false. It does not pass either explicitly to `DataTable`. Setting them would pin behavior that every current table already gets, add 19 potential configuration sites the first time a table needs to deviate, and turn a one-line fix into a cross-file change. If a future table sets `enableSortingRemoval: false`, that table deliberately opts out of the third state and the spec still holds for it — the cycle simply stops at descending, which is the library's contract rather than a defect.

## Data model, boundaries, security, migration

- **Data model:** none. No Prisma schema, migration, or query change.
- **Server/client boundary:** unchanged. `SortableHeader` is already a client component and its props stay `column` / `label` / `className`. Sorting is client-side state in the table instance; no server action or data-fetch path participates.
- **Auth / visibility:** unchanged. Every affected surface is an admin table under `/admin`, already gated by the existing admin access policy. No route, permission, or visibility rule is added.
- **Data preservation:** not applicable — the sort order is transient view state that a page reload already resets today.

## Risks / Trade-offs

- **The cycle silently becomes two-state again if `enableSortingRemoval` is ever set to `false`** → Accepted. That is the library's documented opt-out; the spec describes the default behavior, and a table that opts out is making a deliberate choice. Noted here because no admin table sets it today, so the coupling is invisible in the code.
- **Administrators who learned the old third-click behavior now get unsorted instead of ascending** → Mitigation: this is the point of the change, it matches the near-universal table convention, and the neutral glyph from `feature-119` makes the cleared state legible on the very first render.
- **A user mid-task loses the sorted view** → Accepted, and it is one click to restore: a fourth click returns to ascending. This is the trade every three-state table makes.
- **The stale comment in the component** → Task 1.3; the comment currently presents the two-state cycle as a deliberate design choice and points at this backlog candidate, so leaving it would misdirect the next reader.
- **Static checks cannot see the cycle** → Mitigation: the browser pass in `tasks.md` exercises all four clicks, not just the third, so a regression to two-state would be visible.

## Migration Plan

None. Client-side render change only — no schema, no deploy ordering, no backfill. Rollback is reverting one file, which restores the two-state cycle and the previous comment in a single revert.