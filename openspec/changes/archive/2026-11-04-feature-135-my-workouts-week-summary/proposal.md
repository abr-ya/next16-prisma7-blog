# Proposal

## Why

`feature-132-my-workouts-week-filter` lets the owner narrow `/my/workouts` to one ISO week, but the filtered list answers only "which workouts" — the owner still has to read the rows and add up distances to answer "how much did I do that week". The week control is the natural place for that answer, and the selected week is already a small, fully rendered set, so the numbers can be derived on the client without a new query.

## What Changes

- Show a compact week summary next to the week filter whenever an ISO week is selected: the number of workouts in the week and the summed distance of the workouts that carry a parsed distance.
- Make the summary a button that opens a dialog repeating the selected week label, the workout count, and the total distance.
- Hide the summary on `All time`, where no single week is selected.
- Localize the new copy in English and Russian, including plural forms for the workout count.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: the owner's workout list gains the selected-week summary and its detail dialog.

## Impact

- `components/admin-pages/tracks-admin-panel.tsx`: render the summary in the workouts toolbar and pass the derived values.
- New `components/admin-pages/workout-week-summary.tsx`: the summary button and its dialog.
- `lib/track-effective-values.ts`: extract the effective start / distance / duration accessors that the workout columns already use, so the summary sums exactly the distance the table shows. `lib/track-iso-week.ts` and `components/admin-pages/tracks-workout-columns.tsx` switch to the shared helpers with no behavior change.
- `app/i18n/locales/{en,ru}/trips.json`: the new `workoutWeekSummary*` keys.
- No schema change, no new query, and no change to the week filter, sorting, or pagination behavior.

## Non-goals

- No breakdown by activity type, gear, or any other aggregate — that is `feature-136`.
- No server-side aggregate or cached statistics.
- No change to `/my/tracks`, `/admin/tracks`, or the public track pages.
- No period filters beyond the ISO week — those are `feature-134`.
