import type { Prisma } from "@/generated/prisma/client";

/**
 * feature-127: a track keeps exactly one geometry source — its own GPX file
 * and parsed metadata, or the ones its linked route owns. The database
 * enforces that with `Track_geometry_source_check`, so `null` here means the
 * row was written outside the application contract and callers should treat
 * it as a missing track rather than crash.
 */
export type TrackGeometrySource<TFile extends { id: string }> = {
  fileAsset: TFile | null;
  metadata: Prisma.JsonValue | null;
  route?: { fileAsset: TFile | null; metadata: Prisma.JsonValue | null } | null;
};

export type ResolvedTrackGeometry<TFile extends { id: string }> = {
  fileAsset: TFile;
  metadata: Prisma.JsonValue | null;
};

export const resolveTrackGeometry = <TFile extends { id: string }>(
  track: TrackGeometrySource<TFile>,
): ResolvedTrackGeometry<TFile> | null => {
  if (track.fileAsset) {
    return { fileAsset: track.fileAsset, metadata: track.metadata };
  }

  if (track.route?.fileAsset) {
    return { fileAsset: track.route.fileAsset, metadata: track.route.metadata };
  }

  return null;
};
