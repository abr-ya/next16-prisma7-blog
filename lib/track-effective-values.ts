import type { TrackListItem } from "@/app/_data/tracks";
import { resolveTrackGeometry } from "@/lib/track-geometry";
import { getTrackGpxMetadataState } from "@/lib/track-gpx-metadata";

/**
 * feature-135: the effective start, distance and duration the workout table
 * shows. The table cells, their sort accessors and the week summary all read
 * through these helpers so the visible row and the summed week cannot drift
 * apart. The fallback chains are the ones feature-131 introduced: recording
 * mirror first, parsed GPX summary second.
 */
const getTrackParseState = (track: TrackListItem) => {
  const geometry = resolveTrackGeometry(track);
  if (!geometry) return null;

  return getTrackGpxMetadataState(geometry.metadata, {
    fileAssetId: geometry.fileAsset.id,
    fileKey: geometry.fileAsset.fileKey,
  });
};

export const getEffectiveTrackStart = (track: TrackListItem): string | undefined => {
  if (track.recordingStartAt) return track.recordingStartAt.toISOString();

  const state = getTrackParseState(track);

  return state?.status === "SUCCESS" ? (state.summary.time?.start ?? undefined) : undefined;
};

export const getEffectiveTrackDistanceMeters = (track: TrackListItem): number | undefined => {
  const state = getTrackParseState(track);

  return state?.status === "SUCCESS" ? state.summary.distanceMeters : undefined;
};

export const getEffectiveTrackDurationSeconds = (track: TrackListItem): number | undefined => {
  if (typeof track.recordingDurationSeconds === "number") return track.recordingDurationSeconds;

  const state = getTrackParseState(track);

  return state?.status === "SUCCESS" ? (state.summary.time?.durationSeconds ?? undefined) : undefined;
};
