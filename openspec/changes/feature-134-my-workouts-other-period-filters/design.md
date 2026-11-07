# Design

## Context

`feature-132` filters workouts with a `selectedWeek: IsoWeekRef | null` and `getIsoWeekForTrack`, which converts the effective start to a calendar date in `recordingTimezone` and then asks date-fns for the ISO week. The same calendar date already drives the `feature-136` charts. The filter popover is a single `Popover` with a year select, a week select, and `All time` / `This week` buttons; the table renders a selected week in full and paginates `All time`.

## Goals / Non-Goals

**Goals:**

- Add calendar month, calendar year, and inclusive custom-range modes without a second filter model.
- Keep timezone boundaries identical to the week filter.
- Paginate every mode except a selected week, and reset to page 1 on a period change.

**Non-Goals:**

- Rolling windows, period summaries/charts, URL persistence, server-side filtering.
- Changes to the track tables, the workout column set, or sorting.

## Decisions

**One period union replaces `selectedWeek`.** `lib/track-period.ts` defines:

```ts
type WorkoutPeriod =
  | { kind: "all" }
  | { kind: "week"; week: IsoWeekRef }
  | { kind: "month"; year: number; month: number } // 1–12
  | { kind: "year"; year: number }
  | { kind: "custom"; from: string; to: string };  // YYYY-MM-DD
```

The panel stores one `period` value. `selectedWeek` becomes a derived value (`period.kind === "week" ? period.week : null`), so the `feature-135/136` summary and charts keep their existing contract.

**Boundaries come from the recording-timezone calendar date.** `getTrackCalendarDate(track)` returns a local-noon `Date` carrying the recorded Y/M/D. Month and year compare those components. For a custom range, `YYYY-MM-DD` strings are parsed into local-noon dates and compared inclusively, so DST and offset changes cannot move a workout across a boundary. A track without an effective start has no calendar date and is excluded from every non-`All time` period, matching the week behavior.

**The popover gains a mode row.** A compact segmented list switches between `All time`, `Week`, `Month`, `Year`, and `Custom`. Week keeps the existing year/week selects; month shows a year select, a localized month select, and previous/next arrows; year shows a year select and arrows; custom shows two native date inputs plus Apply. The arrows in the toolbar shift whichever period is active and are disabled on `All time`. `This week`, `This month`, and `This year` quick actions set the period to the current calendar unit. Opening the picker while `All time` is active preselects **Week** with the current week's controls, so the owner needs one click to pick a week instead of two; the table stays on `All time` until a week is actually chosen.

**Options derive from loaded workouts.** Year options (and month options inside a year) come from the years present in the loaded tracks plus the current year, so older data stays reachable without hardcoding a range. Month names come from `Intl.DateTimeFormat(activeLanguage, { month: "long" })`, avoiding a month-name catalog in the locale files.

**Pagination is period-dependent.** `All time` keeps pagination, a selected week renders every row, and month/year/custom use the existing page size. `pageResetKey` becomes a stable period key (for example `month:2026-03`, `year:2026`, `custom:2026-03-01..2026-03-31`), so any period change returns to page 1 while TanStack keeps the column sort.

**Week summary stays week-only.** The summary button and daily charts render only for `kind === "week"`; the month/year/custom views are plain filtered tables. Extending the summary to other periods is a separate design because the current charts are seven-day series.

**No server work.** The panel already receives the complete workout set client-side; filtering stays a `useMemo` over it, exactly like the week slice.

## Risks / Trade-offs

- A year can contain hundreds of rows. Pagination bounds the render, but the filtered array still evaluates every loaded track on each period change; that is the same cost the week filter already pays.
- Adding four modes to one popover could crowd it. Keeping the mode row separate from the conditional controls and testing the Russian labels covers the risk.
- Custom date inputs are timezone-neutral strings; comparing them to the recorded calendar date is intentional, but the UI must state that the boundaries are recording dates, not browser dates.
- A reversed custom range is rejected rather than silently swapped, so the owner sees what was applied.
