# Tasks

## 1. Shared table contract

- [x] 1.1 Add `defaultSortHint?: string` and `formatSortStatus?: (label, descending) => string` to `DataTable`, and render one always-visible status line above the table: the active column and direction when sorted, the fallback sentence otherwise; verify the type contract with `npm run tsc`.
- [x] 1.2 Render the hint above the table on its leading edge rather than in the pagination row, so paginated and unpaginated tables show it the same way; verify no pagination controls appear when `pagination` is not supplied.
- [x] 1.3 Document the adoption rule on the prop (one localized sentence per table, naming the same order the page supplies); verify the JSDoc is present and readable in the component source.
- [x] 1.4 Add `headerActions?: ReactNode` to `DataTable` and render it right-aligned in the same row as the hint; verify the row appears when either the hint or the actions exist and disappears when both are absent.

## 2. Wire the track and workout tables

- [x] 2.1 Pass the variant-appropriate hint from `TrackManagementPanel`: `updatedAt` wording for the full track table and `started` wording for the workout table; verify both props are selected from `tableVariant` in one place.
- [x] 2.2 Add `tableDefaultSortHintUpdated` and `tableDefaultSortHintStarted` to `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`; verify both files parse as JSON.
- [x] 2.3 Confirm the status names the declared sort on first load and switches to the fallback sentence after the owner clears it by clicking the active header until the sort is removed (the number of clicks depends on the column's automatic first direction); verify by reading the render branch against the three-state cycle.
- [x] 2.4 Move the quick-upload and `Add track` group from the panel's toolbar into `headerActions`; verify both table variants still render the same buttons with their existing handlers.
- [x] 2.5 Add textual `sortLabel` metadata to every sortable column in `tracks-admin-columns.tsx` and `tracks-workout-columns.tsx`, matching its header label; verify each `SortableHeader` call has a matching `meta.sortLabel`.

## 3. Validation

- [x] 3.1 `npm run tsc` — expect no type errors.
- [x] 3.2 `npx eslint components/common/data-table.tsx components/admin-pages/tracks-admin-panel.tsx --quiet` — expect no errors.
- [x] 3.3 `npm run lint` — expect no errors.
- [x] 3.4 `npx openspec validate feature-130-admin-table-default-sort-hint --strict` — expect the change to validate.
- [x] 3.5 `npm run build` — the owner ran the production build locally on 2026-11-04; it passed.

## 4. Browser check (the owner's)

The Russian wording and the narrow-viewport wrapping are deferred to the `admin-table-sort-status-narrow-manual-qa` candidate in `openspec/backlog.md`.

- [x] 4.1 On `/my/tracks`, `/admin/tracks`, and `/my/workouts`: the status is visible from first paint and names the active column and direction; sorting another column updates it; clearing the sort switches it to the fallback sentence; clicking the status changes nothing.

## 5. Follow-up

- [x] 5.1 Add the unnumbered `admin-default-sort-hint-rollout` candidate to `openspec/backlog.md`, naming the one-prop adoption rule and the tables still to cover; verify the row is present in the roadmap section.
