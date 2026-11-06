# Proposal

## Why

`feature-135` gave the Week summary dialog two numbers for the selected ISO week: the workout count and the summed distance. Both describe the week as a whole, so the dialog cannot answer "how did the week break down by day". The owner asked on 2026-11-06 for that daily view as two grouped bar charts, and the data is already in memory: the panel filters the week client-side, so no new query or schema change is needed.

This narrows the existing backlog candidate `feature-136-my-workouts-week-detailed-stats`, which was deliberately left open and explicitly deferred the activity-type breakdown out of `feature-135`. Promotion keeps number 136 and replaces the vague "detailed stats" title with the concrete slice.

## What Changes

- Add two grouped bar charts to the Week summary dialog, one bar per series per day (Monday–Sunday):
  - **Workouts per day** — walks and runs, counted separately.
  - **Distance per day** — summed kilometres for walks and runs, each series in its own bar.
- Derive the chart data from the same `visibleTracks` set and the same effective-distance helper the table and the existing totals use, so the dialog cannot disagree with its own summary.
- Attribute each workout to a weekday through the same timezone-aware calendar date the ISO-week filter uses (`recordingTimezone`), so a late-night workout stays on the day it happened.
- Keep the existing "Workouts" and "Distance" totals above the charts.
- Ignore other activity types (cycling, skiing, rowing, other) in both charts and state how many workouts were left out.
- Localize the new copy in English and Russian.
- Add `recharts` (3.10.1) as a client dependency for the charts.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: the owner's Week summary dialog gains per-day activity charts.

## Impact

- `components/admin-pages/workout-week-summary.tsx`: receives the per-day series, keeps the totals, renders the charts.
- New `components/admin-pages/workout-week-day-charts.tsx`: the recharts bar charts, legend, tooltip and empty states.
- `components/admin-pages/tracks-admin-panel.tsx`: derives the 7-day × 2-series matrix next to the existing `weekSummary` memo and passes it down.
- `lib/track-iso-week.ts`: expose the timezone-aware calendar-date/weekday helper that the week filter already computes internally.
- `app/i18n/locales/{en,ru}/trips.json`: new `workoutWeekChart*` keys.
- `package.json` / `package-lock.json`: `recharts@3.10.1` (peer range includes React 19).
- No Prisma schema change, no migration, no new query, no change to the week filter, sorting, fetching or pagination.

## Non-goals

- No server-side aggregate, cached statistics, or new endpoint.
- No gear-based totals, no per-type table, no monthly/yearly charts — those stay in the general `feature-136` pool of ideas for later slices.
- No chart for activity types other than walks and runs; they are only mentioned in a note.
- No charts on `All time` — the dialog only exists for a selected week.
- No change to the public track pages, `/my/tracks`, or `/admin/tracks`.
- No change to how distance is detected or which workouts count toward the existing totals.
