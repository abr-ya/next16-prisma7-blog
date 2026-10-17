/**
 * Helpers for the manual (Place on map) track creation flow in
 * feature-112-outdoor-track-creation-public-metadata. The form layer
 * (section 4 of the change) submits a duration split into `HH:MM` (or
 * `HH:MM:SS` when the "include seconds" toggle is on) and a wall-clock
 * datetime plus IANA timezone; these helpers parse and validate both
 * shapes into the persisted scalar forms.
 */

import { requireTrackRecordingTimezone } from "@/lib/track-recording-timezone";

/** Upper bound is one full day — tracks longer than 24h are out of scope. */
export const MAX_TRACK_DURATION_SECONDS = 86_400;

/** Accepts `YYYY-MM-DDTHH:MM` (default) and `YYYY-MM-DDTHH:MM:SS` (seconds toggle). */
const WALL_CLOCK_PATTERN = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

export class TrackDurationInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrackDurationInputError";
  }
}

export class TrackStartAtParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TrackStartAtParseError";
  }
}

/**
 * Parse a `HH[:MM[:SS]]` duration (from the form's three numeric inputs) into
 * whole seconds. Throws `TrackDurationInputError` on any non-finite, negative,
 * out-of-range component, or total above one day.
 */
export const parseDurationInput = ({
  hours,
  minutes,
  seconds,
}: {
  hours: number;
  minutes: number;
  seconds?: number;
}): number => {
  const h = Number(hours);
  const m = Number(minutes);
  const s = Number(seconds ?? 0);

  if (!Number.isFinite(h) || !Number.isFinite(m) || !Number.isFinite(s)) {
    throw new TrackDurationInputError("Duration components must be finite numbers");
  }
  if (h < 0 || m < 0 || s < 0) {
    throw new TrackDurationInputError("Duration components must be non-negative");
  }
  if (h > 24 || m > 59 || s > 59) {
    throw new TrackDurationInputError("Duration components are out of range");
  }

  const total = Math.round(h * 3600 + m * 60 + s);
  if (total > MAX_TRACK_DURATION_SECONDS) {
    throw new TrackDurationInputError("Duration must be at most 24 hours");
  }

  return total;
};

/**
 * Validate a precomputed seconds count (e.g. one already produced by the form
 * via `parseDurationInput`) and return it untouched. Used by the server action
 * to re-check the value on the wire.
 */
export const parseDurationSeconds = (value: number): number => {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new TrackDurationInputError("Recording duration must be a finite number");
  }
  if (!Number.isInteger(value)) {
    throw new TrackDurationInputError("Recording duration must be a whole number of seconds");
  }
  if (value < 0) {
    throw new TrackDurationInputError("Recording duration must be non-negative");
  }
  if (value > MAX_TRACK_DURATION_SECONDS) {
    throw new TrackDurationInputError("Recording duration must be at most 24 hours");
  }

  return value;
};

/**
 * Inverse of `parseDurationInput` — split a stored `recordingDurationSeconds`
 * back into the three numeric inputs the form collects (`hours`, `minutes`,
 * `seconds`) plus the `includeSeconds` boolean the form uses to decide whether
 * to render the seconds field. Returns string components so they bind to the
 * form's string-typed inputs without coercion, and zeros for any component
 * when the stored value is `null`.
 */
export const parseStoredDurationToHms = (
  seconds: number | null,
): { hours: string; minutes: string; seconds: string; includeSeconds: boolean } => {
  if (seconds === null || seconds === undefined) {
    return { hours: "0", minutes: "0", seconds: "0", includeSeconds: false };
  }

  const safe = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const remainingSeconds = safe % 60;

  return {
    hours: String(hours),
    minutes: String(minutes),
    seconds: String(remainingSeconds),
    includeSeconds: remainingSeconds !== 0,
  };
};

/**
 * Compute the offset (in minutes) of `timezone` from UTC at the given UTC
 * instant. Returns a positive number for timezones east of UTC (e.g. +180 for
 * Europe/Moscow) and a negative number for timezones west of UTC. Used to
 * translate a wall-clock value to a UTC `Date`.
 */
const getTimezoneOffsetMinutes = (timezone: string, utcDate: Date): number => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  const parts = formatter.formatToParts(utcDate);
  const get = (type: string) => parts.find((p) => p.type === type)?.value;

  const year = parseInt(get("year") ?? "0", 10);
  const month = parseInt(get("month") ?? "0", 10);
  const day = parseInt(get("day") ?? "0", 10);
  // Some locales emit "24" for midnight — normalise to 0.
  const hour = parseInt(get("hour") === "24" ? "0" : (get("hour") ?? "0"), 10);
  const minute = parseInt(get("minute") ?? "0", 10);
  const second = parseInt(get("second") ?? "0", 10);

  const asIfUtc = Date.UTC(year, month - 1, day, hour, minute, second);
  return Math.round((asIfUtc - utcDate.getTime()) / 60_000);
};

/**
 * Parse a wall-clock datetime (no offset, no Z) plus an IANA timezone into a
 * UTC `Date`. Validates the wall-clock shape and the timezone through
 * `requireTrackRecordingTimezone` so unsupported zones throw a typed error.
 */
export const parseManualTrackStartAt = ({ wallClock, timezone }: { wallClock: string; timezone: string }): Date => {
  if (typeof wallClock !== "string" || wallClock.trim().length === 0) {
    throw new TrackStartAtParseError("Recording start is required");
  }

  const match = WALL_CLOCK_PATTERN.exec(wallClock.trim());
  if (!match) {
    throw new TrackStartAtParseError("Recording start must be ISO 8601 wall-clock (YYYY-MM-DDTHH:MM[:SS])");
  }

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = parseInt(match[6] ?? "0", 10);

  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59 || second > 59) {
    throw new TrackStartAtParseError("Recording start has out-of-range components");
  }

  let normalizedTimezone: string;
  try {
    normalizedTimezone = requireTrackRecordingTimezone(timezone);
  } catch (error) {
    throw new TrackStartAtParseError(error instanceof Error ? error.message : "Recording timezone is invalid");
  }

  // Construct a fake UTC instant at the wall-clock value, then subtract the
  // timezone offset at that instant to recover the true UTC instant.
  const fakeUtc = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  const offsetMinutes = getTimezoneOffsetMinutes(normalizedTimezone, fakeUtc);
  return new Date(fakeUtc.getTime() - offsetMinutes * 60_000);
};
