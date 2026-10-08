// One-off EXIF inspector for ad-hoc photo debugging. Reads standard EXIF tags
// + GPS via the same `exifr` library the production parser uses, then dumps
// the relevant fields for time/timezone debugging. Not part of any build.
//
// Usage: node scripts/dump-exif.mjs "/path/to/photo.jpg"
import { readFileSync } from "node:fs";
import { argv, exit } from "node:process";
import exifr from "exifr";

const path = argv[2];
if (!path) {
  console.error("Usage: node scripts/dump-exif.mjs <file>");
  exit(1);
}

const data = await exifr.parse(readFileSync(path), { gps: true, reviveValues: false });

const out = {
  Make: data?.Make ?? null,
  Model: data?.Model ?? null,
  DateTimeOriginal: data?.DateTimeOriginal ?? null,
  OffsetTime: data?.OffsetTime ?? null,
  OffsetTimeOriginal: data?.OffsetTimeOriginal ?? null,
  OffsetTimeDigitized: data?.OffsetTimeDigitized ?? null,
  GPSDateStamp: data?.GPSDateStamp ?? null,
  GPSTimeStamp: data?.GPSTimeStamp ?? null,
  latitude: data?.latitude ?? null,
  longitude: data?.longitude ?? null,
  GPSAltitude: data?.GPSAltitude ?? null,
};

console.log(JSON.stringify(out, null, 2));
