import assert from "node:assert/strict";

import { proposeTrackTimeMatchCandidates } from "@/lib/outdoor-photo-track-time-matching";
import { parseTrackGpxMetadata } from "@/lib/track-gpx-parser";
import { formatTrackRecordingDateTime } from "@/lib/track-gpx-metadata";
import { normalizeTrackRecordingTimezone, requireTrackRecordingTimezone } from "@/lib/track-recording-timezone";

const sourceTime = "2016-11-10T10:35:42Z";
const normalizedSourceTime = "2016-11-10T10:35:42.000Z";

assert.equal(normalizeTrackRecordingTimezone("Europe/Sofia"), "Europe/Sofia");
assert.equal(normalizeTrackRecordingTimezone("Not/A-Timezone"), null);
assert.throws(() => requireTrackRecordingTimezone("Not/A-Timezone"), /Recording timezone is invalid/);
assert.match(formatTrackRecordingDateTime(sourceTime, "Europe/Sofia") ?? "", /12:35/);

const parsed = parseTrackGpxMetadata({
  content: `<gpx><trk><trkseg><trkpt lat="42.6169008" lon="23.3485775"><time>${sourceTime}</time></trkpt></trkseg></trk></gpx>`,
  sourceFileAssetId: "track-file",
  sourceFileKey: "track-file.gpx",
});

assert.equal(parsed.summary?.time?.start, normalizedSourceTime);
assert.equal(parsed.timeline?.[0]?.time, normalizedSourceTime);

const candidates = proposeTrackTimeMatchCandidates(
  { id: "photo", title: "Photo", capturedAt: sourceTime, hasDirectGps: false },
  [
    {
      id: "track",
      title: "Track",
      recordingTime: { start: sourceTime, end: sourceTime },
      startPoint: { lat: 42.6169008, lng: 23.3485775 },
      endPoint: { lat: 42.6169008, lng: 23.3485775 },
      timeline: [{ lat: 42.6169008, lng: 23.3485775, time: sourceTime }],
    },
  ],
);

assert.equal(candidates[0]?.type, "INSIDE_TRACK_WINDOW");

console.log("track recording timezone checks passed");
