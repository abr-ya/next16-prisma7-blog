# Tasks

## 1. Dependency

- [x] 1.1 Add `recharts@3.10.1` to `dependencies` and update the lockfile (`npm install recharts@3.10.1`).

## 2. Day attribution

- [x] 2.1 In `lib/track-iso-week.ts`, export `getTrackCalendarDate(track)` and `getIsoWeekdayIndex(date)` (0 = Monday) built on the existing `toCalendarDate` + effective-start path; keep `getIsoWeekForTrack` behavior unchanged.
- [x] 2.2 Confirm the helper returns `null` for a workout without an effective start and that the week filter keeps excluding such workouts from the selected week.

## 3. Week aggregation

- [x] 3.1 Extend the `weekSummary` memo in `components/admin-pages/tracks-admin-panel.tsx` with a seven-entry `days` array of `{ walking: { count, distanceMeters }, running: { count, distanceMeters } }`, plus the resolved series labels and the count of workouts of other activity types.
- [x] 3.2 Sum distance only for finite `getEffectiveTrackDistanceMeters` values; count every walking/running workout in the count chart; track how many plotted workouts lack a distance.
- [x] 3.3 Resolve the two legend labels from the `activityTypes` rows via `formatActivityTypeName`, with i18n fallbacks; pass everything to the summary component as props.

## 4. Charts

- [x] 4.1 Add `components/admin-pages/workout-week-day-charts.tsx`: two grouped `BarChart`s (workout count, distance) with Monday–Sunday labels, `--chart-1` / `--chart-2` colors, legend, `formatTrackDistance` tooltips and tick formatter, integer count axis, both axes starting at 0.
- [x] 4.2 Render zero-value days so the axis is always seven days wide; keep bars grouped per day, one bar per series.
- [x] 4.3 Add the empty states: no walking/running workouts, and no finite distance in either series.
- [x] 4.4 Hide each chart SVG from assistive technology and publish the same per-day values through a visually hidden `<table>` with a caption and one column per series.

## 5. Dialog

- [x] 5.1 In `components/admin-pages/workout-week-summary.tsx`, keep the existing totals `<dl>` at the top and render the charts below it; widen the dialog to `sm:max-w-2xl`.
- [x] 5.2 Render the "other activity types" note when the week contains workouts outside walking/running.
- [x] 5.3 Keep the dialog read-only and the `All time` view free of any summary or chart.

## 6. Localization

- [x] 6.1 Add the `workoutWeekChart*` keys (chart headings, series fallbacks, "no walks or runs", "no distance", "other activity types" note, accessible-label template, day short labels if needed) to `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`, with plural forms where a count appears.

## 7. Validation

- [x] 7.1 `npm run tsc` — expect no type errors.
- [x] 7.2 `npx eslint components/admin-pages/tracks-admin-panel.tsx components/admin-pages/workout-week-summary.tsx components/admin-pages/workout-week-day-charts.tsx lib/track-iso-week.ts --quiet` — expect no errors.
- [x] 7.3 `npx openspec validate feature-136-my-workouts-week-daily-activity-charts --strict` — expect the change to validate.
- [ ] 7.4 `npm run build` — run locally by the owner; check that the `/my/workouts` client chunk stays reasonable with recharts added.

## 8. Browser check (the owner's)

- [ ] 8.1 Select a week with both walks and runs; confirm the totals still match the table and each chart has one bar per series per day with matching values.
- [ ] 8.2 Confirm a late-night workout lands on the day it was recorded, not the next one, when `recordingTimezone` differs from the browser zone.
- [ ] 8.3 Confirm a week with unparsed distances shows the distance note instead of `0` bars, and a week without walks/runs shows the empty line.
- [ ] 8.4 Confirm a week containing another activity type shows the exclusion note and that the extra workout does not appear in either chart.
- [ ] 8.5 Confirm the dialog fits a narrow viewport, Russian weekday labels and plural wording read naturally, and light/dark themes both render readable bars.
