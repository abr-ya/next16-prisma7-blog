import type { Prisma } from "@/generated/prisma/client";

export const TRACK_GPX_METADATA_VERSION = "track-gpx-metadata/v1";

export type TrackGpxParseStatus = "SUCCESS" | "FAILED" | "STALE";
export type TrackGpxTimezoneEvidence = "UTC_OR_OFFSET" | "MISSING" | "MIXED" | "UNKNOWN";

export type TrackGpxBounds = {
  north: number;
  south: number;
  east: number;
  west: number;
};

export type TrackGpxCoordinate = {
  lat: number;
  lng: number;
};

export type TrackGpxTimedPoint = TrackGpxCoordinate & {
  time: string;
};

export type TrackGpxElevationSummary = {
  minMeters: number;
  maxMeters: number;
  ascentMeters: number;
  descentMeters: number;
};

export type TrackGpxTimeSummary = {
  start: string;
  end: string;
  durationSeconds: number;
  timezoneEvidence: TrackGpxTimezoneEvidence;
};

export type TrackGpxPointSummary = {
  source: number;
  simplified: number;
};

export type TrackGpxSummary = {
  distanceMeters: number;
  bounds: TrackGpxBounds;
  elevation: TrackGpxElevationSummary | null;
  time: TrackGpxTimeSummary | null;
  points: TrackGpxPointSummary;
};

export type TrackGpxMetadata = {
  gpxParse: {
    status: TrackGpxParseStatus;
    version: typeof TRACK_GPX_METADATA_VERSION;
    parsedAt: string;
    sourceFileAssetId: string;
    sourceFileKey: string;
    errorMessage?: string;
  };
  summary: TrackGpxSummary | null;
  mapGeometry: TrackGpxCoordinate[] | null;
  /** Compact timed points for photo inference; null/absent on older parses. */
  timeline: TrackGpxTimedPoint[] | null;
};

export type TrackGpxMetadataState =
  | { status: "MISSING"; metadata: null }
  | {
      status: "SUCCESS";
      metadata: TrackGpxMetadata;
      summary: TrackGpxSummary;
      mapGeometry: TrackGpxCoordinate[];
      timeline: TrackGpxTimedPoint[] | null;
    }
  | { status: "FAILED"; metadata: TrackGpxMetadata; errorMessage: string }
  | { status: "STALE"; metadata: TrackGpxMetadata; errorMessage: string | null };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value);

const isIsoDateString = (value: unknown): value is string =>
  typeof value === "string" && !Number.isNaN(Date.parse(value));

const isBounds = (value: unknown): value is TrackGpxBounds =>
  isRecord(value) &&
  isFiniteNumber(value.north) &&
  isFiniteNumber(value.south) &&
  isFiniteNumber(value.east) &&
  isFiniteNumber(value.west);

const isCoordinate = (value: unknown): value is TrackGpxCoordinate =>
  isRecord(value) && isFiniteNumber(value.lat) && isFiniteNumber(value.lng);

const isTimedPoint = (value: unknown): value is TrackGpxTimedPoint =>
  isRecord(value) && isFiniteNumber(value.lat) && isFiniteNumber(value.lng) && isIsoDateString(value.time);

const isPointSummary = (value: unknown): value is TrackGpxPointSummary =>
  isRecord(value) && isFiniteNumber(value.source) && isFiniteNumber(value.simplified);

const isElevationSummary = (value: unknown): value is TrackGpxElevationSummary =>
  isRecord(value) &&
  isFiniteNumber(value.minMeters) &&
  isFiniteNumber(value.maxMeters) &&
  isFiniteNumber(value.ascentMeters) &&
  isFiniteNumber(value.descentMeters);

const isTimeSummary = (value: unknown): value is TrackGpxTimeSummary =>
  isRecord(value) &&
  isIsoDateString(value.start) &&
  isIsoDateString(value.end) &&
  isFiniteNumber(value.durationSeconds);

const readTimezoneEvidence = (value: unknown): TrackGpxTimezoneEvidence => {
  if (value === "UTC_OR_OFFSET" || value === "MISSING" || value === "MIXED" || value === "UNKNOWN") return value;

  return "UNKNOWN";
};

const isSummary = (value: unknown): value is TrackGpxSummary =>
  isRecord(value) &&
  isFiniteNumber(value.distanceMeters) &&
  isBounds(value.bounds) &&
  (value.elevation === null || isElevationSummary(value.elevation)) &&
  (value.time === null || isTimeSummary(value.time)) &&
  isPointSummary(value.points);

