/**
 * Verifies feature-138's GPX point cleanup helpers: full-list parsing with
 * element spans, speed derivation, range and click expansion, and the XML
 * splice that must preserve elevation, time, and vendor extensions.
 *
 *   npx tsx scripts/check-track-point-removal.ts
 */
import { validateGpxString } from "../lib/gpx-validation";
import {
  buildEditedTrackGpxFileName,
  buildRemovalMask,
  buildTrackPointEditorView,
  estimateDistanceAfterCleanup,
  isPointWithinCleanupWindow,
  removePointsFromGpx,
} from "../lib/track-gpx-edit";
import { parseGpxEditablePoints } from "../lib/track-gpx-parser";

const fail = (message: string): never => {
  console.error(`✗ ${message}`);
  process.exit(1);
};

const assert = (condition: boolean, message: string) => {
  if (!condition) fail(message);
  console.log(`✓ ${message}`);
};

const points = [
  { lat: 0, lng: 0, ele: 100, time: "2026-01-01T00:00:00Z" },
  { lat: 0, lng: 0.00005, ele: 101, time: "2026-01-01T00:00:10Z" },
  { lat: 0, lng: 0.0001, ele: 102, time: "2026-01-01T00:00:20Z" },
  { lat: 0, lng: 0.00015, ele: 103, time: "2026-01-01T00:00:30Z" },
  { lat: 0, lng: 0.0002, ele: 104, time: "2026-01-01T00:00:40Z" },
];

const pointXml = points
  .map(
    (point, index) =>
      `  <trkpt lat="${point.lat}" lon="${point.lng}">\n    <ele>${point.ele}</ele>\n    <time>${point.time}</time>${
        index === 0 ? "\n    <extensions><vendor>kept</vendor></extensions>" : ""
      }\n  </trkpt>`,
  )
  .join("\n");

const gpx = `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="test" xmlns="http://www.topografix.com/GPX/1/1">
 <trk>
  <name>Fixture</name>
  <trkseg>
${pointXml}
  </trkseg>
 </trk>
</gpx>`;

const parsed = parseGpxEditablePoints(gpx);
assert(parsed.length === 5, "parses all five full points");
assert(parsed[0]!.index === 0 && parsed[4]!.index === 4, "keeps original full-list indices");
assert(
  parsed.every((point) => point.start < point.end),
  "records an XML span for every point",
);

const view = buildTrackPointEditorView(parsed);
assert(view.hasTimeline, "detects the timestamped track");
assert(view.points.length === 5, "returns every point when below the payload cap");
assert(
  typeof view.points[1]!.speedMps === "number" && view.points[1]!.speedMps! > 0,
  "derives speed from distance and time",
);

const longTrack = Array.from({ length: 4000 }, (_, index) => ({
  index,
  start: index * 10,
  end: index * 10 + 8,
  lat: index === 1233 ? 0.05 : 0,
  lng: index * 0.00001,
  time: new Date(Date.UTC(2026, 0, 1, 0, 0, index * 10)).toISOString(),
}));
const longView = buildTrackPointEditorView(longTrack);
assert(longView.points.length < 4000, "samples a long track instead of sending every point");
assert(
  longView.points.some((point) => point.index === 1233),
  "always includes a lone outlier that uniform sampling would skip",
);
assert(
  !longView.points.some((point) => point.index === 1237),
  "still skips ordinary points between the uniform samples",
);

const rangeMask =
  buildRemovalMask(parsed, { ranges: [{ startIndex: 1, endIndex: 2 }], clickedIndices: [] }) ??
  fail("range selection produced no mask");
assert(rangeMask.removedCount === 2, "range removes exactly its two points");

const clickMask =
  buildRemovalMask(parsed, { ranges: [], clickedIndices: [1] }) ?? fail("click selection produced no mask");
assert(clickMask.removedCount === 3, "one click expands to the nearby, time-close points");
assert(isPointWithinCleanupWindow(points[0]!, points[1]!), "radius/time window accepts a neighbour");
assert(
  !isPointWithinCleanupWindow({ ...points[0]!, time: "2026-01-01T00:01:00Z" }, points[1]!),
  "time window rejects a distant timestamp",
);

const rewritten = removePointsFromGpx(gpx, parsed, rangeMask.mask);
const remaining = parseGpxEditablePoints(rewritten);
assert(remaining.length === 3, "rewritten GPX keeps the three unselected points");
assert(
  rewritten.includes("<ele>100</ele>") && rewritten.includes("<ele>104</ele>"),
  "rewrite preserves elevation of kept points",
);
assert(rewritten.includes("<vendor>kept</vendor>"), "rewrite preserves vendor extensions");
assert(rewritten.includes("<name>Fixture</name>"), "rewrite preserves unrelated GPX content");
assert(validateGpxString(rewritten).ok, "rewritten GPX still validates");

const middleRemoved = estimateDistanceAfterCleanup(view, {
  ranges: [{ startIndex: 1, endIndex: 2 }],
  clickedIndices: [],
});
assert(
  Math.abs(middleRemoved - view.distanceMeters) < 0.01,
  "removing collinear middle points keeps the estimated distance",
);

const startRemoved = estimateDistanceAfterCleanup(view, {
  ranges: [{ startIndex: 0, endIndex: 1 }],
  clickedIndices: [],
});
assert(
  Math.abs(view.distanceMeters - startRemoved - view.points[2]!.distanceFromStartMeters) < 0.01,
  "removing the leading span subtracts its cumulative distance",
);

const editedAt = new Date("2026-11-06T12:00:00Z");
assert(
  buildEditedTrackGpxFileName("Morning run.gpx", editedAt) === "Morning run (2026-11-06_120000).gpx",
  "keeps the original name and adds the edit timestamp",
);
assert(
  buildEditedTrackGpxFileName("Morning run (2026-11-01).gpx", editedAt) === "Morning run (2026-11-06_120000).gpx",
  "replaces a previous date-only suffix instead of chaining it",
);
assert(
  buildEditedTrackGpxFileName("2026-10-01 run.gpx", editedAt) === "2026-10-01 run (2026-11-06_120000).gpx",
  "keeps a date that belongs to the original name",
);
assert(
  buildEditedTrackGpxFileName("run", editedAt) === "run (2026-11-06_120000).gpx",
  "adds a gpx extension when the original name has none",
);
assert(
  buildEditedTrackGpxFileName("Morning run (2026-11-01_101010).gpx", editedAt) ===
    "Morning run (2026-11-06_120000).gpx",
  "replaces a previous edit timestamp instead of chaining it",
);
assert(
  buildEditedTrackGpxFileName("run.gpx", new Date("2026-11-06T22:30:05Z"), "Europe/Moscow") ===
    "run (2026-11-07_013005).gpx",
  "formats the edit timestamp in the recording timezone",
);

const validation = validateGpxString(removePointsFromGpx(gpx, parsed, new Array(5).fill(true)));
assert(!validation.ok, "removing every point fails GPX validation");

console.log("All track point removal assertions passed.");
