import assert from "node:assert/strict";

import { buildQuickWorkoutSlugBase, getQuickWorkoutDaypart, getQuickWorkoutLocalTime } from "@/lib/quick-workout";
import { formatTrackRecordingDateTime } from "@/lib/track-gpx-metadata";
import { parseTrackGpxUtcOffsetMinutes, readGpxUtcOffsetMinutes } from "@/lib/track-gpx-parser";
import {
  formatFixedUtcOffset,
  formatTrackRecordingTimezone,
  normalizeTrackRecordingTimezone,
  resolveQuickWorkoutRecordingTimezone,
  toRecordingTimezoneFromUtcOffset,
} from "@/lib/track-recording-timezone";

// A recording made in Moscow: 08:30 local, `+03:00` in the file.
const moscowGpx = `<gpx><trk><trkseg>
  <trkpt lat="55.75" lon="37.61"><time>2026-10-26T08:30:00+03:00</time></trkpt>
  <trkpt lat="55.76" lon="37.62"><time>2026-10-26T09:00:00+03:00</time></trkpt>
</trkseg></trk></gpx>`;

assert.equal(readGpxUtcOffsetMinutes("2026-10-26T08:30:00+03:00"), 180);
assert.equal(readGpxUtcOffsetMinutes("2026-10-26T08:30:00Z"), 0);
assert.equal(readGpxUtcOffsetMinutes("2026-10-26T08:30:00-04:30"), -270);
assert.equal(readGpxUtcOffsetMinutes("2026-10-26T08:30:00"), null);

assert.equal(parseTrackGpxUtcOffsetMinutes(moscowGpx), 180);
assert.equal(parseTrackGpxUtcOffsetMinutes("<gpx></gpx>"), null);

assert.equal(formatFixedUtcOffset(180), "+03:00");
assert.equal(formatFixedUtcOffset(-270), "-04:30");
assert.equal(formatFixedUtcOffset(0), "+00:00");
assert.equal(formatFixedUtcOffset(15 * 60), null);

assert.equal(normalizeTrackRecordingTimezone("+03:00"), "+03:00");
assert.equal(normalizeTrackRecordingTimezone("UTC+03:00"), "+03:00");
assert.equal(normalizeTrackRecordingTimezone("+0300"), "+03:00");
assert.equal(normalizeTrackRecordingTimezone("Europe/Sofia"), "Europe/Sofia");
assert.equal(normalizeTrackRecordingTimezone("Not/A-Timezone"), null);

assert.equal(formatTrackRecordingTimezone("+03:00"), "UTC+03:00");
assert.equal(formatTrackRecordingTimezone("Europe/Sofia"), "Europe/Sofia");
assert.equal(formatTrackRecordingTimezone(null), "UTC (unconfirmed)");

assert.equal(toRecordingTimezoneFromUtcOffset(180), "+03:00");
assert.equal(toRecordingTimezoneFromUtcOffset(0), "UTC");
assert.equal(toRecordingTimezoneFromUtcOffset(null), null);

// The quick upload's fallback: the file's offset wins, and the device's
// timezone is the fallback for a file that names none.
assert.equal(resolveQuickWorkoutRecordingTimezone(180, "Europe/Sofia"), "+03:00");
assert.equal(resolveQuickWorkoutRecordingTimezone(0, "Europe/Sofia"), "UTC");
assert.equal(resolveQuickWorkoutRecordingTimezone(null, "Europe/Sofia"), "Europe/Sofia");
assert.equal(resolveQuickWorkoutRecordingTimezone(null, "Not/A-Timezone"), null);
assert.equal(resolveQuickWorkoutRecordingTimezone(null, null), null);
assert.equal(resolveQuickWorkoutRecordingTimezone(null, "  Europe/Sofia  "), "Europe/Sofia");

// The stored instant is UTC; the recording timezone renders the recording's
// own wall-clock.
const instant = "2026-10-26T05:30:00.000Z";

assert.match(formatTrackRecordingDateTime(instant, "+03:00") ?? "", /08:30/);
assert.match(formatTrackRecordingDateTime(instant, "Europe/Sofia") ?? "", /07:30/);
assert.match(formatTrackRecordingDateTime(instant, null) ?? "", /05:30/);

// The daypart, the slug and the local time read the file's offset, not the
// viewer's device.
const startAt = new Date(instant);

assert.deepEqual(getQuickWorkoutLocalTime(startAt, 180), {
  year: 2026,
  month: 10,
  day: 26,
  hours: 8,
  minutes: 30,
});
assert.equal(getQuickWorkoutDaypart(startAt, 180), "morning");
assert.equal(
  buildQuickWorkoutSlugBase({ activityTypeKey: "walking", startAt, utcOffsetMinutes: 180 }),
  "walking-2026-10-26-0830",
);

// A night recording in Moscow: 00:30 local is the next UTC day.
const nightStart = new Date("2026-10-25T21:30:00.000Z");

assert.equal(getQuickWorkoutDaypart(nightStart, 180), "night");
assert.equal(
  buildQuickWorkoutSlugBase({ activityTypeKey: "walking", startAt: nightStart, utcOffsetMinutes: 180 }),
  "walking-2026-10-26-0030",
);

// A file with no offset falls back to the device's own local time.
assert.equal(getQuickWorkoutDaypart(startAt, null), getQuickWorkoutDaypart(startAt));

console.log("quick workout timezone checks passed");