export const readTrackGpxMetadata = (value: Prisma.JsonValue | null | undefined): TrackGpxMetadata | null => {
  if (!isRecord(value)) return null;

  const gpxParse = value.gpxParse;
  if (!isRecord(gpxParse)) return null;

  const status = gpxParse.status;
  if (status !== "SUCCESS" && status !== "FAILED" && status !== "STALE") return null;

  if (
    gpxParse.version !== TRACK_GPX_METADATA_VERSION ||
    !isIsoDateString(gpxParse.parsedAt) ||
    typeof gpxParse.sourceFileAssetId !== "string" ||
    typeof gpxParse.sourceFileKey !== "string"
  ) {
    return null;
  }

  const errorMessage = typeof gpxParse.errorMessage === "string" ? gpxParse.errorMessage : undefined;
  const summary =
    value.summary === null
      ? null
      : isSummary(value.summary)
        ? {
            ...value.summary,
            time: value.summary.time
              ? {
                  ...value.summary.time,
                  timezoneEvidence: readTimezoneEvidence(value.summary.time.timezoneEvidence),
                }
              : null,
          }
        : null;
  const mapGeometry =
    Array.isArray(value.mapGeometry) && value.mapGeometry.every(isCoordinate) ? value.mapGeometry : null;
  const timeline =
    value.timeline === undefined || value.timeline === null
      ? null
      : Array.isArray(value.timeline) && value.timeline.every(isTimedPoint)
        ? value.timeline
        : null;

  return {
    gpxParse: {
      status,
      version: TRACK_GPX_METADATA_VERSION,
      parsedAt: gpxParse.parsedAt,
      sourceFileAssetId: gpxParse.sourceFileAssetId,
      sourceFileKey: gpxParse.sourceFileKey,
      ...(errorMessage ? { errorMessage } : {}),
    },
    summary,
    mapGeometry,
    timeline,
  };
};

export const getTrackGpxMetadataState = (
  value: Prisma.JsonValue | null | undefined,
  source?: { fileAssetId: string; fileKey: string },
): TrackGpxMetadataState => {
  const metadata = readTrackGpxMetadata(value);

  if (!metadata) return { status: "MISSING", metadata: null };

  const sourceChanged =
    source &&
    (metadata.gpxParse.sourceFileAssetId !== source.fileAssetId || metadata.gpxParse.sourceFileKey !== source.fileKey);

  if (sourceChanged || metadata.gpxParse.status === "STALE") {
    return { status: "STALE", metadata, errorMessage: metadata.gpxParse.errorMessage ?? null };
  }

  if (metadata.gpxParse.status === "FAILED") {
    return { status: "FAILED", metadata, errorMessage: metadata.gpxParse.errorMessage ?? "GPX parsing failed" };
  }

  if (metadata.summary && metadata.mapGeometry) {
    return {
      status: "SUCCESS",
      metadata,
      summary: metadata.summary,
      mapGeometry: metadata.mapGeometry,
      timeline: metadata.timeline,
    };
  }

  return { status: "STALE", metadata, errorMessage: "Parsed GPX metadata is incomplete" };
};

export type TrackMapViewModel = {
  title: string;
  bounds: TrackGpxBounds;
  geometry: TrackGpxCoordinate[];
};

export const toTrackMapViewModel = (
  title: string,
  metadata: Prisma.JsonValue | null | undefined,
  source?: { fileAssetId: string; fileKey: string },
): TrackMapViewModel | null => {
  const parsedState = getTrackGpxMetadataState(metadata, source);

  if (parsedState.status !== "SUCCESS" || parsedState.mapGeometry.length === 0) {
    return null;
  }

  return {
    title,
    bounds: parsedState.summary.bounds,
    geometry: parsedState.mapGeometry,
  };
};

export const createSuccessfulTrackGpxMetadata = ({
  parsedAt = new Date(),
  sourceFileAssetId,
  sourceFileKey,
  summary,
  mapGeometry,
  timeline = null,
}: {
  parsedAt?: Date;
  sourceFileAssetId: string;
  sourceFileKey: string;
  summary: TrackGpxSummary;
  mapGeometry: TrackGpxCoordinate[];
  timeline?: TrackGpxTimedPoint[] | null;
}): TrackGpxMetadata => ({
  gpxParse: {
    status: "SUCCESS",
    version: TRACK_GPX_METADATA_VERSION,
    parsedAt: parsedAt.toISOString(),
    sourceFileAssetId,
    sourceFileKey,
  },
  summary,
  mapGeometry,
  timeline,
});

