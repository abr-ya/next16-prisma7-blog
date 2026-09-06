import type { TrackGpxCoordinate, TrackGpxTimedPoint, TrackGpxTimezoneEvidence } from "@/lib/track-gpx-metadata";
import {
  canPersistInsideTrackWithoutManualOverride,
  resolveTrackTimeMatchCoordinate,
  type TrackTimelineLookup,
} from "@/lib/outdoor-photo-track-time-coordinate";

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
  timeline?: TrackGpxTimedPoint[] | null;
  timezoneEvidence?: TrackGpxTimezoneEvidence | null;
};

export type TrackTimeMatchPlacementMethod =
  | "TIMELINE_INTERPOLATION"
  | "ENDPOINT_MIDPOINT"
  | "TRACK_FINISH_ENDPOINT"
  | "PREVIOUS_DAY_FINISH_ENDPOINT"
  | "UNRESOLVED";

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
      placementMethod: TrackTimeMatchPlacementMethod;
      proposedCoordinate: TrackGpxCoordinate | null;
      hasTimedTimeline: boolean;
      timezoneEvidence: TrackGpxTimezoneEvidence | null;
      confidence: "HIGH" | "MEDIUM" | "LOW" | null;
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
      placementMethod: TrackTimeMatchPlacementMethod;
      proposedCoordinate: TrackGpxCoordinate | null;
      hasTimedTimeline: boolean;
      timezoneEvidence: TrackGpxTimezoneEvidence | null;
      confidence: "HIGH" | "MEDIUM" | "LOW" | null;
    }
  | {
      id: string;
      type: "AFTER_TRACK_FINISH";
      trackId: string;
      trackTitle: string;
      trackSlug: string | null;
      capturedAt: string;
      trackEnd: string;
      gapSeconds: number;
      previousDayFinish: boolean;
      windowEndsAt: string | null;
      windowEndTrackTitle: string | null;
      nextTrackId: string | null;
      nextTrackTitle: string | null;
      explanation: string;
      placementMethod: TrackTimeMatchPlacementMethod;
      proposedCoordinate: TrackGpxCoordinate | null;
      hasTimedTimeline: boolean;
      timezoneEvidence: TrackGpxTimezoneEvidence | null;
      confidence: "HIGH" | "MEDIUM" | "LOW" | null;
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

/** Calendar day key from stored absolute timestamps (YYYY-MM-DD of the ISO instant / date prefix). */
const utcDayKey = (iso: string) => {
  const match = /^(\d{4}-\d{2}-\d{2})/.exec(iso);
  if (match) return match[1];

  const ms = Date.parse(iso);
  if (Number.isNaN(ms)) return null;

  return new Date(ms).toISOString().slice(0, 10);
};

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

const createAfterFinishCandidateId = (photoId: string, trackId: string) => `after-finish:${photoId}:${trackId}`;

const toTimelineLookup = (tracks: TrackTimeMatchTrackInput[]): Map<string, TrackTimelineLookup> =>
  new Map(
    tracks.map((track) => [
      track.id,
      {
        id: track.id,
        timeline: track.timeline ?? null,
        startPoint: track.startPoint,
        endPoint: track.endPoint,
        timezoneEvidence: track.timezoneEvidence ?? null,
      },
    ]),
  );

const withResolvedPlacement = (
  candidate: {
    id: string;
    type: "INSIDE_TRACK_WINDOW";
    trackId: string;
    trackTitle: string;
    trackSlug: string | null;
    capturedAt: string;
    trackStart: string;
    trackEnd: string;
    explanation: string;
  },
  tracksById: Map<string, TrackTimelineLookup>,
): TrackTimeMatchCandidate => {
  const track = tracksById.get(candidate.trackId);
  const resolved = resolveTrackTimeMatchCoordinate(
    {
      type: "INSIDE_TRACK_WINDOW",
      trackId: candidate.trackId,
      capturedAt: candidate.capturedAt,
    },
    tracksById,
  );

  return {
    ...candidate,
    placementMethod: resolved?.placementMethod ?? "UNRESOLVED",
    proposedCoordinate: resolved ? { lat: resolved.lat, lng: resolved.lng } : null,
    hasTimedTimeline: Boolean(track?.timeline?.length),
    timezoneEvidence: (track?.timezoneEvidence as TrackGpxTimezoneEvidence | null) ?? null,
    confidence: resolved?.confidence ?? null,
  };
};

const withResolvedBetweenPlacement = (
  candidate: {
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
  },
  tracksById: Map<string, TrackTimelineLookup>,
): TrackTimeMatchCandidate => {
  const resolved = resolveTrackTimeMatchCoordinate(
    {
      type: "BETWEEN_ADJACENT_TRACKS",
      previousTrackId: candidate.previousTrackId,
      nextTrackId: candidate.nextTrackId,
      capturedAt: candidate.capturedAt,
      endpointDistanceMeters: candidate.endpointDistanceMeters,
    },
    tracksById,
  );

  return {
    ...candidate,
    placementMethod: resolved?.placementMethod ?? "UNRESOLVED",
    proposedCoordinate: resolved ? { lat: resolved.lat, lng: resolved.lng } : null,
    hasTimedTimeline: false,
    timezoneEvidence: null,
    confidence: resolved?.confidence ?? null,
  };
};

const withResolvedAfterFinishPlacement = (
  candidate: {
    id: string;
    type: "AFTER_TRACK_FINISH";
    trackId: string;
    trackTitle: string;
    trackSlug: string | null;
    capturedAt: string;
    trackEnd: string;
    gapSeconds: number;
    previousDayFinish: boolean;
    windowEndsAt: string | null;
    windowEndTrackTitle: string | null;
    nextTrackId: string | null;
    nextTrackTitle: string | null;
    explanation: string;
  },
  tracksById: Map<string, TrackTimelineLookup>,
): TrackTimeMatchCandidate => {
  const track = tracksById.get(candidate.trackId);
  const resolved = resolveTrackTimeMatchCoordinate(
    {
      type: "AFTER_TRACK_FINISH",
      trackId: candidate.trackId,
      capturedAt: candidate.capturedAt,
      previousDayFinish: candidate.previousDayFinish,
    },
    tracksById,
  );

  return {
    ...candidate,
    placementMethod: resolved?.placementMethod ?? "UNRESOLVED",
    proposedCoordinate: resolved ? { lat: resolved.lat, lng: resolved.lng } : null,
    hasTimedTimeline: Boolean(track?.timeline?.length),
    timezoneEvidence: (track?.timezoneEvidence as TrackGpxTimezoneEvidence | null) ?? null,
    confidence: resolved?.confidence ?? null,
  };
};

// Stored EXIF and GPX timestamps are compared as parseable absolute times.
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
  const tracksById = toTimelineLookup(tracks);
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

  const insideCandidates = usableTracks
    .filter((track) => capturedAtMs >= track.startMs && capturedAtMs <= track.endMs)
    .map((track) =>
      withResolvedPlacement(
        {
          id: createInsideCandidateId(photo.id, track.id),
          type: "INSIDE_TRACK_WINDOW",
          trackId: track.id,
          trackTitle: track.title,
          trackSlug: track.slug ?? null,
          capturedAt,
          trackStart: track.recordingTime.start,
          trackEnd: track.recordingTime.end,
          explanation: `Captured inside the recording window for ${track.title}.`,
        },
        tracksById,
      ),
    );

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
      withResolvedBetweenPlacement(
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
        tracksById,
      ),
    ];
  });

  // Photos after a track finishes get that track's finish point while the next recording has not
  // started. Same-day gaps stay within maxGapSeconds; previous-calendar-day captures may use the
  // finish until the first track of the capture day starts ("yesterday's finish").
  const afterFinishCandidates = usableTracks.flatMap((track, index): TrackTimeMatchCandidate[] => {
    if (capturedAtMs <= track.endMs) return [];

    const nextTrack = usableTracks[index + 1];
    if (nextTrack && capturedAtMs >= nextTrack.startMs) return [];

    const gapSeconds = Math.round((capturedAtMs - track.endMs) / 1000);
    if (gapSeconds < 0) return [];

    const trackEndDay = utcDayKey(track.recordingTime.end);
    const photoDay = utcDayKey(capturedAt);
    const previousDayFinish = Boolean(trackEndDay && photoDay && photoDay > trackEndDay);

    if (!previousDayFinish && gapSeconds > maxGapSeconds) return [];

    const firstTrackOfPhotoDay =
      previousDayFinish && photoDay
        ? (usableTracks.find(
            (candidateTrack) =>
              candidateTrack.startMs > track.endMs && utcDayKey(candidateTrack.recordingTime.start) === photoDay,
          ) ?? null)
        : null;

    if (firstTrackOfPhotoDay && capturedAtMs >= firstTrackOfPhotoDay.startMs) return [];

    const windowEndTrack = previousDayFinish ? firstTrackOfPhotoDay : nextTrack;
    const windowEndsAt = windowEndTrack?.recordingTime.start ?? null;
    const windowEndTrackTitle = windowEndTrack?.title ?? null;

    const explanation = previousDayFinish
      ? windowEndTrackTitle
        ? `Yesterday's finish: captured after ${track.title} ended on the previous calendar day; use that finish point until ${windowEndTrackTitle} (first track of the capture day) starts.`
        : `Yesterday's finish: captured after ${track.title} ended on the previous calendar day; use that finish point until the first track of the capture day starts (none attached yet).`
      : `Captured ${formatMinutes(gapSeconds)} after ${track.title} finished${
          nextTrack ? ` before ${nextTrack.title} starts` : " with no later attached track started yet"
        }; use the track finish point.`;

    return [
      withResolvedAfterFinishPlacement(
        {
          id: createAfterFinishCandidateId(photo.id, track.id),
          type: "AFTER_TRACK_FINISH",
          trackId: track.id,
          trackTitle: track.title,
          trackSlug: track.slug ?? null,
          capturedAt,
          trackEnd: track.recordingTime.end,
          gapSeconds,
          previousDayFinish,
          windowEndsAt,
          windowEndTrackTitle,
          nextTrackId: nextTrack?.id ?? null,
          nextTrackTitle: nextTrack?.title ?? null,
          explanation,
        },
        tracksById,
      ),
    ];
  });

  return [...insideCandidates, ...betweenCandidates, ...afterFinishCandidates];
};

export { canPersistInsideTrackWithoutManualOverride, resolveTrackTimeMatchCoordinate };
