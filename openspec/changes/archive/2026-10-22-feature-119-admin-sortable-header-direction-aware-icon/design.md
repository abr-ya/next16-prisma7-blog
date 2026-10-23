# Design

## Context

See `proposal.md` for motivation. The state this design has to work with:

- `components/common/sortable-header.tsx` is a `"use client"` component, extracted by `refactor-002-sortable-header` (archived at `openspec/changes/archive/2026-10-21-refactor-002-sortable-header/`). It takes exactly three props — `column`, `label`, `className` — and is used by **19 headers across 10 admin table files**: categories, files, hikes, links, md-docs, photos, posts, tracks-admin-columns, video-channels, videos. All 19 call sites are unchanged by this design and none of them need an edit.
- The component renders a `ghost` `Button` containing the label and one static `<ArrowUpDown />`. The glyph is chosen at render time today, so there is no state, effect, or subscription inside the component to preserve.
- The click expression `column.toggleSorting(column.getIsSorted() === "asc")` yields a **two-state** cycle (unsorted → asc → desc → asc). `refactor-002` copied that expression verbatim from the inline JSX it replaced; it is not an artifact of the extraction. Restoring the third state is `fix-XXX-admin-sortable-header-third-click-no-unsorted` and is explicitly sequenced after this change.
- `ArrowUp` and `ArrowDown` are already imported from `lucide-react` elsewhere in the project (`components/admin-pages/hikes-admin-panel.tsx`, `components/track-pages/track-editor.tsx`), so no dependency is added.
- The `Button` base class contains `[&_svg:not([class*='size-'])]:size-4`, which sizes every icon inside a button to 16px. All three candidate glyphs are 24×24 viewBox icons, so any of them renders at exactly the current size without a `size-*` class.

## Goals / Non-Goals

**Goals:**

- Make the header's glyph a pure function of the column's sort state, computed during render.
- Keep the change to one file and zero call-site edits.
- Leave the click expression and the resulting sort cycle byte-identical, so the diff is reviewable as "icon only".

**Non-Goals:**

- Changing sort behavior — the third-state fix owns the click expression.
- Deciding what glyph a *click-reachable* cleared sort should show; no click produces one yet (see Open Questions).
- Accessibility semantics for sort state (no `aria-sort`). Independent value, independently reviewable, and mixing it in would make this diff harder to reason about.
- Any change to column definitions, widths, or the admin table layout.

## Decisions

### 1. Read `column.getIsSorted()` inline in the render body

The glyph is a plain derivation of data TanStack already holds on the `column` object the component is handed. No `useState`, no `useEffect`, no subscription, no memo.

- **Alternative — a lookup record keyed by sort state** (`{ false: ArrowUpDown, asc: ArrowUp, desc: ArrowDown }`). Rejected: three states do not earn the extra typing surface of a keyed record, and the widening needed to accept `false | "asc" | "desc"` as a key is more code than the branch it saves.
- **Alternative — a dedicated `useSortableSortState(column)` hook.** Rejected: it would wrap a single method call, and a hook name would imply state the component does not have.

**Risk this creates, and how it is checked:** the glyph is only correct if the header re-renders when the sort state changes. If it does not, the component would keep rendering the glyph from the previous render and the feature would look broken in a way that static checks cannot catch. This is the one failure mode worth proving in the browser, and it is an explicit task in `tasks.md` — verify the glyph flips on *each* of the three transitions, not just that sorting still works.

### 2. Keep the click expression verbatim

`column.toggleSorting(column.getIsSorted() === "asc")` stays exactly as it is. The one-line third-state fix lands as its own change precisely because it is a one-line change; folding it in here would merge two user-visible deltas into one change and forfeit the ordering the backlog specifies (icon first, third state second, so a cleared sort is distinguishable the moment it becomes reachable).

### 3. No `className` on the glyph

The three icons render at the same size and weight through the `Button` base rule, so adding an explicit `size-4` would be visually identical and would diverge from the current `<ArrowUpDown />`, which carries none. The smaller diff wins.

### 4. The `false` state maps to the neutral glyph, not to a third chevron

`getIsSorted()` returns `false` for a column that was never sorted *and* for one whose sort was cleared. With the two-state cycle there is no click path to the second case, but a programmatic `clearSorting()` still lands there, and the neutral glyph is the honest rendering of "no direction". Choosing a third chevron for the cleared case would be reserving a distinction the UI cannot currently produce. That choice belongs to the third-state fix, which is where the distinction becomes real.

## Data model, boundaries, security, migration

- **Data model:** none. No Prisma schema, migration, or query change; no rows are read or written differently.
- **Server/client boundary:** unchanged. `SortableHeader` is already a client component, its props are already entirely client-side (a TanStack column plus two strings), and no server component, server action, or API contract is touched.
- **Auth / visibility:** unchanged. Every affected surface is an admin table under `/admin`, already gated by the existing admin access policy; this change adds no route, no permission, and no visibility rule.
- **Data preservation:** not applicable — nothing is persisted and no user data is at risk.
- **Migration plan:** none. This is a pure client-render change with no schema, no deploy ordering, and no backfill. Rollback is reverting one file.

## Risks / Trade-offs

- **Header does not re-render on sort change, so the glyph goes stale** → Mitigation: verify all three click transitions in the browser on at least two different admin tables as a task, not just a build pass. A stale glyph is invisible to `tsc`, `lint`, and `build`.
- **Glyph swap shifts header width** → Mitigation: all three icons are 24×24 viewBox and sized to 16px by the same `Button` rule, so the box is identical; the width-pinned call sites are called out in the spec as a scenario to re-check.
- **The neutral glyph is briefly the only "no direction" rendering** → Accepted. It is the correct rendering today, and the third-state fix inherits this mapping rather than changing it.
- **The third-state fix lands without noticing this spec** → Mitigation: this change creates `admin-sortable-headers` as a capability, and the third-state change will modify its "Header indicator does not change sort behavior" requirement — the ordering is now written down where the follow-up will find it.

## Open Questions

- Which glyph a cleared sort should render once clearing becomes reachable — the neutral bidirectional arrow, or a distinct third chevron? Deferred to `fix-XXX-admin-sortable-header-third-click-no-unsorted`. Answering it here would change nothing in this change: no click can reach a cleared state, so the decision would be unobservable and untestable in this slice.