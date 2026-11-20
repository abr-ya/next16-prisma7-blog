/**
 * Asserts the moving-time derivation: continuous movement keeps moving equal
 * to elapsed, a stationary window of at least a minute is subtracted, several
 * stops merge, a trailing stop is removed, GPS jitter inside the stop radius
 * counts as stopped, a short pause is ignored, and a missing timeline returns
 * null. Run with:
 *
 *   npx tsx scripts/check-track-moving-time.ts
 */
import { computeMovingDurationSeconds } from "../lib/track-gpx-parser";

let failures = 0;

const expect = (label: string, actual: number | null, expected: number | null) => {
  if (actual === expected) {
    console.log(`✓ ${label}: ${actual}`);
    return;
  }

  failures += 1;
  console.error(`✗ ${label}: actual=${actual} expected=${expected}`);
};

const base = Date.UTC(2026, 0, 1, 8, 0, 0);
const STEP_METERS = 30;
const at = (seconds: number, meters = 0) => ({
  timestamp: base + seconds * 1000,
  lat: meters / 111_320,
  lng: 0,
});

const every = (fromSeconds: number, toSeconds: number, stepSeconds: number, startMeters: number) => {
  const points = [];
  let meters = startMeters;

  for (let second = fromSeconds; second <= toSeconds; second += stepSeconds) {
    points.push(at(second, meters));
    meters += STEP_METERS;
  }

  return points;
};

// Case 1: continuous movement at 3 m/s → moving equals elapsed.
{
  const points = every(0, 100, 10, 0);
  expect("continuous movement keeps moving equal to elapsed", computeMovingDurationSeconds(points), 100);
}

// Case 2: one stationary minute, then movement → the minute is subtracted.
{
  const stationary = Array.from({ length: 7 }, (_, index) => at(index * 10, 0));
  const moving = every(70, 120, 10, STEP_METERS);
  const points = [...stationary, ...moving];
  expect("a stationary minute is subtracted", computeMovingDurationSeconds(points), 60);
}

// Case 3: two stationary windows separated by movement → both are subtracted.
{
  const firstStop = Array.from({ length: 7 }, (_, index) => at(index * 10, 0));
  const mid = [at(70, STEP_METERS), at(80, 2 * STEP_METERS), at(90, 3 * STEP_METERS)];
  const secondStop = Array.from({ length: 7 }, (_, index) => at(100 + index * 10, 4 * STEP_METERS));
  const tail = [at(170, 5 * STEP_METERS), at(180, 6 * STEP_METERS), at(190, 7 * STEP_METERS), at(200, 8 * STEP_METERS)];
  const points = [...firstStop, ...mid, ...secondStop, ...tail];
  expect("several stops are merged and subtracted", computeMovingDurationSeconds(points), 80);
}

// Case 4: a stop that runs to the end of the track.
{
  const moving = every(0, 60, 10, 0);
  const stationary = Array.from({ length: 8 }, (_, index) => at(60 + index * 10, 6 * STEP_METERS));
  expect("a trailing stop is subtracted", computeMovingDurationSeconds([...moving, ...stationary.slice(1)]), 60);
}

// Case 5: jitter that never leaves the radius still counts as a stop.
{
  const points = Array.from({ length: 13 }, (_, index) => at(index * 10, index % 2 === 0 ? 0 : 5));
  expect("jitter inside the radius counts as stopped", computeMovingDurationSeconds(points), 0);
}

// Case 6: a pause shorter than the window is not subtracted.
{
  const pause = Array.from({ length: 5 }, (_, index) => at(index * 10, 0));
  const moving = every(40, 100, 10, 0);
  expect("a sub-minute pause is ignored", computeMovingDurationSeconds([...pause.slice(0, -1), ...moving]), 100);
}

// Case 7: fewer than two timed points has no value.
expect("no timed points gives null", computeMovingDurationSeconds([]), null);
expect("one timed point gives null", computeMovingDurationSeconds([at(0, 0)]), null);

// Case 8: a zero-length elapsed time clamps to zero.
{
  const sameInstant = [at(0, 0), at(0, 10)];
  expect("zero elapsed clamps to zero", computeMovingDurationSeconds(sameInstant), 0);
}

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}

console.log("\nAll moving-time checks passed");
