# Tasks

## 1. Period model

- [x] 1.1 Add `lib/track-period.ts`: the `WorkoutPeriod` union, `matchesWorkoutPeriod(track, period)` built on `getTrackCalendarDate`, `shiftWorkoutPeriod(period, direction)`, `getWorkoutPeriodKey(period)`, `getWorkoutPeriodLabel`, and `isWorkoutPeriodPaginated`.
- [x] 1.2 Add `scripts/check-workout-period-filter.ts` covering recording-timezone month boundaries, year boundaries, inclusive custom dates, a reversed range, tracks without an effective start, and month/year shifting.

## 2. Panel state and filtering

- [x] 2.1 Replace `selectedWeek` state in `tracks-admin-panel.tsx` with one `period: WorkoutPeriod`; derive `selectedWeek` only for the week summary and keep `visibleTracks` filtered through `matchesWorkoutPeriod`.
- [x] 2.2 Keep the `feature-135/136` summary and charts limited to `period.kind === "week"`; render nothing for the other periods.
- [x] 2.3 Derive year options (and month options inside a year) from the loaded workouts plus the current calendar year.

## 3. Filter control

- [x] 3.1 Extend the existing popover with a mode row for `All time`, `Week`, `Month`, `Year`, and `Custom`, keeping the current week controls unchanged.
- [x] 3.2 Add month and year pickers with previous/next arrows, plus `This month` / `This year` quick actions; make the toolbar arrows shift the active period.
- [x] 3.3 Add the custom range with native date inputs, an Apply action, inclusive semantics, and a visible error when the start is after the end.

## 4. Pagination

- [x] 4.1 Paginate month, year, and custom ranges at the existing page size while keeping `All time` paginated and a selected week unpaginated.
- [x] 4.2 Use `getWorkoutPeriodKey(period)` for `pageResetKey` so any period change returns to page 1 without resetting the column sort.

## 5. Localization

- [x] 5.1 Add `trips` keys for the mode labels, month/year labels, custom-range labels, validation, and quick actions in EN and RU; resolve month names through `Intl.DateTimeFormat` in the active language.

## 6. Validation

- [x] 6.1 `npx tsx scripts/check-workout-period-filter.ts` — expect all assertions to pass.
- [x] 6.2 `npm run tsc` — expect no type errors.
- [x] 6.3 `npx eslint components/admin-pages/tracks-admin-panel.tsx lib/track-period.ts scripts/check-workout-period-filter.ts --quiet` — expect no errors.
- [x] 6.4 `npm run lint` — expect no new errors.
- [x] 6.5 `npx tsx scripts/check-locale-placeholders.ts` — expect the new copy to pass.
- [x] 6.6 `npx openspec validate feature-134-my-workouts-other-period-filters --strict` — expect the change to validate.
- [x] 6.7 `npm run build` — run locally by the owner.

## 7. Browser check (the owner's)

- [x] 7.1 Select a month and confirm the rows match that calendar month.
- [x] 7.2 Move to the previous/next month and year with the arrows; confirm the table updates and starts on page 1.
- [x] 7.3 Apply an inclusive custom range and confirm both boundary days are included.
- [x] 7.4 Confirm month/year/custom paginate at the existing page size, a week still renders in full, and the column sort survives period changes.
