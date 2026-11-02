# Tasks

## 1. Shared table

- [x] 1.1 Add an optional `initialSorting` prop to `components/common/data-table.tsx`, typed as TanStack's `SortingState`, and pass it through `initialState.sorting`.
- [x] 1.2 Confirm a table without `initialSorting` keeps rendering with no active sort and unchanged row order.

## 2. Track tables

- [x] 2.1 Pass `initialSorting` from `TrackManagementPanel`: `[{ id: "updatedAt", desc: true }]` for the full track table and `[{ id: "started", desc: true }]` for the workout table.
- [x] 2.2 Change the full track table's `updatedAt` header to `SortableHeader` with the label **Updated**.
- [x] 2.3 Make the workout table's **Started** header sortable through an accessor that returns the same effective start the cell renders; keep the short column set and add no **Updated** column.

## 3. Validation

- [x] 3.1 `npm run tsc` — expect no type errors.
- [x] 3.2 `npx eslint components/common/data-table.tsx components/admin-pages/tracks-admin-panel.tsx components/admin-pages/tracks-admin-columns.tsx components/admin-pages/tracks-workout-columns.tsx --quiet` — expect no errors on the changed files.
- [x] 3.3 `npm run lint` — expect no errors.
- [x] 3.4 `npx openspec validate feature-129-admin-table-explicit-default-sort --strict` — expect the change to validate.
- [x] 3.5 `npm run build` — the owner ran the production build locally on 2026-11-02; it passed.

## 4. Browser check (the owner's)

- [x] 4.1 Open `/my/tracks` and confirm **Updated** shows the down arrow on load, **Title** shows the neutral glyph, and the first row is the most recently updated.
- [x] 4.2 Click **Title** and confirm the rows sort by title while **Updated** returns to neutral; click through to clearing and confirm the rows return to the page order.
- [x] 4.3 Open `/my/workouts` and confirm there is no **Updated** column, the **Started** header shows the down arrow on load, and the most recently started workout is first.
- [x] 4.4 Open `/admin/tracks` and confirm the same default sort and glyphs.