export const createFailedTrackGpxMetadata = ({
  parsedAt = new Date(),
  sourceFileAssetId,
  sourceFileKey,
  errorMessage,
}: {
  parsedAt?: Date;
  sourceFileAssetId: string;
  sourceFileKey: string;
  errorMessage: string;
}): TrackGpxMetadata => ({
  gpxParse: {
    status: "FAILED",
    version: TRACK_GPX_METADATA_VERSION,
    parsedAt: parsedAt.toISOString(),
    sourceFileAssetId,
    sourceFileKey,
    errorMessage,
  },
  summary: null,
  mapGeometry: null,
  timeline: null,
});

export const markTrackGpxMetadataStale = (
  value: Prisma.JsonValue | null | undefined,
  sourceFileAssetId: string,
  sourceFileKey: string,
): TrackGpxMetadata | null => {
  const metadata = readTrackGpxMetadata(value);

  if (
    !metadata ||
    (metadata.gpxParse.sourceFileAssetId === sourceFileAssetId && metadata.gpxParse.sourceFileKey === sourceFileKey)
  ) {
    return null;
  }

  return {
    ...metadata,
    gpxParse: {
      ...metadata.gpxParse,
      status: "STALE",
      parsedAt: new Date().toISOString(),
      sourceFileAssetId,
      sourceFileKey,
      errorMessage: "Track GPX file was replaced. Reparse this track to refresh summary data.",
    },
    summary: null,
    mapGeometry: null,
    timeline: null,
  };
};

const numberFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });
const integerFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 0 });

export const formatTrackDistance = (meters?: number | null) => {
  if (!isFiniteNumber(meters)) return null;

  if (meters >= 1000) return `${numberFormat.format(meters / 1000)} km`;

  return `${integerFormat.format(meters)} m`;
};

export const formatTrackElevationRange = (elevation?: TrackGpxElevationSummary | null) => {
  if (!elevation) return null;

  return `${integerFormat.format(elevation.minMeters)}-${integerFormat.format(elevation.maxMeters)} m`;
};

export const formatTrackElevationGainLoss = (elevation?: TrackGpxElevationSummary | null) => {
  if (!elevation) return null;

  return `+${integerFormat.format(elevation.ascentMeters)} / -${integerFormat.format(elevation.descentMeters)} m`;
};

export const formatTrackDuration = (seconds?: number | null) => {
  if (!isFiniteNumber(seconds)) return null;

  const roundedSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(roundedSeconds / 3600);
  const minutes = Math.floor((roundedSeconds % 3600) / 60);

  if (hours > 0) return `${hours} h ${minutes} min`;

  return `${minutes} min`;
};

export const formatTrackRecordingDateTime = (value?: string | null) => {
  if (!value || Number.isNaN(Date.parse(value))) return null;

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
};

export const formatTrackRecordingTimeRange = (time?: TrackGpxTimeSummary | null) => {
  if (!time) return null;

  const start = formatTrackRecordingDateTime(time.start);
  const end = formatTrackRecordingDateTime(time.end);

  if (!start || !end) return null;

  return `${start} - ${end}`;
};

export const formatTrackTimezoneEvidence = (evidence?: TrackGpxTimezoneEvidence | null) => {
  if (evidence === "UTC_OR_OFFSET") return "GPX UTC/offset";
  if (evidence === "MISSING") return "Timezone ambiguous";
  if (evidence === "MIXED") return "Mixed timezone evidence";

  return "Timezone evidence unknown";
};

export const formatTrackPointCount = (points?: TrackGpxPointSummary | null) => {
  if (!points) return null;

  return `${integerFormat.format(points.simplified)} / ${integerFormat.format(points.source)} points`;
};

export const formatTrackTimelinePresence = (timeline?: TrackGpxTimedPoint[] | null) => {
  if (!timeline || timeline.length === 0) return "No timed timeline";

  return `Timeline ${integerFormat.format(timeline.length)} pts`;
};

export const hasTrackTimedTimeline = (timeline?: TrackGpxTimedPoint[] | null) =>
  Array.isArray(timeline) && timeline.length > 0;
