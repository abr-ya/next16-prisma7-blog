/**
 * Asserts the parse freshness rules: a pre-marker parse is outdated, a current
 * one is fresh, an old row missing a capability is outdated, an unknown extra
 * capability is tolerated, missing/failed/stale states are outdated, a file
 * without timestamps is not outdated once parsed, and only an owned GPX track
 * with its own file and no route may be updated. Run with:
 *
 *   npx tsx scripts/check-track-parse-capabilities.ts
 */
import {
  canUpdateTrackParse,
  createSuccessfulTrackGpxMetadata,
  getMissingTrackParseCapabilities,
  isTrackParseOutdated,
  TRACK_GPX_PARSER_CAPABILITIES,
  type TrackGpxMetadataState,
} from "../lib/track-gpx-metadata";

let failures = 0;

const expect = (label: string, actual: unknown, expected: unknown) => {
  if (actual === expected) {
    console.log(`✓ ${label}`);
    return;
  }

  failures += 1;
  console.error(`✗ ${label}: actual=${String(actual)} expected=${String(expected)}`);
};

const summary = {
  distanceMeters: 1000,
  bounds: { north: 1, south: 0, east: 1, west: 0 },
  elevation: null,
  time: {
    start: "2026-01-01T08:00:00.000Z",
    end: "2026-01-01T08:10:00.000Z",
    durationSeconds: 600,
    timezoneEvidence: "UTC_OR_OFFSET" as const,
  },
  points: { source: 10, simplified: 10 },
};

const baseMetadata = () =>
  createSuccessfulTrackGpxMetadata({
    sourceFileAssetId: "file-1",
    sourceFileKey: "key-1",
    summary,
    mapGeometry: [
      { lat: 0, lng: 0 },
      { lat: 1, lng: 1 },
    ],
    timeline: null,
  });

const successState = (capabilities?: string[]): TrackGpxMetadataState => {
  const metadata = baseMetadata();

  if (capabilities === undefined) {
    delete metadata.gpxParse.parserCapabilities;
  } else {
    metadata.gpxParse.parserCapabilities = capabilities;
  }

  return { status: "SUCCESS", metadata, summary, mapGeometry: [{ lat: 0, lng: 0 }], timeline: null };
};

const noTimeState = (): TrackGpxMetadataState => {
  const metadata = createSuccessfulTrackGpxMetadata({
    sourceFileAssetId: "file-1",
    sourceFileKey: "key-1",
    summary: { ...summary, time: null },
    mapGeometry: [{ lat: 0, lng: 0 }],
    timeline: null,
  });

  return {
    status: "SUCCESS",
    metadata,
    summary: { ...summary, time: null },
    mapGeometry: [{ lat: 0, lng: 0 }],
    timeline: null,
  };
};

// Marker rules
expect("a pre-marker parse is outdated", isTrackParseOutdated(successState()), true);
expect(
  "a complete capability set is fresh",
  isTrackParseOutdated(successState([...TRACK_GPX_PARSER_CAPABILITIES])),
  false,
);
expect(
  "a missing capability is outdated",
  isTrackParseOutdated(successState(TRACK_GPX_PARSER_CAPABILITIES.filter((capability) => capability !== "movingTime"))),
  true,
);
expect(
  "an unknown extra capability is tolerated",
  isTrackParseOutdated(successState([...TRACK_GPX_PARSER_CAPABILITIES, "futureThing"])),
  false,
);
expect("a file without timestamps is fresh", isTrackParseOutdated(noTimeState()), false);
expect(
  "the time capability without a value is fresh",
  getMissingTrackParseCapabilities([...TRACK_GPX_PARSER_CAPABILITIES]).length,
  0,
);

// Non-success states are outdated
expect(
  "a failed parse is outdated",
  isTrackParseOutdated({ status: "FAILED", metadata: baseMetadata(), errorMessage: "bad" }),
  true,
);
expect(
  "a stale parse is outdated",
  isTrackParseOutdated({ status: "STALE", metadata: baseMetadata(), errorMessage: null }),
  true,
);
expect("a missing parse is outdated", isTrackParseOutdated({ status: "MISSING", metadata: null }), true);

// Update eligibility
expect(
  "an owned GPX track with its own file can be updated",
  canUpdateTrackParse({ timeSource: "GPX", routeId: null, hasOwnActiveTrackGpxFile: true }),
  true,
);
expect(
  "a manual track cannot be updated",
  canUpdateTrackParse({ timeSource: "MANUAL", routeId: null, hasOwnActiveTrackGpxFile: true }),
  false,
);
expect(
  "a route-primary track cannot be updated",
  canUpdateTrackParse({ timeSource: "GPX", routeId: "route-1", hasOwnActiveTrackGpxFile: true }),
  false,
);
expect(
  "a track without its own file cannot be updated",
  canUpdateTrackParse({ timeSource: "GPX", routeId: null, hasOwnActiveTrackGpxFile: false }),
  false,
);
expect(
  "an old parse misses every current capability",
  getMissingTrackParseCapabilities(undefined).length,
  TRACK_GPX_PARSER_CAPABILITIES.length,
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}

console.log("\nAll parse-capability checks passed");
