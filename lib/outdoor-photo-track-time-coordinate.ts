import type { PhotoMapCoordinatePlacementMethod } from "@/lib/photo-exif-metadata";
import type { TrackGpxCoordinate, TrackGpxTimedPoint } from "@/lib/track-gpx-metadata";

export type ResolvedTrackTimeCoordinate = {
  lat: number;
  lng: number;
  placementMethod: Exclude<PhotoMapCoordinatePlacementMethod, "UNRESOLVED" | "MANUAL_OVERRIDE">;
  confidence: "HIGH" | "MEDIUM" | "LOW";
};

export type ResolveTrackTimeCandidateInput =
  | {
      type: "INSIDE_TRACK_WINDOW";
      trackId: string;
      capturedAt: string;
    }
  | {
      type: "BETWEEN_ADJACENT_TRACKS";
      previousTrackId: string;
      nextTrackId: string;
      capturedAt: string;
      endpointDistanceMeters: number | null;
    }
  | {
      type: "AFTER_TRACK_FINISH";
      trackId: string;
      capturedAt: string;
      previousDayFinish?: boolean;
    };

const parseTimestamp = (value: string | null | undefined) => {
  if (!value) return null;

  const timestamp = Date.parse(value);

  return Number.isNaN(timestamp) ? null : timestamp;
};

export const interpolateAlongTrackTimeline = (
  timeline: TrackGpxTimedPoint[] | null | undefined,
  capturedAt: string,
): TrackGpxCoordinate | null => {
  if (!timeline || timeline.length === 0) return null;

  const capturedAtMs = parseTimestamp(capturedAt);
  if (capturedAtMs === null) return null;

  const points = timeline
    .map((point) => ({
      ...point,
      ms: parseTimestamp(point.time),
    }))
    .filter((point): point is TrackGpxTimedPoint & { ms: number } => point.ms !== null)
    .sort((a, b) => a.ms - b.ms);

  if (points.length === 0) return null;

  if (capturedAtMs <= points[0].ms) {
    return { lat: points[0].lat, lng: points[0].lng };
  }

  const last = points[points.length - 1];

  if (capturedAtMs >= last.ms) {
    return { lat: last.lat, lng: last.lng };
  }

  for (let index = 0; index < points.length - 1; index += 1) {
    const start = points[index];
    const end = points[index + 1];

    if (capturedAtMs < start.ms || capturedAtMs > end.ms) continue;

    if (end.ms === start.ms) {
      return { lat: start.lat, lng: start.lng };
    }

    const ratio = (capturedAtMs - start.ms) / (end.ms - start.ms);

    return {
      lat: start.lat + (end.lat - start.lat) * ratio,
      lng: start.lng + (end.lng - start.lng) * ratio,
    };
  }

  return null;
};

export const midpointCoordinate = (
  from: TrackGpxCoordinate | null | undefined,
  to: TrackGpxCoordinate | null | undefined,
): TrackGpxCoordinate | null => {
  if (!from || !to) return null;

  return {
    lat: (from.lat + to.lat) / 2,
    lng: (from.lng + to.lng) / 2,
  };
};

export type TrackTimelineLookup = {
  id: string;
  timeline: TrackGpxTimedPoint[] | null;
  startPoint: TrackGpxCoordinate | null;
  endPoint: TrackGpxCoordinate | null;
  timezoneEvidence?: string | null;
};

export const resolveTrackTimeMatchCoordinate = (
  candidate: ResolveTrackTimeCandidateInput,
  tracksById: Map<string, TrackTimelineLookup>,
): ResolvedTrackTimeCoordinate | null => {
  if (candidate.type === "INSIDE_TRACK_WINDOW") {
    const track = tracksById.get(candidate.trackId);
    const coordinate = interpolateAlongTrackTimeline(track?.timeline, candidate.capturedAt);

    if (!coordinate) return null;

    const timezoneEvidence = track?.timezoneEvidence;
    const confidence =
      timezoneEvidence === "UTC_OR_OFFSET" ? "HIGH" : timezoneEvidence === "MIXED" ? "MEDIUM" : "MEDIUM";

    return {
      ...coordinate,
      placementMethod: "TIMELINE_INTERPOLATION",
      confidence,
    };
  }

  if (candidate.type === "AFTER_TRACK_FINISH") {
    const track = tracksById.get(candidate.trackId);
    const coordinate = track?.endPoint ?? null;

    if (!coordinate) return null;

    return {
      ...coordinate,
      placementMethod: candidate.previousDayFinish ? "PREVIOUS_DAY_FINISH_ENDPOINT" : "TRACK_FINISH_ENDPOINT",
      confidence: "MEDIUM",
    };
  }

  const previousTrack = tracksById.get(candidate.previousTrackId);
  const nextTrack = tracksById.get(candidate.nextTrackId);
  const coordinate = midpointCoordinate(previousTrack?.endPoint ?? null, nextTrack?.startPoint ?? null);

  if (!coordinate) return null;

  return {
    ...coordinate,
    placementMethod: "ENDPOINT_MIDPOINT",
    confidence: candidate.endpointDistanceMeters === null ? "LOW" : "MEDIUM",
  };
};

export const canPersistInsideTrackWithoutManualOverride = (
  candidate: ResolveTrackTimeCandidateInput,
  tracksById: Map<string, TrackTimelineLookup>,
) => {
  if (candidate.type !== "INSIDE_TRACK_WINDOW") return true;

  return Boolean(tracksById.get(candidate.trackId)?.timeline?.length);
};
