# Tasks

## 1. ISO week helpers

- [x] 1.1 Add a small helper module for ISO week work: compute the ISO week-year and week for an instant in a given timezone, resolve a week's Monday–Sunday range, list the 52/53 weeks of a year with localized date ranges, and move one week back or forward across year boundaries.
- [x] 1.2 Keep the effective-start lookup identical to the workout table: recording-start mirror first, parsed summary fallback second, `recordingTimezone` with the browser zone as fallback.
- [x] 1.3 Cover the year-boundary case in the helper design: a date in late December may belong to week 1 of the next ISO week-year.

## 2. Filter control

- [x] 2.1 Add week-filter state to `TrackManagementPanel`, defaulting to `All time`, and filter the loaded workouts before `DataTable`.
- [x] 2.2 Render the compact control above the table: label with week number and date range, previous/next arrows, and a popover with ISO week-year, week list, and **This week**.
- [x] 2.3 Disable the arrows while `All time` is selected and show `All time` as the label.
- [x] 2.4 Hide workouts without an effective recording start while a week is selected.
- [x] 2.5 Keep the existing sorting and the short column set unchanged.
- [x] 2.6 List available ISO week-years from the loaded workouts plus the current ISO week-year.
- [x] 2.7 Keep `All time` paginated and render a selected week without pagination; reset the paginated view to its first page on a mode switch without resetting the chosen sort (`DataTable.pageResetKey`).

## 3. Localization

- [x] 3.1 Add en/ru copy for `All time`, `This week`, previous/next week labels, the week and date-range label, year/week select labels, and the empty week state.

## 4. Validation

- [x] 4.1 `npm run tsc` — expect no type errors.
- [x] 4.2 `npx eslint components/admin-pages/tracks-admin-panel.tsx lib/track-iso-week.ts --quiet` — expect no errors.
- [x] 4.3 `npm run lint` — expect no errors.
- [x] 4.4 `npx openspec validate feature-132-my-workouts-week-filter --strict` — expect the change to validate.
- [x] 4.5 `npm run build` — the owner ran the production build locally on 2026-11-02; it passed.

## 5. Browser check (the owner's)

The happy path (5.1, 5.2, 5.4, 5.6, 5.7) was verified in the browser. Year-boundary/53-week navigation and the no-start edge case are deferred to the `outdoor-workout-week-filter-edge-manual-qa` candidate in `openspec/backlog.md`.

- [x] 5.1 Open `/my/workouts` and confirm `All time` with every workout listed and the existing `started desc` order.
- [x] 5.2 Select week 45 of 2026 and confirm only 2–8 November workouts remain, the label shows the range, and the picker closes.
- [x] 5.4 Press **This week** and confirm the current week is selected with the right range.
- [x] 5.6 Sort by another column while a week is selected and confirm the filter stays in effect.
- [x] 5.7 On `All time`, go to a later page, select a week, confirm the week renders in full with no pagination, then return to `All time` and confirm it starts on page 1 with the same column sort.
