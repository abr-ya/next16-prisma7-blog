/**
 * Verifies feature-134's period model: recording-timezone month/year
 * boundaries, inclusive custom ranges, reversed ranges, missing starts, and
 * month/year shifting.
 *
 *   npx tsx scripts/check-workout-period-filter.ts
 */
import type { TrackListItem } from "../app/_data/tracks";
import {
  ALL_WORKOUT_PERIOD,
  formatWorkoutDateInput,
  getWorkoutPeriodKey,
  isWorkoutPeriodPaginated,
  matchesWorkoutPeriod,
  parseWorkoutDateInput,
  shiftWorkoutPeriod,
  type WorkoutPeriod,
} from "../lib/track-period";

const fail = (message: string): never => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

const assert = (condition: boolean, message: string) => {
  if (!condition) fail(message);
  console.log(`✓ ${message}`);
};

const track = (recordingStartAt: string | null, recordingTimezone: string) =>
  ({
    recordingStartAt: recordingStartAt ? new Date(recordingStartAt) : null,
    recordingTimezone,
  }) as unknown as TrackListItem;

const march = { kind: "month", year: 2026, month: 3 } as const;
const april = { kind: "month", year: 2026, month: 4 } as const;
const year2025 = { kind: "year", year: 2025 } as const;
const year2026 = { kind: "year", year: 2026 } as const;

// 23:40 on 31 March in Moscow.
const lateMarch = track("2026-03-31T20:40:00Z", "Europe/Moscow");
// 00:30 on 1 April in Moscow (still 31 March in UTC).
const earlyApril = track("2026-03-31T21:30:00Z", "Europe/Moscow");

assert(matchesWorkoutPeriod(lateMarch, march), "late March workout stays in March in its recording timezone");
assert(!matchesWorkoutPeriod(lateMarch, april), "late March workout is not in April");
assert(matchesWorkoutPeriod(earlyApril, april), "early April workout is in April");
assert(!matchesWorkoutPeriod(earlyApril, march), "early April workout is not in March");
assert(
  matchesWorkoutPeriod(track("2026-03-31T23:40:00Z", "UTC"), march) ===
    matchesWorkoutPeriod(track("2026-03-31T23:40:00Z", "UTC"), march),
  "matching is deterministic",
);

assert(matchesWorkoutPeriod(track("2025-12-31T20:00:00Z", "Europe/Moscow"), year2025), "year keeps 31 December");
assert(!matchesWorkoutPeriod(track("2025-12-31T20:00:00Z", "Europe/Moscow"), year2026), "31 December is not next year");
assert(
  matchesWorkoutPeriod(track("2025-12-31T21:30:00Z", "Europe/Moscow"), year2026),
  "1 January belongs to the new year",
);

const custom = { kind: "custom", from: "2026-03-01", to: "2026-03-31" } as const;

assert(matchesWorkoutPeriod(track("2026-03-01T12:00:00Z", "UTC"), custom), "custom range includes its start date");
assert(matchesWorkoutPeriod(track("2026-03-31T12:00:00Z", "UTC"), custom), "custom range includes its end date");
assert(!matchesWorkoutPeriod(track("2026-02-28T12:00:00Z", "UTC"), custom), "custom range excludes the day before");
assert(
  !matchesWorkoutPeriod(track("2026-04-01T12:00:00Z", "UTC"), { kind: "custom", from: "2026-03-31", to: "2026-03-01" }),
  "reversed custom range matches nothing",
);

const noStart = track(null, "UTC");
assert(matchesWorkoutPeriod(noStart, ALL_WORKOUT_PERIOD), "All time keeps workouts without a start");
assert(!matchesWorkoutPeriod(noStart, march), "a period excludes workouts without a start");

assert(
  getWorkoutPeriodKey(shiftWorkoutPeriod({ kind: "month", year: 2026, month: 1 }, -1)) === "month:2025-12",
  "month shift crosses the year boundary backwards",
);
assert(
  getWorkoutPeriodKey(shiftWorkoutPeriod({ kind: "month", year: 2025, month: 12 }, 1)) === "month:2026-01",
  "month shift crosses the year boundary forwards",
);
assert(getWorkoutPeriodKey(shiftWorkoutPeriod(year2026, 1)) === "year:2027", "year shift moves one calendar year");
assert(getWorkoutPeriodKey(ALL_WORKOUT_PERIOD) === "all", "All time has a stable key");

assert(isWorkoutPeriodPaginated(ALL_WORKOUT_PERIOD), "All time paginates");
assert(!isWorkoutPeriodPaginated({ kind: "week", week: { isoYear: 2026, week: 10 } }), "a week renders in full");
assert(isWorkoutPeriodPaginated(march), "a month paginates");
assert(isWorkoutPeriodPaginated(year2026), "a year paginates");
assert(isWorkoutPeriodPaginated(custom), "a custom range paginates");

const parsed = parseWorkoutDateInput("2026-03-01");
assert(parsed !== null && parsed.getMonth() === 2, "parses an ISO date input");
assert(parseWorkoutDateInput("2026-02-31") === null, "rejects a rolled-over date");
assert(formatWorkoutDateInput(new Date(2026, 2, 1, 12)) === "2026-03-01", "formats an ISO date input");

const periods: WorkoutPeriod[] = [ALL_WORKOUT_PERIOD, march, year2026, custom];
assert(new Set(periods.map(getWorkoutPeriodKey)).size === periods.length, "period keys are distinct");

console.log("All workout period assertions passed.");
