import assert from "node:assert/strict";

import { proposeTrackTimeMatchCandidates } from "@/lib/outdoor-photo-track-time-matching";
import { parseTrackGpxMetadata } from "@/lib/track-gpx-parser";
import { formatTrackRecordingDateTime } from "@/lib/track-gpx-metadata";
import { normalizeTrackRecordingTimezone, requireTrackRecordingTimezone } from "@/lib/track-recording-timezone";
import { formatPhotoCaptureTimeContext } from "@/lib/photo-exif-metadata";

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

const photoCapturedAt = "2016-11-11T08:00:00Z";
const sofiaCandidate = proposeTrackTimeMatchCandidates(
  { id: "photo-next-day", title: "Photo", capturedAt: photoCapturedAt, hasDirectGps: false },
  [
    {
      id: "sofia-track",
      title: "Sofia track",
      recordingTime: { start: "2016-11-10T09:35:42Z", end: "2016-11-10T10:35:42Z" },
      startPoint: { lat: 42.6169008, lng: 23.3485775 },
      endPoint: { lat: 42.6169008, lng: 23.3485775 },
      recordingTimezone: "Europe/Sofia",
    },
  ],
)[0];
const legacyCandidate = proposeTrackTimeMatchCandidates(
  { id: "photo-next-day", title: "Photo", capturedAt: photoCapturedAt, hasDirectGps: false },
  [
    {
      id: "sofia-track",
      title: "Sofia track",
      recordingTime: { start: "2016-11-10T09:35:42Z", end: "2016-11-10T10:35:42Z" },
      startPoint: { lat: 42.6169008, lng: 23.3485775 },
      endPoint: { lat: 42.6169008, lng: 23.3485775 },
    },
  ],
)[0];

assert.equal(sofiaCandidate?.type, "AFTER_TRACK_FINISH");
assert.equal(sofiaCandidate?.previousDayFinish, true);
assert.equal(sofiaCandidate?.placementMethod, legacyCandidate?.placementMethod);
assert.equal(sofiaCandidate?.recordingTimezone, "Europe/Sofia");
assert.match(formatTrackRecordingDateTime(sofiaCandidate?.trackEnd, sofiaCandidate?.recordingTimezone) ?? "", /12:35/);
const photoTimeContext = formatPhotoCaptureTimeContext({
  capturedAt: photoCapturedAt,
  timezoneEvidence: "UTC_OR_OFFSET",
});
assert.match(photoTimeContext?.storedUtc ?? "", /08:00.*UTC/);
assert.equal(photoTimeContext?.timezoneEvidence, "EXIF UTC/offset");

console.log("track recording timezone checks passed");
