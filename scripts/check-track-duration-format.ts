/**
 * Asserts the shared duration formatter: whole minutes stay compact, a
 * non-zero seconds remainder is shown, zero units are omitted, and a missing
 * value stays null. Run with:
 *
 *   npx tsx scripts/check-track-duration-format.ts
 */
import { formatTrackDuration } from "../lib/track-gpx-metadata";

let failures = 0;

const expect = (seconds: number | null | undefined, expected: string | null) => {
  const actual = formatTrackDuration(seconds);

  if (actual === expected) {
    console.log(`✓ ${seconds} → ${actual}`);
    return;
  }

  failures += 1;
  console.error(`✗ ${seconds}: actual=${actual} expected=${expected}`);
};

expect(null, null);
expect(undefined, null);
expect(0, "0 min");
expect(45, "45 s");
expect(60, "1 min");
expect(61, "1 min 1 s");
expect(5310, "1 h 28 min 30 s");
expect(3630, "1 h 30 s");
expect(3600, "1 h");
expect(3599, "59 min 59 s");
expect(3661, "1 h 1 min 1 s");
expect(59.6, "1 min");

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}

console.log("\nAll duration-format checks passed");
