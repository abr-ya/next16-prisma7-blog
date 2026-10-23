# Tasks

## 1. Implementation

- [ ] 1.1 Change the `onClick` handler in `components/common/sortable-header.tsx` from `column.toggleSorting(column.getIsSorted() === "asc")` to the argument-less `column.toggleSorting()`. Verify with `git diff` that the argument is gone and that this is the only functional line that changed in the file.
- [ ] 1.2 Leave the glyph mapping, the `sorted` read, the prop type, and every call site untouched. Verify with `git diff --stat` that only `sortable-header.tsx` appears, so all 19 headers across the 10 admin tables inherit the new cycle with no edits.
- [ ] 1.3 Rewrite the component's header comment, which currently presents the two-state cycle as deliberate ("The click expression `toggleSorting(column.getIsSorted() === "asc")` is still copied verbatim, so the sort cycle stays two-state … The argument-less `toggleSorting()` would give a true three-state cycle, but that is a user-visible change … tracked separately"). Keep the `feature-119` paragraph about the glyph mapping and the paragraph about `className` being load-bearing. Verify the comment no longer claims a two-state cycle or defers the third state to another change.

## 2. Static validation

- [ ] 2.1 Run `npm run tsc` and verify it reports no errors.
- [ ] 2.2 Run targeted ESLint on the changed file (`npx eslint components/common/sortable-header.tsx --quiet`) — the root `npm run lint` script only covers `app/**` and will not check this path. Verify it reports no errors.
- [ ] 2.3 Run `npm run build` (user-run; the agent does not start builds) and verify it succeeds before the change is called done.
- [ ] 2.4 Run `openspec validate fix-006-admin-sortable-header-third-click-no-unsorted --strict` and verify it passes, so the REMOVED/ADDED pair against `admin-sortable-headers` is accepted.

## 3. Browser verification

The sort cycle is transient client state that no static check can observe, so this group is part of the change rather than a follow-up. The regression to guard against is a cycle that silently stays two-state — which would still pass any check that only tests "sorting works".

- [ ] 3.1 On a single admin table (e.g. `/admin/posts`), click one column header four times in a row and verify each transition in order: unsorted → ascending (up-arrow), ascending → descending (down-arrow), descending → unsorted (neutral arrow, rows back in their original order without a reload), unsorted → ascending (up-arrow). Verify the glyph flips on every one of the four clicks.
- [ ] 3.2 On a second admin table with a different data set (e.g. `/admin/videos` or `/admin/hikes`), verify the same four-click cycle and confirm the cleared state restores the original row order rather than an alphabetical or reverse-alphabetical one.
- [ ] 3.3 Verify a cleared sort affects only the column that was clicked — other columns' sorts and the rest of the table are unchanged — and that the five width-pinned headers (`videos-table.tsx` ×2, `video-channels-table.tsx` ×2, `files-table.tsx` ×1) keep their column widths.

## 4. Spec sync and backlog bookkeeping

- [ ] 4.1 Run `openspec sync` for this change and verify `openspec/specs/admin-sortable-headers/spec.md` now has four requirements: the two from `feature-119` plus "Header cycles through unsorted, ascending, and descending", with "Header indicator does not change sort behavior" gone. Verify `openspec validate --specs` still reports zero failures.
- [ ] 4.2 In `openspec/backlog.md`, remove the `admin-sortable-header-third-click-no-unsorted` row from `## P0 Now` — its work is now numbered as `fix-006`, so it belongs to the fix pool rather than sitting as a `Candidate` in the P0 table. Use the Edit tool; Bash rewrites of `openspec/*.md` are denied in this environment.