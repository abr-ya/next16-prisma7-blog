# Proposal

## Why

`/my/workouts` can only be narrowed to `All time` or one ISO week. The owner often reviews a month or a year, and a week is too narrow for that while `All time` mixes every season. The ISO week filter from `feature-132` already established the timezone-aware effective-start lookup and the compact popover; this change extends that same control instead of adding a second filter model.

## What Changes

- Extend the workout period filter with three new modes:
  - **Month** — a calendar month with previous/next month arrows;
  - **Year** — a calendar year with previous/next year arrows;
  - **Custom range** — inclusive `from` / `to` dates.
- Keep `All time` as the default and the existing ISO week picker unchanged.
- Resolve every boundary through the workout's calendar date in its `recordingTimezone` (the same `getTrackCalendarDate` the week filter and charts use), so a late-night workout stays in the month/year/day it was recorded.
- Pagination rules:
  - `All time` stays paginated at the existing page size;
  - a selected **week** still renders in full;
  - **month**, **year**, and **custom range** paginate at the existing page size;
  - changing the period resets the table to page 1 while preserving the chosen column sort.
- Keep the Week summary dialog and its daily charts week-only; other periods show the table without that summary.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: the workout period filter gains calendar month, calendar year, and custom-range modes, and the pagination requirement expands beyond week/All time.

## Impact

- New `lib/track-period.ts`: the `WorkoutPeriod` union, boundary matching, period labels, shifting, and page keys.
- `components/admin-pages/tracks-admin-panel.tsx`: replaces the `selectedWeek`-only state with a period state, filters `visibleTracks`, derives the week-only summary, and feeds pagination/reset.
- The workout filter popover: mode selection plus month/year/custom controls.
- `app/i18n/locales/{en,ru}/trips.json`: period labels, custom-range labels, and validation copy.
- New `scripts/check-workout-period-filter.ts` for boundary cases.
- No Prisma schema change, no migration, no server query, no route change, no change to sorting or the short workout column set.

## Non-Goals

- Rolling windows such as "last 30 days" or "last 12 months".
- Per-month or per-year charts/summary; the existing week summary stays week-only.
- Persisting the selected period in the URL or across sessions.
- Filtering `/admin/tracks` or `/my/tracks`; this is a workout-only control.
- Server-side filtering or pagination; the full workout set is already loaded client-side.
