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

/**
 * feature-133: the finish shown next to the effective start. A parsed GPX end
 * wins; a MANUAL row derives its finish from the confirmed start + duration.
 */
export const getEffectiveTrackFinish = (track: TrackListItem): string | undefined => {
  const state = getTrackParseState(track);

  if (state?.status === "SUCCESS" && state.summary.time?.end) return state.summary.time.end;

  const start = getEffectiveTrackStart(track);
  const duration = getEffectiveTrackDurationSeconds(track);

  if (!start || typeof duration !== "number" || duration <= 0) return undefined;

  const startTime = Date.parse(start);

  if (!Number.isFinite(startTime)) return undefined;

  return new Date(startTime + duration * 1000).toISOString();
};
