# Design

## Context

`feature-135` renders `WorkoutWeekSummary` from the panel's `weekSummary` memo, which sums `visibleTracks` — the complete, already-filtered set for the selected ISO week. Two helpers define the values the table shows: `getEffectiveTrackStart` / `getEffectiveTrackDistanceMeters` in `lib/track-effective-values.ts`, and `getIsoWeekForTrack` in `lib/track-iso-week.ts`, which converts an instant to a calendar date in the workout's `recordingTimezone` before asking date-fns for the ISO week.

The dialog is the only place to put a daily view: the week control already selects exactly seven days, and `All time` has no meaningful day axis.

## Decisions

**Aggregate in the panel, not in the chart.** `tracks-admin-panel.tsx` extends the existing `weekSummary` memo with a `days` array of seven entries (`{ isoWeekday, count, distanceMeters }` per series), so the dialog stays presentational and the numbers keep flowing through one `useMemo` over `visibleTracks`. A separate memo keyed on the same input would be a second place to drift.

**Day attribution reuses the week filter's calendar conversion.** `lib/track-iso-week.ts` gains an exported `getTrackCalendarDate(track)` (the existing private `toCalendarDate` applied to the effective start) and `getIsoWeekdayIndex(date)` returning 0 = Monday … 6 = Sunday. The charts use that helper instead of `Date#getDay()` or the browser timezone: a workout recorded at 23:40 in `Europe/Sofia` must land on the same day the week filter counted it in, even when the browser sits in another zone. Days absent from the set still render as zero.

**Series are identified by activity type key.** `activityType.key` is the stable identifier (`walking`, `running`), while the display names come from the activity-type rows the table already receives (`formatActivityTypeName`, matching `nameEn` / `nameRu`). The panel resolves the two legend labels and passes them in; if a row is missing from `activityTypes`, the i18n fallback keys are used so the chart never renders an anonymous series. Workouts with any other key are not plotted; the dialog reports how many were left out.

**Distance semantics stay identical to the totals.** A workout counts in the count chart whenever it falls on that day. It contributes to the distance chart only when `getEffectiveTrackDistanceMeters` returns a finite number; a missing distance is not drawn as `0`. The distance chart shows a "no distance recorded" line instead of bars when neither series has any finite distance, and the existing `workoutWeekSummaryDistanceNote` still explains partial coverage.

**Chart library.** `recharts@3.10.1` is added for grouped `BarChart`s with axes, tooltips and legend; its peer range includes React 19. Charts are client-only and imported directly by the dialog component. Per-day values are kept in metres internally and formatted at the edges: `formatTrackDistance` for tooltips, axis ticks and totals, so units match the Distance column. Counts use `allowDecimals={false}`; both axes start at 0. Colors come from the existing `--chart-1` / `--chart-2` theme tokens (already mapped to `--color-chart-*` in `app/globals.css`), so light and dark themes both work.

**Per-activity totals are aggregated in the same memo, not derived from the day array.** `weekSummary` gains `categories` with `{ count, distanceMeters, distanceCount }` for walking and running, filled in the same `visibleTracks` loop that builds the day matrix. Summing `days` afterwards would lose the distinction between "no finite distance" and "0 m recorded", which a row needs to choose between a formatted value and the no-distance text. The dialog renders a compact two-row `<table>` (activity type | workouts | distance) directly under the existing totals `<dl>`, reusing `walkingLabel` / `runningLabel` and `formatTrackDistance` so the rows and the chart legend agree.

**Layout.** The dialog widens from `sm:max-w-md` to `sm:max-w-2xl`. The totals `<dl>` stays at the top, followed by the per-activity table, then the two charts; below them the partial-distance and other-type notes. On a narrow viewport the two bars per day stay readable because the plot area scrolls neither axis: the day labels shorten via `Intl.DateTimeFormat(..., { weekday: "short" })` in the active language.

**Empty states.** A week with no walk and no run renders an explanatory line instead of two flat charts; a week with walks/runs but no parsed distance renders the count chart and the "no distance recorded" line in place of the distance chart. A week with no workouts keeps the existing `workoutWeekSummaryNoWorkouts` message.

**Accessibility.** Each chart's SVG is hidden from assistive technology (`aria-hidden`), and the same values are published as a visually hidden `<table>` with a caption, day rows and one column per series. That keeps every number in the accessibility tree in a native structure instead of a single dense `aria-label`, and the legend stays real text rather than an SVG-only affordance. The tooltip is an enhancement, never the only way to read a value.

## Rejected alternatives

- *CSS bars with no dependency.* Cheaper in bundle size, but axes, tooltips and the legend would be hand-built; the owner chose recharts on 2026-11-06, and the dialog is a small, owner-only surface where the trade-off is acceptable.
- *All activity types as extra series.* Cycling, skiing and rowing would double the bars per day and make the two asked-for series hard to compare; a note covers them instead.
- *Grouping by the browser's local date.* It would disagree with the week filter for workouts recorded in another timezone and silently move late-night sessions to the next day.
- *Rounding distance into the chart data.* Keeping metres until formatting preserves the same `m`/`km` switch the table uses and avoids 0.0 km bars for short walks.
- *A server aggregate.* The week is already fully loaded client-side; a query would add latency and a second definition of the same numbers.
