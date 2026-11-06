import { addDays, addWeeks, getISOWeek, getISOWeekYear, startOfISOWeek } from "date-fns";

import type { TrackListItem } from "@/app/_data/tracks";
import { getEffectiveTrackStart } from "@/lib/track-effective-values";

/** feature-132: ISO 8601 week date — Monday start, week 1 contains 4 January. */
export type IsoWeekRef = {
  isoYear: number;
  week: number;
};

export type IsoWeekRange = {
  start: Date;
  end: Date;
};

const normalizeTimezone = (timezone?: string | null) => {
  const candidate = timezone?.trim() || Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  try {
    new Intl.DateTimeFormat("en-US", { timeZone: candidate }).format(new Date());
    return candidate;
  } catch {
    return "UTC";
  }
};

/**
 * Convert an instant to the calendar date it has in `timezone`. The returned
 * Date is built at local noon so date-fns reads the intended Y/M/D regardless
 * of the runtime timezone or DST boundaries.
 */
const toCalendarDate = (instant: Date, timezone?: string | null) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: normalizeTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);

  const get = (type: string) => parts.find((part) => part.type === type)?.value;
  const year = Number(get("year"));
  const month = Number(get("month"));
  const day = Number(get("day"));

  if (!year || !month || !day) return null;

  return new Date(year, month - 1, day, 12);
};

export const getIsoWeekForDate = (date: Date): IsoWeekRef => ({
  isoYear: getISOWeekYear(date),
  week: getISOWeek(date),
});

/**
 * feature-136: the calendar date a workout happened on, read in the
 * recording's own timezone. The week filter and the week charts both go
 * through this, so a late-night session cannot land on one day in the table
 * and another in the charts when the browser sits in a different zone.
 */
export const getTrackCalendarDate = (track: TrackListItem): Date | null => {
  const start = getEffectiveTrackStart(track);
  if (!start) return null;

  const instant = new Date(start);
  if (Number.isNaN(instant.getTime())) return null;

  return toCalendarDate(instant, track.recordingTimezone);
};

export const getIsoWeekForTrack = (track: TrackListItem): IsoWeekRef | null => {
  const calendarDate = getTrackCalendarDate(track);
  return calendarDate ? getIsoWeekForDate(calendarDate) : null;
};

/** Monday-first index of a calendar date: 0 = Monday … 6 = Sunday. */
export const getIsoWeekdayIndex = (date: Date): number => (date.getDay() + 6) % 7;

/** Monday of the given ISO week. 4 January always belongs to week 1. */
export const getIsoWeekStart = (isoYear: number, week: number): Date => {
  const januaryFourth = new Date(isoYear, 0, 4, 12);
  const weekOneStart = startOfISOWeek(januaryFourth);

  return addWeeks(weekOneStart, week - 1);
};

export const getIsoWeekRange = (isoYear: number, week: number): IsoWeekRange => {
  const start = getIsoWeekStart(isoYear, week);

  return { start, end: addDays(start, 6) };
};

/** 28 December always falls in the last ISO week of its week-year. */
export const getIsoWeeksInYear = (isoYear: number): number => getISOWeek(new Date(isoYear, 11, 28, 12));

export const shiftIsoWeek = (current: IsoWeekRef, delta: -1 | 1): IsoWeekRef => {
  const start = getIsoWeekStart(current.isoYear, current.week);

  return getIsoWeekForDate(addWeeks(start, delta));
};

/**
 * `2–8 Nov 2026`, `30 Nov – 6 Dec 2026`, or `29 Dec 2025 – 4 Jan 2026`
 * depending on the month and year the week spans.
 */
export const formatIsoWeekRange = (range: IsoWeekRange, language: string): string => {
  const sameYear = range.start.getFullYear() === range.end.getFullYear();
  const sameMonth = sameYear && range.start.getMonth() === range.end.getMonth();

  const startText = new Intl.DateTimeFormat(language, {
    day: "numeric",
    ...(sameMonth ? {} : { month: "short" }),
    ...(sameYear ? {} : { year: "numeric" }),
  }).format(range.start);

  const endText = new Intl.DateTimeFormat(language, {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(range.end);

  return `${startText} – ${endText}`;
};
