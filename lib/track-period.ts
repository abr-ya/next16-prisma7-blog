import type { TrackListItem } from "@/app/_data/tracks";
import { getIsoWeekForDate, getTrackCalendarDate, shiftIsoWeek, type IsoWeekRef } from "@/lib/track-iso-week";

/**
 * feature-134: the workout period selection. `week` keeps the existing ISO
 * week shape; month and year are calendar units resolved in the track's
 * recording timezone; custom holds inclusive `YYYY-MM-DD` boundaries.
 */
export type WorkoutPeriod =
  | { kind: "all" }
  | { kind: "week"; week: IsoWeekRef }
  | { kind: "month"; year: number; month: number }
  | { kind: "year"; year: number }
  | { kind: "custom"; from: string; to: string };

export const ALL_WORKOUT_PERIOD: WorkoutPeriod = { kind: "all" };

const DATE_INPUT_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

/** Parses a `YYYY-MM-DD` input into a local-noon date, rejecting rollovers. */
export const parseWorkoutDateInput = (value: string): Date | null => {
  const match = DATE_INPUT_PATTERN.exec(value.trim());

  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day, 12);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;

  return date;
};

export const formatWorkoutDateInput = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};

export const getCurrentWorkoutMonthPeriod = (now = new Date()): Extract<WorkoutPeriod, { kind: "month" }> => ({
  kind: "month",
  year: now.getFullYear(),
  month: now.getMonth() + 1,
});

export const getCurrentWorkoutYearPeriod = (now = new Date()): Extract<WorkoutPeriod, { kind: "year" }> => ({
  kind: "year",
  year: now.getFullYear(),
});

/** Whether the track's recording-timezone calendar date falls in the period. */
export const matchesWorkoutPeriod = (track: TrackListItem, period: WorkoutPeriod) => {
  if (period.kind === "all") return true;

  const calendarDate = getTrackCalendarDate(track);

  if (!calendarDate) return false;

  if (period.kind === "week") {
    const week = getIsoWeekForDate(calendarDate);

    return week.isoYear === period.week.isoYear && week.week === period.week.week;
  }

  if (period.kind === "month") {
    return calendarDate.getFullYear() === period.year && calendarDate.getMonth() + 1 === period.month;
  }

  if (period.kind === "year") {
    return calendarDate.getFullYear() === period.year;
  }

  const from = parseWorkoutDateInput(period.from);
  const to = parseWorkoutDateInput(period.to);

  if (!from || !to || from.getTime() > to.getTime()) return false;

  const date = calendarDate.getTime();

  return date >= from.getTime() && date <= to.getTime();
};

/** Shifts a week/month/year period by one unit; All time and custom stay put. */
export const shiftWorkoutPeriod = (period: WorkoutPeriod, direction: -1 | 1): WorkoutPeriod => {
  if (period.kind === "week") {
    return { kind: "week", week: shiftIsoWeek(period.week, direction) };
  }

  if (period.kind === "month") {
    const totalMonths = period.year * 12 + (period.month - 1) + direction;

    return {
      kind: "month",
      year: Math.floor(totalMonths / 12),
      month: (((totalMonths % 12) + 12) % 12) + 1,
    };
  }

  if (period.kind === "year") {
    return { kind: "year", year: period.year + direction };
  }

  return period;
};

/** Stable identity for `pageResetKey`; changing it resets the page, not the sort. */
export const getWorkoutPeriodKey = (period: WorkoutPeriod) => {
  if (period.kind === "all") return "all";
  if (period.kind === "week") return `week:${period.week.isoYear}-${period.week.week}`;
  if (period.kind === "month") return `month:${period.year}-${String(period.month).padStart(2, "0")}`;
  if (period.kind === "year") return `year:${period.year}`;

  return `custom:${period.from}..${period.to}`;
};

/** A selected week renders in full; every other period paginates. */
export const isWorkoutPeriodPaginated = (period: WorkoutPeriod) => period.kind !== "week";
