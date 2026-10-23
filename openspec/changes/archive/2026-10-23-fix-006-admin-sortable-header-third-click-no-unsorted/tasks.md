# Tasks

## 1. Implementation

- [x] 1.1 Change the `onClick` handler in `components/common/sortable-header.tsx` from `column.toggleSorting(column.getIsSorted() === "asc")` to the argument-less `column.toggleSorting()`. Verify with `git diff` that the argument is gone and that this is the only functional line that changed in the file.
- [x] 1.2 Leave the glyph mapping, the `sorted` read, the prop type, and every call site untouched. Verify with `git diff --stat` that only `sortable-header.tsx` appears, so all 19 headers across the 10 admin tables inherit the new cycle with no edits.
- [x] 1.3 Rewrite the component's header comment, which currently presents the two-state cycle as deliberate ("The click expression `toggleSorting(column.getIsSorted() === "asc")` is still copied verbatim, so the sort cycle stays two-state … The argument-less `toggleSorting()` would give a true three-state cycle, but that is a user-visible change … tracked separately"). Keep the `feature-119` paragraph about the glyph mapping and the paragraph about `className` being load-bearing. Verify the comment no longer claims a two-state cycle or defers the third state to another change.

## 2. Static validation

- [x] 2.1 Run `npm run tsc` and verify it reports no errors.
- [x] 2.2 Run targeted ESLint on the changed file (`npx eslint components/common/sortable-header.tsx --quiet`) — the root `npm run lint` script only covers `app/**` and will not check this path. Verify it reports no errors.
- [x] 2.3 Run `npm run build` (user-run; the agent does not start builds) and verify it succeeds before the change is called done. Confirmed passing on 2026-10-23.
- [x] 2.4 Run `openspec validate fix-006-admin-sortable-header-third-click-no-unsorted --strict` and verify it passes, so the REMOVED/ADDED pair against `admin-sortable-headers` is accepted.

## 3. Browser verification

The sort cycle is transient client state that no static check can observe, so this group is part of the change rather than a follow-up. The regression to guard against is a cycle that silently stays two-state — which would still pass any check that only tests "sorting works".

Verified by the user in the dev server on 2026-10-23, who signed off that the sort cycle now behaves as specified and asked to close the change.

- [x] 3.1 On a single admin table (e.g. `/admin/posts`), click one column header four times in a row and verify each transition in order: unsorted → ascending (up-arrow), ascending → descending (down-arrow), descending → unsorted (neutral arrow, rows back in their original order without a reload), unsorted → ascending (up-arrow). Verify the glyph flips on every one of the four clicks.
- [x] 3.2 On a second admin table with a different data set (e.g. `/admin/videos` or `/admin/hikes`), verify the same four-click cycle and confirm the cleared state restores the original row order rather than an alphabetical or reverse-alphabetical one.
- [x] 3.3 Verify a cleared sort affects only the column that was clicked — other columns' sorts and the rest of the table are unchanged — and that the five width-pinned headers (`videos-table.tsx` ×2, `video-channels-table.tsx` ×2, `files-table.tsx` ×1) keep their column widths.

## 4. Spec sync and backlog bookkeeping

- [x] 4.1 Sync the delta into `openspec/specs/admin-sortable-headers/spec.md` and verify it now has three requirements: the two from `feature-119` plus "Header cycles through unsorted, ascending, and descending", with "Header indicator does not change sort behavior" gone. Verify `openspec validate --specs` still reports zero failures. (The task text originally said "four requirements"; the merge yields three — the two `feature-119` requirements plus the one added here.)
- [x] 4.2 In `openspec/backlog.md`, remove the `admin-sortable-header-third-click-no-unsorted` row — its work is now numbered as `fix-006`, so it no longer sits as a `Candidate`. Use the Edit tool; Bash rewrites of `openspec/*.md` are denied in this environment. (The row lived in the `## Fixes` table, not `## P0 Now`; it was removed from there, matching how `fix-004` cleared its row in the implementation commit.)
- [x] 4.3 In `openspec/backlog.md`, update the `feature-119` Done row, whose forward references to the third-state fix ("the third-state fix is untouched and still sequenced next", the `admin-sortable-header-third-click-no-unsorted` reference, and the still-open third-chevron question) became false once `fix-006` landed. Replace them with the resolution: `fix-006` shipped the three-state cycle and kept the neutral `ArrowUpDown` glyph for a cleared sort.
