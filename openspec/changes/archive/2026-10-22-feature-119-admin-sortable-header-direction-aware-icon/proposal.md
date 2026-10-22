# Proposal

## Why

Every sortable column header in every admin table renders one static `ArrowUpDown` glyph, so an administrator cannot tell from the header whether a column is unsorted, sorted ascending, or sorted descending. After `refactor-002-sortable-header` collapsed 19 hand-copied inline headers into the single shared `SortableHeader` component, the sort state is finally reachable in one place — the icon change that used to mean 19 hand edits is now three glyph branches. Shipping it now closes the most visible half of the QA fallout from that refactor, on one file, with no behavior change to sorting itself.

## What Changes

- `SortableHeader` reads `column.getIsSorted()` during render and renders a state-specific lucide glyph instead of one static icon:
  - `false` (unsorted) → `ArrowUpDown` (unchanged from today)
  - `"asc"` → `ArrowUp`
  - `"desc"` → `ArrowDown`
- The click handler stays exactly as it is: `column.toggleSorting(column.getIsSorted() === "asc")`. Sorting behavior, the two-state cycle, and all 19 call sites are untouched.

### Non-goals

- **The three-state sort cycle.** Adding a third click that clears the sort is `fix-XXX-admin-sortable-header-third-click-no-unsorted` and ships *after* this change. That ordering is deliberate: with a two-state cycle the reachable states are exactly the three this proposal maps, so the icon is unambiguous today. Adding the cleared state first would leave "cleared" and "unsorted" both rendering the neutral glyph while ascending renders differently — which is correct, but the reason to ship the icon first is that it makes the third state readable once it arrives.
- **Which glyph a cleared sort should use.** Also deferred to the third-state fix, which is the change that makes a cleared sort reachable by clicking. This proposal maps the unreachable-by-click `false` state to the neutral `ArrowUpDown`, which is also where a programmatically cleared column lands.
- **Accessibility semantics.** The state is conveyed visually only; no `aria-sort` attribute is added. Announcing sort state to assistive technology is a separate, independently valuable change.
- **Any change to sorting, column definitions, or header widths.** The five `w-36` / `w-28 justify-start` call sites stay pinned; `className` remains load-bearing.
- **The `/admin/videos` horizontal overflow** surfaced during the same refactor-002 QA pass (`admin-videos-table-horizontal-overflow`). Unrelated defect, separate candidate.

## Capabilities

### New Capabilities
- `admin-sortable-headers`: The shared admin table column header used by every sortable column — its rendered label, glyph, click-to-sort behavior, and the width-pinning contract its call sites rely on.

### Modified Capabilities

None. No existing capability covers admin table sorting; `openspec list --specs` has no admin-tables or sorting capability today.

## Impact

- **Code:** `components/common/sortable-header.tsx` only — one additional lucide import (`ArrowUp`, `ArrowDown`) and a glyph lookup in the render body. `ArrowUp` and `ArrowDown` are already in use under `components/` (`hikes-admin-panel.tsx`, `track-pages/track-editor.tsx`), so no new dependency.
- **Call sites:** none. All 19 headers across 10 admin table files (categories, files, hikes, links, md-docs, photos, posts, tracks-admin-columns, video-channels, videos) keep their current `column` / `label` / `className` props and need no edit.
- **Rendering:** the three glyphs are all 24×24 viewBox icons and all receive `size-4` from the `Button` base class (`[&_svg:not([class*='size-'])]:size-4`), so swapping the glyph causes no header width or layout shift.
- **Surfaces:** admin tables only. No public page, route, server action, data model, migration, or auth/visibility rule is touched.