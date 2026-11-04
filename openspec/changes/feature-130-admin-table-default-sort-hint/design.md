# Design

## Context

See `proposal.md` for motivation. The shared `DataTable` (`components/common/data-table.tsx`) already accepts an optional `initialSorting` and owns the footer where pagination renders; it is the single table primitive behind the admin and owner surfaces. Today only `TrackManagementPanel` declares `initialSorting` (`started desc` for workouts, `updatedAt desc` for the full track table). The footer currently renders only when pagination is enabled, so an unpaginated table has no right-hand control row at all.

The table has no internationalization dependency: callers pass labels and the panel owns the `trips` namespace. That boundary has to stay intact.

## Goals / Non-Goals

**Goals:**

- Add one opt-in prop that any table can adopt without new state, queries, or layout work.
- Describe the effective order exactly when no header glyph can.
- Keep sorting, pagination, and row order byte-identical.

**Non-Goals:**

- Rolling the hint out to the remaining tables (follow-up candidate `admin-default-sort-hint-rollout`).
- Reworking the table footer into a toolbar or moving pagination.
- Localizing table headers or the rest of the admin workspace (`feature-137-my-workspace-localization`).

## Decisions

**Prop shape: a localized string, not a derived sort descriptor.** `DataTable` gains `defaultSortHint?: string`. The caller passes the final, already-translated sentence. Deriving the text from `initialSorting` was rejected: the panel has to translate anyway, some table orders have no sortable column (so there is no column id to read a header from), and a derived label would force `DataTable` to know about translation namespaces or accept a second label map. One string keeps the primitive generic and the call site explicit.

**Visibility: only while no column sort is active.** The hint renders when `table.getState().sorting.length === 0`. An active sort — whether the declared default or a user click — is already described by the header glyph, and showing both can contradict the user's current sort. This also means a table whose order has no sortable column shows the hint from the first render, which is exactly the gap the change targets.

**Placement: the existing footer, right-aligned before pagination.** No new toolbar. The footer becomes `isPaginated || defaultSortHint` and lays out the hint and the pagination controls in the same `flex flex-wrap justify-end gap-3` row. On an unpaginated week view the hint renders alone in that row; on a paginated table it sits immediately before `Page X of Y`. This keeps the change inside the component that already owns table chrome and survives the existing narrow-viewport wrapping.

**Copy: two complete sentences in the `trips` namespace.** `tableDefaultSortHintUpdated` and `tableDefaultSortHintStarted` hold the full sentence (`Sorted by: recently updated` / `Sorted by: most recently started`, with Russian equivalents). Two complete strings avoid an interpolation template that would need its own plural and case handling in Russian; the set is small and the wording is deliberately specific to each surface. The full track table and `/admin/tracks` share the `updatedAt` wording; `/my/workouts` uses the `started` wording. `TrackManagementPanel` already receives `t`, so no prop drilling or new namespace is needed.

**Adoption contract for later tables.** A table that relies on a page-supplied order adopts the hint by passing one localized string; a table whose order happens to be represented by a sortable column may still pass it so the cleared state is explained. This is recorded in the `DataTable` JSDoc and handed to the rollout candidate.

## Risks / Trade-offs

- **The hint could disagree with the actual server order** → the string is declared next to `initialSorting` in the same call site, and the implementation tasks require the label to name the same order the page supplies; the rollout candidate repeats that rule for every table.
- **Two sources of truth (`initialSorting` and `defaultSortHint`)** → accepted: they describe different states (active sort versus fallback order) and the `DataTable` does not need to prove they match. A future table with no sortable column can pass only the hint.
- **Long Russian copy can crowd the pagination row** → the footer uses `flex-wrap`, and the hint is plain text rather than a button, so it wraps under the controls on narrow viewports instead of overflowing.
- **Localized hint beside English headers looks inconsistent** → limited to the hint for now; the owner workspace localization is a separate tracked change, and the copy lives in the shared namespace so it moves with the rest later.

## Migration Plan

No data or schema migration. Front-end-only change; rollback is removing the prop from the panel (and the optional render branch can stay harmlessly).
