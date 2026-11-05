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

**Prop shape: two small props, labels from column metadata.** `DataTable` gains `defaultSortHint?: string` (the fallback sentence) and `formatSortStatus?: (label, descending) => string` (the active-sort sentence). The caller owns translation, so the primitive stays free of i18n. The column label comes from `column.columnDef.meta.sortLabel`, because the rendered header is a component (`SortableHeader`) rather than a plain string; the fallback is the column id. Deriving everything inside `DataTable` was rejected because it would force translation namespaces into the primitive, while passing a labels map duplicates the header text away from the column definition.

**Visibility: always, with two states.** When a column sort is active the status names that column and direction; when it is cleared the status names the fallback order. Always-visible text is clearer than a line that appears and disappears, and the shared header row means no layout jump. The header glyph remains the compact indicator; the status is its readable counterpart, not a replacement.

**Placement: a quiet line above the table, aligned left.** The status renders as a plain paragraph in the gap between the page toolbar and the table border, on the leading edge. It does not enter the pagination row: the right side already carries the primary page action (`Add track`), and a bottom-of-table hint was easy to miss. Rendering it above the table keeps it visible on first paint, works identically for paginated and unpaginated tables, and needs no new toolbar — the `DataTable` wrapper already stacks its children with `gap-3`.

**Header row: a small actions slot, not a toolbar refactor.** `DataTable` gains `headerActions?: ReactNode`, rendered right-aligned in the same row as the hint. The track panel moves its quick-upload and `Add track` group into that slot, so the primary action and the hint share one line above the header. `justify-between` alignment alone was not enough because the page rendered its actions in a sibling row above the table. Lifting the sorting state into the page was rejected (two sources of truth for whether a sort is active), and moving every page toolbar into the table is a larger refactor that would touch every admin surface. The slot is optional and generic, so other tables adopt it only when they need the same alignment.

**Copy: localized templates and fallback sentences in the `trips` namespace.** `tableSortStatusAscending` / `tableSortStatusDescending` carry the active-sort sentence with a `{{column}}` placeholder; `tableDefaultSortHintUpdated` and `tableDefaultSortHintStarted` carry the two fallback sentences. The panel chooses the fallback by `tableVariant` and formats the active sentence with `t`, so no prop drilling or new namespace is needed. Column labels stay exactly the strings used by the visible headers, including in Russian, until the workspace localization change translates the headers themselves.

**Adoption contract for later tables.** A table that relies on a page-supplied order adopts the hint by passing one localized string; a table whose order happens to be represented by a sortable column may still pass it so the cleared state is explained. This is recorded in the `DataTable` JSDoc and handed to the rollout candidate.

## Risks / Trade-offs

- **The status could name a column differently from its header** → each sortable column sets `meta.sortLabel` in the same object as its `header` and label prop; the manual check compares the status text with the header for every sortable column on the three surfaces.
- **Always-on text duplicates the header glyph** → accepted: the glyph is the compact state, the sentence removes ambiguity about direction and about the fallback order after a cleared sort.
- **Long Russian copy can crowd the header row** → the status is a plain paragraph with normal wrapping and the actions keep their own right-aligned group; on narrow viewports the row wraps instead of overflowing.
- **Localized status beside English headers looks inconsistent** → limited to the status for now; the owner workspace localization is a separate tracked change, and the copy lives in the shared namespace so it moves with the rest later.

## Migration Plan

No data or schema migration. Front-end-only change; rollback is removing the prop from the panel (and the optional render branch can stay harmlessly).
