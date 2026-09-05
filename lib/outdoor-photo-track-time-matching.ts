import type { TrackGpxCoordinate } from "@/lib/track-gpx-metadata";

export const DEFAULT_TRACK_TIME_MATCH_MAX_GAP_SECONDS = 90 * 60;
export const DEFAULT_TRACK_TIME_MATCH_ENDPOINT_NEARNESS_METERS = 250;

export type TrackTimeMatchPhotoInput = {
  id: string;
  title: string;
  capturedAt: string | null;
  hasDirectGps: boolean;
};

export type TrackTimeMatchTrackInput = {
  id: string;
  title: string;
  slug?: string | null;
  recordingTime: {
    start: string;
    end: string;
  } | null;
  startPoint: TrackGpxCoordinate | null;
  endPoint: TrackGpxCoordinate | null;
};

export type TrackTimeMatchCandidate =
  | {
      id: string;
      type: "INSIDE_TRACK_WINDOW";
      trackId: string;
      trackTitle: string;
      trackSlug: string | null;
      capturedAt: string;
      trackStart: string;
      trackEnd: string;
      explanation: string;
    }
  | {
      id: string;
      type: "BETWEEN_ADJACENT_TRACKS";
      previousTrackId: string;
      previousTrackTitle: string;
      previousTrackSlug: string | null;
      nextTrackId: string;
      nextTrackTitle: string;
      nextTrackSlug: string | null;
      capturedAt: string;
      previousTrackEnd: string;
      nextTrackStart: string;
      gapSeconds: number;
      endpointDistanceMeters: number | null;
      explanation: string;
    };

export type ProposeTrackTimeMatchCandidatesOptions = {
  maxGapSeconds?: number;
  endpointNearnessMeters?: number;
};

const parseTimestamp = (value: string | null) => {
  if (!value) return null;

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
};

const formatMinutes = (seconds: number) => `${Math.round(seconds / 60)} min`;

const distanceMeters = (from: TrackGpxCoordinate, to: TrackGpxCoordinate) => {
  const earthRadiusMeters = 6371000;
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a = Math.sin(deltaLat / 2) ** 2 + Math.cos(fromLat) * Math.cos(toLat) * Math.sin(deltaLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadiusMeters * c;
};

const createInsideCandidateId = (photoId: string, trackId: string) => `inside:${photoId}:${trackId}`;

const createBetweenCandidateId = (photoId: string, previousTrackId: string, nextTrackId: string) =>
  `between:${photoId}:${previousTrackId}:${nextTrackId}`;

// Spike assumption: stored EXIF and GPX timestamps are compared as parseable absolute times.
// Photos with timezone-free or invalid timestamps stay candidate-free until a later policy is accepted.
export const proposeTrackTimeMatchCandidates = (
  photo: TrackTimeMatchPhotoInput,
  tracks: TrackTimeMatchTrackInput[],
  options: ProposeTrackTimeMatchCandidatesOptions = {},
): TrackTimeMatchCandidate[] => {
  const capturedAtMs = parseTimestamp(photo.capturedAt);

  if (photo.hasDirectGps || !photo.capturedAt || capturedAtMs === null) return [];

  const capturedAt = photo.capturedAt;
  const maxGapSeconds = options.maxGapSeconds ?? DEFAULT_TRACK_TIME_MATCH_MAX_GAP_SECONDS;
  const endpointNearnessMeters = options.endpointNearnessMeters ?? DEFAULT_TRACK_TIME_MATCH_ENDPOINT_NEARNESS_METERS;
  const usableTracks = tracks
    .map((track) => {
      const startMs = parseTimestamp(track.recordingTime?.start ?? null);
      const endMs = parseTimestamp(track.recordingTime?.end ?? null);

      if (!track.recordingTime || startMs === null || endMs === null || endMs < startMs) return null;

      return {
        ...track,
        recordingTime: track.recordingTime,
        startMs,
        endMs,
      };
    })
    .filter((track) => track !== null)
    .sort((a, b) => a.startMs - b.startMs);

  const insideCandidates: TrackTimeMatchCandidate[] = usableTracks
    .filter((track) => capturedAtMs >= track.startMs && capturedAtMs <= track.endMs)
    .map((track) => ({
      id: createInsideCandidateId(photo.id, track.id),
      type: "INSIDE_TRACK_WINDOW",
      trackId: track.id,
      trackTitle: track.title,
      trackSlug: track.slug ?? null,
      capturedAt,
      trackStart: track.recordingTime.start,
      trackEnd: track.recordingTime.end,
      explanation: `Captured inside the recording window for ${track.title}.`,
    }));

  const betweenCandidates = usableTracks.flatMap((previousTrack, index): TrackTimeMatchCandidate[] => {
    const nextTrack = usableTracks[index + 1];

    if (!nextTrack || capturedAtMs <= previousTrack.endMs || capturedAtMs >= nextTrack.startMs) return [];

    const gapSeconds = Math.round((nextTrack.startMs - previousTrack.endMs) / 1000);
    if (gapSeconds < 0 || gapSeconds > maxGapSeconds) return [];

    const endpointDistanceMeters =
      previousTrack.endPoint && nextTrack.startPoint
        ? distanceMeters(previousTrack.endPoint, nextTrack.startPoint)
        : null;

    if (endpointDistanceMeters !== null && endpointDistanceMeters > endpointNearnessMeters) return [];

    const distanceCopy =
      endpointDistanceMeters === null
        ? "without endpoint distance data"
        : `endpoints are ${Math.round(endpointDistanceMeters)} m apart`;

    return [
      {
        id: createBetweenCandidateId(photo.id, previousTrack.id, nextTrack.id),
        type: "BETWEEN_ADJACENT_TRACKS",
        previousTrackId: previousTrack.id,
        previousTrackTitle: previousTrack.title,
        previousTrackSlug: previousTrack.slug ?? null,
        nextTrackId: nextTrack.id,
        nextTrackTitle: nextTrack.title,
        nextTrackSlug: nextTrack.slug ?? null,
        capturedAt,
        previousTrackEnd: previousTrack.recordingTime.end,
        nextTrackStart: nextTrack.recordingTime.start,
        gapSeconds,
        endpointDistanceMeters: endpointDistanceMeters === null ? null : Math.round(endpointDistanceMeters),
        explanation: `Captured between ${previousTrack.title} and ${nextTrack.title}; gap is ${formatMinutes(gapSeconds)} and ${distanceCopy}.`,
      },
    ];
  });

  return [...insideCandidates, ...betweenCandidates];
};
