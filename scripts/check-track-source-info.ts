/**
 * Asserts the GPX source extraction and its labels: creator quoting and
 * entities, namespaced and plain device elements, missing and empty values,
 * the 120-character cap, source details on a failed parse, and the badge and
 * legend precedence. Run with:
 *
 *   npx tsx scripts/check-track-source-info.ts
 */
import {
  getTrackLegendLabel,
  getTrackSourceBadgeLabel,
  TRACK_GPX_PARSER_CAPABILITIES,
} from "../lib/track-gpx-metadata";
import { parseTrackGpxMetadata } from "../lib/track-gpx-parser";

let failures = 0;

const expect = (label: string, actual: unknown, expected: unknown) => {
  if (actual === expected) {
    console.log(`✓ ${label}`);
    return;
  }

  failures += 1;
  console.error(`✗ ${label}: actual=${JSON.stringify(actual)} expected=${JSON.stringify(expected)}`);
};

const gpx = ({ creator = "", extension = "", points = true }: { creator?: string; extension?: string; points?: boolean }) => `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator${creator ? `="${creator}"` : '=""'} xmlns="http://www.topografix.com/GPX/1/1" xmlns:gpxx="http://www.garmin.com/xmlschemas/GpxExtensions/v3">
  <metadata><extensions>${extension}</extensions></metadata>
  <trk><trkseg>
    ${points ? '<trkpt lat="0" lon="0"/><trkpt lat="0.001" lon="0.001"/>' : ""}
  </trkseg></trk>
</gpx>`;

const parse = (content: string) =>
  parseTrackGpxMetadata({ content, sourceFileAssetId: "file-1", sourceFileKey: "key-1" });

// Creator
{
  const metadata = parse(gpx({ creator: "Garmin Connect" }));
  expect("double-quoted creator is the app", metadata.sourceInfo?.recordingApp, "Garmin Connect");
  expect("no device element means no device", metadata.sourceInfo?.deviceName, null);
}
{
  const content = gpx({ creator: "" }).replace('creator=""', "creator='OsmAnd'");
  expect("single-quoted creator is the app", parse(content).sourceInfo?.recordingApp, "OsmAnd");
}
{
  const metadata = parse(gpx({ creator: "Garmin &amp; Co" }));
  expect("creator entities are decoded", metadata.sourceInfo?.recordingApp, "Garmin & Co");
}
{
  const metadata = parse(gpx({ creator: "" }));
  expect("an empty creator is absent", metadata.sourceInfo?.recordingApp, null);
  expect("an empty source still writes the object", typeof metadata.sourceInfo, "object");
}

// Device
{
  const metadata = parse(
    gpx({ creator: "Garmin Connect", extension: "<gpxx:DeviceName>Forerunner 965</gpxx:DeviceName>" }),
  );
  expect("a namespaced DeviceName is the device", metadata.sourceInfo?.deviceName, "Forerunner 965");
}
{
  const metadata = parse(gpx({ creator: "OsmAnd", extension: "<device>Pixel 8</device>" }));
  expect("a plain device element is the device", metadata.sourceInfo?.deviceName, "Pixel 8");
}
{
  const longName = "D".repeat(140);
  const metadata = parse(gpx({ creator: "App", extension: `<device>${longName}</device>` }));
  expect("a device name is capped at 120", metadata.sourceInfo?.deviceName?.length, 120);
}

// Capability and failure
expect(
  "the parser advertises sourceInfo",
  TRACK_GPX_PARSER_CAPABILITIES.includes("sourceInfo" as never),
  true,
);
{
  const metadata = parse(gpx({ creator: "Garmin Connect", points: false }));
  expect("a failed parse still records the app", metadata.gpxParse.status, "FAILED");
  expect("a failed parse keeps the source", metadata.sourceInfo?.recordingApp, "Garmin Connect");
}

// Labels
const deviceInfo = { recordingApp: "Garmin Connect", deviceName: "Forerunner 965" };
const appOnly = { recordingApp: "OsmAnd", deviceName: null };
expect("badge prefers the device", getTrackSourceBadgeLabel({ sourceInfo: deviceInfo, timeSource: "GPX" }), "Forerunner 965");
expect("badge falls back to the app", getTrackSourceBadgeLabel({ sourceInfo: appOnly, timeSource: "GPX" }), "OsmAnd");
expect("a manual workout has no extra badge", getTrackSourceBadgeLabel({ sourceInfo: deviceInfo, timeSource: "MANUAL" }), null);
expect(
  "a manual primary legend reads Manual route",
  getTrackLegendLabel({ sourceInfo: deviceInfo, timeSource: "MANUAL", isRoute: false }),
  "Manual route",
);
expect(
  "a route primary legend reads Manual route",
  getTrackLegendLabel({ sourceInfo: deviceInfo, timeSource: "GPX", isRoute: true }),
  "Manual route",
);
expect(
  "a device legend reads the device",
  getTrackLegendLabel({ sourceInfo: deviceInfo, timeSource: "GPX", isRoute: false }),
  "Forerunner 965",
);
expect(
  "an unknown source falls back to the title",
  getTrackLegendLabel({ sourceInfo: null, timeSource: "GPX", isRoute: false }),
  null,
);

if (failures > 0) {
  console.error(`\n${failures} check(s) failed`);
  process.exit(1);
}

console.log("\nAll track-source checks passed");
