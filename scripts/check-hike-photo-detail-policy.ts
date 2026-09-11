import assert from "node:assert/strict";

import {
  canReviewHikePhotoCoordinate,
  canViewHikePhotoDetail,
  getAcceptedHikePhotoCoordinate,
} from "@/lib/hike-photo-detail-policy";

const unrelated = { isAdmin: false, isCreator: false, isPhotoOwner: false, isAcceptedParticipant: false };
assert.equal(canViewHikePhotoDetail(unrelated), false);
assert.equal(canReviewHikePhotoCoordinate({ ...unrelated, isAcceptedParticipant: true }), false);
assert.equal(canReviewHikePhotoCoordinate({ ...unrelated, isPhotoOwner: true }), true);

const approvedInference = {
  lat: 55.75,
  lng: 37.62,
  source: "INFERRED_TRACK_TIME" as const,
  status: "APPROVED" as const,
  confidence: "MEDIUM" as const,
  candidateType: "INSIDE_TRACK_WINDOW" as const,
  candidateId: "candidate",
  trackIds: ["track"],
  placementMethod: "TIMELINE_INTERPOLATION" as const,
  explanation: "Matched to the recorded track timeline.",
  capturedAt: "2026-09-01T10:00:00.000Z",
  reviewedAt: "2026-09-01T11:00:00.000Z",
  reviewedByUserId: "reviewer",
};

assert.deepEqual(getAcceptedHikePhotoCoordinate({ directGps: { lat: 1, lng: 2 }, mapCoordinate: approvedInference }), {
  lat: 1,
  lng: 2,
  source: "DIRECT_EXIF",
  confidence: "HIGH",
  placementMethod: "DIRECT_EXIF",
  explanation: null,
});
assert.equal(
  getAcceptedHikePhotoCoordinate({
    directGps: null,
    mapCoordinate: { ...approvedInference, status: "PENDING_REVIEW" },
  }),
  null,
);
assert.equal(
  getAcceptedHikePhotoCoordinate({ directGps: null, mapCoordinate: approvedInference })?.source,
  "INFERRED_TRACK_TIME",
);

console.log("Hike photo-detail policy checks passed.");
