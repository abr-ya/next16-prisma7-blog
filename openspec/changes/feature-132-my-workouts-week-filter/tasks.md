# Tasks

## 1. ISO week helpers

- [ ] 1.1 Add a small helper module for ISO week work: compute the ISO week-year and week for an instant in a given timezone, resolve a week's Monday–Sunday range, list the 52/53 weeks of a year with localized date ranges, and move one week back or forward across year boundaries.
- [ ] 1.2 Keep the effective-start lookup identical to the workout table: recording-start mirror first, parsed summary fallback second, `recordingTimezone` with the browser zone as fallback.
- [ ] 1.3 Cover the year-boundary case in the helper design: a date in late December may belong to week 1 of the next ISO week-year.

## 2. Filter control

- [ ] 2.1 Add week-filter state to `TrackManagementPanel`, defaulting to `All time`, and filter the loaded workouts before `DataTable`.
- [ ] 2.2 Render the compact control above the table: label with week number and date range, previous/next arrows, and a popover with ISO week-year, week list, and **This week**.
- [ ] 2.3 Disable the arrows while `All time` is selected and show `All time` as the label.
- [ ] 2.4 Hide workouts without an effective recording start while a week is selected.
- [ ] 2.5 Keep the existing sorting, pagination reset on data change, and short column set unchanged.
- [ ] 2.6 List available ISO week-years from the loaded workouts plus the current ISO week-year.

## 3. Localization

- [ ] 3.1 Add en/ru copy for `All time`, `This week`, previous/next week labels, the week and date-range label, year/week select labels, and the empty week state.

## 4. Validation

- [ ] 4.1 `npm run tsc` — expect no type errors.
- [ ] 4.2 `npx eslint components/admin-pages/tracks-admin-panel.tsx lib/track-iso-week.ts --quiet` — expect no errors.
- [ ] 4.3 `npm run lint` — expect no errors.
- [ ] 4.4 `npx openspec validate feature-132-my-workouts-week-filter --strict` — expect the change to validate.
- [ ] 4.5 `npm run build` — the user runs the build locally; the agent records the result here.

## 5. Browser check (the owner's)

- [ ] 5.1 Open `/my/workouts` and confirm `All time` with every workout listed and the existing `started desc` order.
- [ ] 5.2 Select week 45 of 2026 and confirm only 2–8 November workouts remain and the label shows the range.
- [ ] 5.3 Use the arrows across a year boundary and across a 53-week year; confirm the ISO week and dates move correctly.
- [ ] 5.4 Press **This week** and confirm the current week is selected with the right range.
- [ ] 5.5 Confirm workouts without a start disappear under a selected week and return under `All time`.
- [ ] 5.6 Sort by another column while a week is selected and confirm the filter stays in effect.
