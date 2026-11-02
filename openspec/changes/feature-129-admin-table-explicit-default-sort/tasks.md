# Tasks

## 1. Shared table

- [ ] 1.1 Add an optional `initialSorting` prop to `components/common/data-table.tsx`, typed as TanStack's `SortingState`, and pass it through `initialState.sorting`.
- [ ] 1.2 Confirm a table without `initialSorting` keeps rendering with no active sort and unchanged row order.

## 2. Track tables

- [ ] 2.1 Pass `initialSorting={[{ id: "updatedAt", desc: true }]}` from `TrackManagementPanel` for every track table variant.
- [ ] 2.2 Change the full track table's `updatedAt` header to `SortableHeader` with the label **Updated**.
- [ ] 2.3 Add a sortable **Updated** column to `components/admin-pages/tracks-workout-columns.tsx`, bound to `updatedAt` and formatted like the full table's date cell.

## 3. Validation

- [ ] 3.1 `npm run tsc` — expect no type errors.
- [ ] 3.2 `npx eslint components/common/data-table.tsx components/admin-pages/tracks-admin-panel.tsx components/admin-pages/tracks-admin-columns.tsx components/admin-pages/tracks-workout-columns.tsx --quiet` — expect no errors on the changed files.
- [ ] 3.3 `npm run lint` — expect no errors.
- [ ] 3.4 `npx openspec validate feature-129-admin-table-explicit-default-sort --strict` — expect the change to validate.
- [ ] 3.5 `npm run build` — the user runs the build locally; the agent records the result here.

## 4. Browser check (the owner's)

- [ ] 4.1 Open `/my/tracks` and confirm **Updated** shows the down arrow on load, **Title** shows the neutral glyph, and the first row is the most recently updated.
- [ ] 4.2 Click **Title** and confirm the rows sort by title while **Updated** returns to neutral; click through to clearing and confirm the rows return to the page order.
- [ ] 4.3 Open `/my/workouts` and confirm the new sortable **Updated** column shows the down arrow on load.
- [ ] 4.4 Open `/admin/tracks` and confirm the same default sort and glyphs.
