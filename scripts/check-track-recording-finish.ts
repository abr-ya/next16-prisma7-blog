/**
 * Verifies feature-133's finish helper: the parsed GPX end wins, a MANUAL row
 * derives start + duration, and missing values stay undefined.
 *
 *   npx tsx scripts/check-track-recording-finish.ts
 */
import type { TrackListItem } from "../app/_data/tracks";
import { getEffectiveTrackFinish } from "../lib/track-effective-values";
import { createSuccessfulTrackGpxMetadata } from "../lib/track-gpx-metadata";

const fail = (message: string): never => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

const assert = (condition: boolean, message: string) => {
  if (!condition) fail(message);
  console.log(`✓ ${message}`);
};

const metadata = createSuccessfulTrackGpxMetadata({
  sourceFileAssetId: "file-1",
  sourceFileKey: "key-1",
  summary: {
    distanceMeters: 1000,
    bounds: { north: 1, south: 0, east: 1, west: 0 },
    elevation: null,
    time: {
      start: "2026-03-01T08:00:00.000Z",
      end: "2026-03-01T09:00:00.000Z",
      durationSeconds: 3600,
      timezoneEvidence: "UTC_OR_OFFSET",
    },
    points: { source: 2, simplified: 2 },
  },
  mapGeometry: [
    { lat: 0, lng: 0 },
    { lat: 0, lng: 0.001 },
  ],
  timeline: null,
});

const parsedTrack = {
  recordingStartAt: null,
  recordingDurationSeconds: null,
  recordingTimezone: "UTC",
  fileAsset: { id: "file-1", fileKey: "key-1" },
  route: null,
  metadata,
} as unknown as TrackListItem;

assert(getEffectiveTrackFinish(parsedTrack) === "2026-03-01T09:00:00.000Z", "a parsed GPX end wins");

const manualTrack = {
  recordingStartAt: new Date("2026-03-01T08:00:00.000Z"),
  recordingDurationSeconds: 3600,
  recordingTimezone: "UTC",
  fileAsset: null,
  route: null,
  metadata: null,
} as unknown as TrackListItem;

assert(getEffectiveTrackFinish(manualTrack) === "2026-03-01T09:00:00.000Z", "a MANUAL row derives start + duration");

const missingTrack = {
  recordingStartAt: null,
  recordingDurationSeconds: null,
  recordingTimezone: null,
  fileAsset: null,
  route: null,
  metadata: null,
} as unknown as TrackListItem;

assert(getEffectiveTrackFinish(missingTrack) === undefined, "a row without a start has no finish");

const noDurationTrack = {
  recordingStartAt: new Date("2026-03-01T08:00:00.000Z"),
  recordingDurationSeconds: null,
  recordingTimezone: "UTC",
  fileAsset: null,
  route: null,
  metadata: null,
} as unknown as TrackListItem;

assert(getEffectiveTrackFinish(noDurationTrack) === undefined, "a start without duration has no derived finish");

console.log("All track recording finish assertions passed.");
