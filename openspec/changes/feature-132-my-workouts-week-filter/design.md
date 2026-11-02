# Design

## Context

`/my/workouts` is a client table rendered by `TrackManagementPanel` with the short `createTrackWorkoutColumns` variant. The page server-loads the owner's workouts as one array and `DataTable` paginates and sorts it in memory. `feature-129` set `started desc` as the default sort; `feature-131` made the ranking columns sortable.

The visible **Started** value is the recording-start mirror, falling back to the parsed GPX summary start. The filter must use the same value, otherwise a row can display a date outside the selected week.

## Decision: ISO 8601 weeks, filtered in memory

The filter is a client-side step before `DataTable`:

```ts
const visibleTracks = selectedWeek ? tracks.filter((track) => belongsToWeek(track, selectedWeek)) : tracks;
```

`All time` is the initial state (`selectedWeek === null`), so opening the page is unchanged.

Weeks follow **ISO 8601**:

- Monday is the first day;
- week 1 is the week containing the first Thursday (equivalently, 4 January);
- a year has 52 or 53 weeks — 2026 has 53;
- the ISO week-year is used as the year label, so `29 Dec 2025` belongs to `2026-W01`.

`date-fns` already in the project supplies `getISOWeek`, `getISOWeekYear`, `startOfISOWeek`, and `addWeeks`; no dependency is added.

### Which date decides the week

The filter uses the effective recording start, in the workout's `recordingTimezone` when set, falling back to the browser timezone. Converting the instant to the wall-clock date in that zone keeps the filter consistent with the **Started** column. A workout with no effective start is hidden while a week is selected and returns under `All time`.

### The control

A compact control above the table:

`‹  Week 45 · 2–8 Nov 2026  ›`

- the label shows the ISO week number and the localized date range; `All time` when no week is selected;
- the arrows move one ISO week back or forward, crossing year boundaries and 53-week years correctly;
- clicking the label opens a popover with an ISO week-year select and a week select whose options include the date range; the current week is marked;
- **This week** inside the popover selects the current ISO week;
- the arrows are disabled while `All time` is selected; the picker and **This week** are the way in.

The year list contains the ISO week-years present in the loaded workouts plus the current one, so an owner with older data can still reach it.

### Pagination follows the filter

- `All time` stays paginated with the existing page size.
- A selected week renders the whole week without pagination. A week is a naturally small set, and paging inside it is more friction than value.
- Switching between the two modes returns the paginated view to its first page without resetting the chosen column sort. `DataTable` gets a small `pageResetKey` input for that; it is not a second sorting mechanism.

Future month/year filters decide their own pagination when they are designed; the default is paginated unless the result set is known to be small.

### Why not a native `<input type="week">`

Browser styling and locale behaviour differ, the date range is not visible, and the value shape is not ISO-week-aware across browsers. The project already has select and popover primitives.

### Why not server-side filtering

The page already loads the whole owner set before client sorting and pagination. Filtering the same array is immediate, needs no round trip, and composes with the existing `DataTable` without a URL contract.

## Risks

- A workout near midnight can change week depending on the timezone used. Using the recording timezone keeps it aligned with the displayed start; rows without a zone fall back to the browser.
- Hiding no-start rows can make a selected week look empty; the table's existing empty state covers it, and `All time` restores the rows.
- Filtering must not reset the owner's chosen sort. Only the row set changes; `DataTable` resets the page through `pageResetKey` while leaving sorting alone.
- A week with more rows than the old page size renders in full. That is intended for the week view; if weekly volume ever grows enough to hurt, the filter and pagination both move to the server together.
