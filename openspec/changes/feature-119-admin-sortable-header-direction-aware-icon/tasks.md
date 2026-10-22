# Tasks

## 1. Implementation

- [x] 1.1 Extend the `lucide-react` import in `components/common/sortable-header.tsx` to bring in `ArrowUp` and `ArrowDown` alongside the existing `ArrowUpDown`, and verify `npm run tsc` passes (both glyphs are already used elsewhere in the project, so no dependency changes).
- [x] 1.2 In the component body, read `column.getIsSorted()` once and render `ArrowUpDown` for the unsorted state, `ArrowUp` for ascending, and `ArrowDown` for descending — per Decision 1 and Decision 4 in `design.md`. Verify all three states are covered by re-reading the branches against the spec's first requirement.
- [x] 1.3 Leave `onClick` as `column.toggleSorting(column.getIsSorted() === "asc")` and leave the prop type untouched. Verify with `git diff` that no call-site file is modified and that the only changed lines in `sortable-header.tsx` are the import and the glyph expression.
- [x] 1.4 Rewrite the component's header comment, which currently asserts "The component deliberately keeps no sort-direction-aware icon" — that sentence becomes false in this change. Keep the part about copying `toggleSorting(column.getIsSorted() === "asc")` verbatim and its two-state rationale, and point at `fix-XXX-admin-sortable-header-third-click-no-unsorted` as the change that owns the click expression. Verify the comment no longer claims the icon is static and still explains why the width `className` is load-bearing.

## 2. Static validation

- [x] 2.1 Run `npm run tsc` and verify it reports no errors.
- [x] 2.2 Run targeted ESLint on the changed file (`npx eslint components/common/sortable-header.tsx --quiet`) — the root `npm run lint` script only covers `app/**` and will not check this path. Verify it reports no errors.
- [ ] 2.3 Run `npm run build` (user-run; the agent does not start builds) and verify it succeeds before the change is called done.

## 3. Browser verification

The risk this change carries is a stale glyph: if the header does not re-render when the sort state changes, `tsc`, `lint`, and `build` all pass and the feature is still broken. The checks below are therefore part of the change, not optional follow-up.

- [ ] 3.1 On at least two different admin tables — one without width-pinned headers (e.g. `/admin/posts`, `/admin/categories`) and one with them (`/admin/videos`, `/admin/video-channels`) — verify all three click transitions, not two: unsorted → ascending shows `ArrowUp`; ascending → descending shows `ArrowDown`; descending → ascending shows `ArrowUp` again with no cleared state reached. Verify a fresh page load starts every column on the neutral `ArrowUpDown`.
- [ ] 3.2 Verify the glyph updates immediately on click rather than only after a router refresh or a re-sort of another column.
- [ ] 3.3 Verify the five width-pinned headers (`videos-table.tsx` ×2, `video-channels-table.tsx` ×2, `files-table.tsx` ×1) keep their column widths when sorted, and that sorting still produces the same row order as before the change.

## 4. Backlog bookkeeping

- [ ] 4.1 In `openspec/backlog.md`, mark the `admin-sortable-header-direction-aware-icon` row in `## P0 Now` as `Done` referencing `feature-119`, with the browser-verification date and outcome — mirroring how `feature-107` / `feature-108` / `feature-094` rows are recorded. Use the Edit tool; Bash rewrites of `openspec/*.md` are denied in this environment.
- [x] 4.2 Confirm `openspec validate feature-119-admin-sortable-header-direction-aware-icon` passes before the change is handed to the archive step.