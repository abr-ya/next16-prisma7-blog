import assert from "node:assert/strict";

import { buildPhotoExifSummary } from "@/lib/photo-exif-parser";
import type { PhotoExifImageSummary } from "@/lib/photo-exif-metadata";

const baseImage = (): PhotoExifImageSummary => ({
  fileAssetId: "file-1",
  fileKey: "photo.jpg",
  sortOrder: 0,
  capturedAt: null,
  captureTimeTimezoneEvidence: null,
  captureTimeProvenance: null,
  captureTimeNormalization: null,
  width: null,
  height: null,
  orientation: null,
  make: "NIKON CORPORATION",
  model: "NIKON D7000",
  lens: null,
  exposureTime: null,
  fNumber: null,
  focalLength: null,
  gps: null,
});

const cameraLocalImage = baseImage();
cameraLocalImage.captureTimeTimezoneEvidence = "MISSING";
cameraLocalImage.captureTimeProvenance = {
  source: "EXIF_WALL_CLOCK",
  instantUtc: null,
  localWallTime: "2020:11:07 13:07:17",
  timezoneEvidence: "MISSING",
  sourceFileAssetId: cameraLocalImage.fileAssetId,
};

const summary = buildPhotoExifSummary([cameraLocalImage]);

assert.equal(summary.capturedAt, null);
assert.equal(summary.captureTimeTimezoneEvidence, "MISSING");
assert.equal(summary.captureTimeProvenance?.localWallTime, "2020:11:07 13:07:17");

const modifyDateOnlySummary = buildPhotoExifSummary([baseImage()]);

assert.equal(modifyDateOnlySummary.capturedAt, null);
assert.equal(modifyDateOnlySummary.captureTimeProvenance, null);

console.log("photo EXIF capture summary checks passed");
