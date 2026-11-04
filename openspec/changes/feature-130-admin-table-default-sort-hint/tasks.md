# Tasks

## 1. Shared table contract

- [ ] 1.1 Add `defaultSortHint?: string` to `DataTable` and render it in the footer only when `table.getState().sorting.length === 0`; verify the type contract with `npm run tsc`.
- [ ] 1.2 Extend the footer condition to `isPaginated || defaultSortHint` so an unpaginated table can show the hint alone; verify no pagination controls appear when `pagination` is not supplied.
- [ ] 1.3 Document the adoption rule on the prop (one localized sentence per table, naming the same order the page supplies); verify the JSDoc is present and readable in the component source.

## 2. Wire the track and workout tables

- [ ] 2.1 Pass the variant-appropriate hint from `TrackManagementPanel`: `updatedAt` wording for the full track table and `started` wording for the workout table; verify both props are selected from `tableVariant` in one place.
- [ ] 2.2 Add `tableDefaultSortHintUpdated` and `tableDefaultSortHintStarted` to `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`; verify both files parse as JSON.
- [ ] 2.3 Confirm the hint is absent while the declared sort is active and appears after the owner clears it by clicking the active header a third time; verify by reading the render branch against the three-state cycle.

## 3. Validation

- [ ] 3.1 `npm run tsc` — expect no type errors.
- [ ] 3.2 `npx eslint components/common/data-table.tsx components/admin-pages/tracks-admin-panel.tsx --quiet` — expect no errors.
- [ ] 3.3 `npm run lint` — expect no errors.
- [ ] 3.4 `npx openspec validate feature-130-admin-table-default-sort-hint --strict` — expect the change to validate.
- [ ] 3.5 `npm run build` — the user runs the production build locally; the agent records the result here.

## 4. Browser check (the owner's)

- [ ] 4.1 On `/my/tracks`, `/admin/tracks`, and `/my/workouts`: the default sort shows its header glyph and no hint; clearing the sort shows the hint naming the page order; clicking the hint changes nothing.
- [ ] 4.2 Switch to Russian and confirm the hint wording reads naturally on the workout table and on a track table.
- [ ] 4.3 At 375 px and 320 px, confirm the hint wraps alongside or above pagination without horizontal overflow; on a selected week (unpaginated) confirm the hint renders alone in the footer row.

## 5. Follow-up

- [ ] 5.1 Add the unnumbered `admin-default-sort-hint-rollout` candidate to `openspec/backlog.md`, naming the one-prop adoption rule and the tables still to cover; verify the row is present in the roadmap section.
