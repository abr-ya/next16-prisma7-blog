// feature-123: the wording-independent parts of the quick workout upload.
//
// The button set, the suggested titles and their wording live in the
// interface dictionary — the code knows *when* a part of the day applies and
// *how* a slug is spelled, never what the day is called. A Russian adjective
// agrees with its noun in a way no rule can derive, so the translator picks
// the adjective and the code picks the bucket.

export const QUICK_WORKOUT_DAYPARTS = ["night", "morning", "day", "evening"] as const;

export type QuickWorkoutDaypart = (typeof QUICK_WORKOUT_DAYPARTS)[number];

export type QuickWorkoutLocalTime = {
  year: number;
  /** 1–12. */
  month: number;
  day: number;
  hours: number;
  minutes: number;
};

/**
 * The wall-clock of an instant, read in the recording's own timezone.
 *
 * A file recorded in Moscow says `+03:00` in its timestamps. Read on a device
 * in Sofia, that instant is an hour earlier — so the owner's own morning
 * recording looks like an early-morning one, and a night recording looks like
 * an evening one. The file's offset is the recording's wall-clock, and it is
 * what the daypart, the slug and the preview all read.
 *
 * A file that names no offset has naive timestamps: its wall-clock is the
 * device's, and there is nothing else to read. `null` falls back to the
 * device's own local time, which is the only reference there is.
 */
export const getQuickWorkoutLocalTime = (date: Date, utcOffsetMinutes: number | null): QuickWorkoutLocalTime => {
  if (utcOffsetMinutes === null || !Number.isFinite(utcOffsetMinutes)) {
    return {
      year: date.getFullYear(),
      month: date.getMonth() + 1,
      day: date.getDate(),
      hours: date.getHours(),
      minutes: date.getMinutes(),
    };
  }

  // The offset is a whole number of minutes, so shifting the instant and
  // reading its UTC parts is exact.
  const shifted = new Date(date.getTime() + Math.trunc(utcOffsetMinutes) * 60_000);

  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hours: shifted.getUTCHours(),
    minutes: shifted.getUTCMinutes(),
  };
};

/**
 * The four parts of the day a suggested title can name.
 *
 * The boundaries are the same moment of the day in every language, so they
 * live in the code:
 *
 * - `night`   00:00–04:59
 * - `morning` 05:00–11:59
 * - `day`     12:00–16:59
 * - `evening` 17:00–22:59
 *
 * The hours are the *recording's* own hours — read in the file's UTC offset
 * when the file names one, and in the device's local time otherwise. The
 * title stays editable either way.
 */
export const getQuickWorkoutDaypart = (date: Date, utcOffsetMinutes: number | null = null): QuickWorkoutDaypart => {
  const { hours } = getQuickWorkoutLocalTime(date, utcOffsetMinutes);

  if (hours < 5) return "night";
  if (hours < 12) return "morning";
  if (hours < 17) return "day";

  return "evening";
};

/**
 * The slug base the quick upload proposes for a recording: the activity type,
 * the local date and the local time — `walking-2026-10-25-0830`.
 *
 * A title-derived slug collides the second time the owner walks in the same
 * morning, and the quick dialog has no slug field to fix it with. A date and a
 * time do not collide. The server still sanitizes the base with `createSlug`
 * and appends `-2`, `-3`, … until the slug is free.
 */
export const buildQuickWorkoutSlugBase = ({
  activityTypeKey,
  startAt,
  utcOffsetMinutes = null,
}: {
  activityTypeKey: string;
  startAt: Date;
  utcOffsetMinutes?: number | null;
}) => {
  const { year, month, day, hours, minutes } = getQuickWorkoutLocalTime(startAt, utcOffsetMinutes);
  const monthPart = String(month).padStart(2, "0");
  const dayPart = String(day).padStart(2, "0");
  const hoursPart = String(hours).padStart(2, "0");
  const minutesPart = String(minutes).padStart(2, "0");

  return `${activityTypeKey}-${year}-${monthPart}-${dayPart}-${hoursPart}${minutesPart}`;
};

/**
 * The bare noun as a title — `прогулка` becomes `Прогулка`.
 *
 * The dictionary keeps the noun lowercase, because it is also the second half
 * of a daypart title (`Утренняя прогулка`), where Russian wants it small.
 * Only the standalone title capitalizes it.
 */
export const capitalizeQuickWorkoutNoun = (noun: string) =>
  noun ? `${noun.charAt(0).toUpperCase()}${noun.slice(1)}` : noun;
