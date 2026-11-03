# Proposal

## Why

`/my/workouts` currently shows every workout the owner has ever recorded, ordered by `started desc`. That is fine for a quick glance, but an owner reviewing a training block has to scroll until the dates fall out of the wanted range. A week is the natural unit for that review, and it already matches how the list displays the recording date.

## What Changes

- Add a week filter to `/my/workouts`, closed by default (`All time`) so the page keeps its current behaviour.
- Use ISO 8601 weeks: Monday start, week 1 contains the first Thursday, and the ISO week-year may differ from the calendar year at year boundaries.
- Show a compact control — previous/next week, the week number and its date range, and a picker with the ISO week-year and the week list.
- Add a **This week** shortcut inside the picker.
- Filter each workout by the week of its effective recording start in the workout's own recording timezone, matching the **Started** column.
- Hide workouts without a recording start while a week is selected; `All time` shows them again.
- Keep `All time` paginated; render a selected week in full without pagination, while preserving the chosen sort.
- Keep the existing sorting, the `started desc` default, and the short column set unchanged.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: the owner's workout list can be narrowed to one ISO week.

## Impact

- `components/admin-pages/tracks-admin-panel.tsx`: week-filter state, filtering before the table, and the filter control.
- A small ISO-week helper used by the panel; `date-fns` already provides the week primitives.
- en/ru copy for the control and the empty week state.
- No data, schema, route, or query change; filtering stays client-side over the loaded owner set.

## Non-goals

- No month, quarter, year, or custom-range filters — those are `feature-134-my-workouts-other-period-filters`.
- No persisted filter across reloads or sessions, and no URL state.
- No server-side filtering or pagination.
- No change to the default `All time` view, the column set, or the sorting defaults.
