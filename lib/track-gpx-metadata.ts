import type { Prisma } from "@/generated/prisma/client";
import type { TrackTimeSource } from "@/generated/prisma/enums";
import { getTrackRecordingTimezone } from "@/lib/track-recording-timezone";

export const TRACK_GPX_METADATA_VERSION = "track-gpx-metadata/v1";

/**
 * feature-158: what the current parser can derive, regardless of what a
 * particular file contains. The list travels in `gpxParse.parserCapabilities`
 * so a reader can tell "the parser was older" from "the file had no data".
 */
export const TRACK_GPX_PARSER_CAPABILITIES = [
  "summary",
  "mapGeometry",
  "timeline",
  "time",
  "movingTime",
  "sourceInfo",
] as const;

export type TrackGpxParseCapability = (typeof TRACK_GPX_PARSER_CAPABILITIES)[number];

export type TrackGpxParseStatus = "SUCCESS" | "FAILED" | "STALE";

/** feature-160: the app that wrote the file and the device it names, if any. */
export type TrackGpxSourceInfo = {
  recordingApp: string | null;
  deviceName: string | null;
};
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
  /**
   * feature-144: elapsed time minus stopped intervals. Optional so a parse
   * from before the field, or one that cannot derive it, stays readable
   * without a metadata-version bump.
   */
  movingDurationSeconds?: number | null;
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
    /**
     * feature-158: what the parser could produce when this row was written.
     * Optional so rows from before the field stay readable; unknown future
     * names are tolerated.
     */
    parserCapabilities?: string[];
  };
  summary: TrackGpxSummary | null;
  mapGeometry: TrackGpxCoordinate[] | null;
  /** Compact timed points for photo inference; null/absent on older parses. */
  timeline: TrackGpxTimedPoint[] | null;
  /** feature-160: recording app and device, always present on a fresh parse. */
  sourceInfo?: TrackGpxSourceInfo;
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

const isSourceInfo = (value: unknown): value is TrackGpxSourceInfo =>
  isRecord(value) &&
  (value.recordingApp === null || typeof value.recordingApp === "string") &&
  (value.deviceName === null || typeof value.deviceName === "string");

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
                  start: value.summary.time.start,
                  end: value.summary.time.end,
                  durationSeconds: value.summary.time.durationSeconds,
                  timezoneEvidence: readTimezoneEvidence(value.summary.time.timezoneEvidence),
                  ...(typeof value.summary.time.movingDurationSeconds === "number" &&
                  Number.isFinite(value.summary.time.movingDurationSeconds)
                    ? { movingDurationSeconds: value.summary.time.movingDurationSeconds }
                    : {}),
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
  const sourceInfo =
    value.sourceInfo === undefined || value.sourceInfo === null
      ? undefined
      : isSourceInfo(value.sourceInfo)
        ? { recordingApp: value.sourceInfo.recordingApp, deviceName: value.sourceInfo.deviceName }
        : undefined;

  return {
    gpxParse: {
      status,
      version: TRACK_GPX_METADATA_VERSION,
      parsedAt: gpxParse.parsedAt,
      sourceFileAssetId: gpxParse.sourceFileAssetId,
      sourceFileKey: gpxParse.sourceFileKey,
      ...(errorMessage ? { errorMessage } : {}),
      ...(Array.isArray(gpxParse.parserCapabilities) &&
      gpxParse.parserCapabilities.every((capability) => typeof capability === "string")
        ? { parserCapabilities: [...gpxParse.parserCapabilities] }
        : {}),
    },
    summary,
    mapGeometry,
    timeline,
    ...(sourceInfo ? { sourceInfo } : {}),
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

/**
 * feature-158: capabilities the current parser has that a stored parse does
 * not declare. Without a marker every capability is missing, which is what
 * makes a pre-marker row outdated.
 */
export const getMissingTrackParseCapabilities = (
  stored?: string[] | null,
  required: readonly string[] = TRACK_GPX_PARSER_CAPABILITIES,
): string[] => required.filter((capability) => !(stored ?? []).includes(capability));

export type CanUpdateTrackParseInput = {
  timeSource: TrackTimeSource | null;
  routeId: string | null;
  /** The track's own active TRACK_GPX file, not the resolved route file. */
  hasOwnActiveTrackGpxFile: boolean;
};

/**
 * feature-158: whether this track may be reparsed at all. A route-primary
 * row resolves to the route's file, which is also an active TRACK_GPX file,
 * so the caller must pass the row's own file and `routeId`.
 */
export const canUpdateTrackParse = ({ timeSource, routeId, hasOwnActiveTrackGpxFile }: CanUpdateTrackParseInput) =>
  timeSource === "GPX" && routeId === null && hasOwnActiveTrackGpxFile;

/**
 * feature-158: a missing, failed, or stale parse is outdated because the row
 * cannot recover without a reparse. A successful parse is outdated when the
 * stored capability list is absent or misses a current capability; a
 * capability that produced no value because the file had no data is not
 * outdated.
 */
export const isTrackParseOutdated = (state: TrackGpxMetadataState): boolean => {
  if (state.status !== "SUCCESS") return true;

  return getMissingTrackParseCapabilities(state.metadata.gpxParse.parserCapabilities).length > 0;
};

/** feature-160: how much of a source name the badge shows before an ellipsis. */
export const TRACK_SOURCE_LABEL_MAX_LENGTH = 15;

/**
 * feature-160: keep the badge compact without changing the stored raw value;
 * the full label stays available as the badge title.
 */
export const formatTrackSourceLabel = (value: string, maxLength = TRACK_SOURCE_LABEL_MAX_LENGTH) =>
  value.length > maxLength ? `${value.slice(0, maxLength).trimEnd()}…` : value;

/**
 * feature-160: the badge on the track page. A manual workout keeps its
 * existing `Source: Manual` badge, so it returns null here; a GPX file shows
 * its device, then the app that wrote it.
 */
export const getTrackSourceBadgeLabel = ({
  sourceInfo,
  timeSource,
}: {
  sourceInfo?: TrackGpxSourceInfo | null;
  timeSource: TrackTimeSource | null;
}) => {
  if (timeSource === "MANUAL") return null;

  return sourceInfo?.deviceName?.trim() || sourceInfo?.recordingApp?.trim() || null;
};

/**
 * feature-160: the map legend label. A manual or route-based primary reads
 * `Manual route`; a file line reads its device, then its app, and a null
 * result lets the legend fall back to the title.
 */
export const getTrackLegendLabel = ({
  sourceInfo,
  timeSource,
  isRoute,
}: {
  sourceInfo?: TrackGpxSourceInfo | null;
  timeSource: TrackTimeSource | null;
  isRoute: boolean;
}) => {
  if (timeSource === "MANUAL" || isRoute) return "Manual route";

  return sourceInfo?.deviceName?.trim() || sourceInfo?.recordingApp?.trim() || null;
};

export type TrackMapViewModel = {
  title: string;
  bounds: TrackGpxBounds;
  geometry: TrackGpxCoordinate[];
  dayKeys?: string[];
  // feature-150: a dual-map line that carries its role. Undefined keeps the
  // existing rotating palette and single-line behavior for every other map.
  style?: "primary" | "secondary";
  /** feature-160: legend text when it differs from the title. */
  legendLabel?: string;
};

export const toTrackMapViewModel = (
  title: string,
  metadata: Prisma.JsonValue | null | undefined,
  source?: { fileAssetId: string; fileKey: string },
  legendLabel?: string | null,
): TrackMapViewModel | null => {
  const parsedState = getTrackGpxMetadataState(metadata, source);

  if (parsedState.status !== "SUCCESS" || parsedState.mapGeometry.length === 0) {
    return null;
  }

  return {
    title,
    bounds: parsedState.summary.bounds,
    geometry: parsedState.mapGeometry,
    ...(legendLabel ? { legendLabel } : {}),
  };
};

export const createSuccessfulTrackGpxMetadata = ({
  parsedAt = new Date(),
  sourceFileAssetId,
  sourceFileKey,
  summary,
  mapGeometry,
  timeline = null,
  sourceInfo,
}: {
  parsedAt?: Date;
  sourceFileAssetId: string;
  sourceFileKey: string;
  summary: TrackGpxSummary;
  mapGeometry: TrackGpxCoordinate[];
  timeline?: TrackGpxTimedPoint[] | null;
  sourceInfo?: TrackGpxSourceInfo;
}): TrackGpxMetadata => ({
  gpxParse: {
    status: "SUCCESS",
    version: TRACK_GPX_METADATA_VERSION,
    parsedAt: parsedAt.toISOString(),
    sourceFileAssetId,
    sourceFileKey,
    parserCapabilities: [...TRACK_GPX_PARSER_CAPABILITIES],
  },
  summary,
  mapGeometry,
  timeline,
  ...(sourceInfo ? { sourceInfo } : {}),
});

export const createFailedTrackGpxMetadata = ({
  parsedAt = new Date(),
  sourceFileAssetId,
  sourceFileKey,
  errorMessage,
  sourceInfo,
}: {
  parsedAt?: Date;
  sourceFileAssetId: string;
  sourceFileKey: string;
  errorMessage: string;
  sourceInfo?: TrackGpxSourceInfo;
}): TrackGpxMetadata => ({
  gpxParse: {
    status: "FAILED",
    version: TRACK_GPX_METADATA_VERSION,
    parsedAt: parsedAt.toISOString(),
    sourceFileAssetId,
    sourceFileKey,
    errorMessage,
    parserCapabilities: [...TRACK_GPX_PARSER_CAPABILITIES],
  },
  summary: null,
  mapGeometry: null,
  timeline: null,
  ...(sourceInfo ? { sourceInfo } : {}),
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

/**
 * The single source of truth for track duration formatting. The public track
 * detail header, the GPX summary, the public lists, the admin tables, the
 * trip cards, and the workouts table all render durations through this
 * helper, so one change formats every surface alike. Do not add local
 * rounding or unit rules at a call site.
 */
export const formatTrackDuration = (seconds?: number | null) => {
  if (!isFiniteNumber(seconds)) return null;

  const totalSeconds = Math.max(0, Math.round(seconds));

  if (totalSeconds === 0) return "0 min";

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;
  const parts: string[] = [];

  if (hours > 0) parts.push(`${hours} h`);
  if (minutes > 0) parts.push(`${minutes} min`);
  // feature-157: seconds are shown only when the duration actually has them;
  // a whole-minute duration stays as compact as before.
  if (remainingSeconds > 0) parts.push(`${remainingSeconds} s`);

  return parts.join(" ");
};

export const formatTrackRecordingDateTime = (
  value?: string | null,
  recordingTimezone?: string | null,
  options: { includeWeekday?: boolean } = {},
) => {
  if (!value || Number.isNaN(Date.parse(value))) return null;

  return new Intl.DateTimeFormat("en", {
    ...(options.includeWeekday ? { weekday: "short" as const } : {}),
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: getTrackRecordingTimezone(recordingTimezone),
  }).format(new Date(value));
};

export const formatTrackRecordingTimeRange = (time?: TrackGpxTimeSummary | null, recordingTimezone?: string | null) => {
  if (!time) return null;

  const start = formatTrackRecordingDateTime(time.start, recordingTimezone);
  const end = formatTrackRecordingDateTime(time.end, recordingTimezone);

  if (!start || !end) return null;

  return `${start} - ${end}`;
};

export type TrackRecordingLineInput = {
  /** `MANUAL` tracks show their stored values; every other source shows parsed GPX times. */
  source: "GPX" | "MANUAL";
  start?: string | null;
  finish?: string | null;
  durationSeconds?: number | null;
  recordingTimezone?: string | null;
};

/** feature-157: the sentence shown when a track has no recorded time. */
export const TRACK_RECORDING_UNKNOWN_TEXT = "Time not recorded";

/**
 * feature-139: the public track detail page shows the recording time as one
 * compact header line. GPX tracks show the parsed start and finish; MANUAL
 * tracks show the stored start and duration and never a derived finish.
 * A missing side stays visible as an explicit unknown instead of collapsing
 * into an empty gap.
 */
export const formatTrackRecordingLine = ({
  source,
  start,
  finish,
  durationSeconds,
  recordingTimezone,
}: TrackRecordingLineInput) => {
  if (source === "MANUAL") {
    const formattedStart = formatTrackRecordingDateTime(start, recordingTimezone);
    const formattedDuration = formatTrackDuration(durationSeconds);

    if (!formattedStart && !formattedDuration) return TRACK_RECORDING_UNKNOWN_TEXT;

    return `${formattedStart ?? "start unknown"} · ${formattedDuration ?? "duration unknown"}`;
  }

  const formattedStart = formatTrackRecordingDateTime(start, recordingTimezone);
  const formattedFinish = formatTrackRecordingDateTime(finish, recordingTimezone);

  if (!formattedStart && !formattedFinish) return TRACK_RECORDING_UNKNOWN_TEXT;

  return `${formattedStart ?? "start unknown"} – ${formattedFinish ?? "finish unknown"}`;
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

export const TRACK_TIME_SOURCE_I18N_KEYS: Record<TrackTimeSource, string> = {
  GPX: "trackTimeSourceGpx",
  MANUAL: "placeOnMapTimeSourceManual",
  NONE: "placeOnMapTimeSourceNone",
};

export const getTrackTimeSourceI18nKey = (value?: TrackTimeSource | null): string | null => {
  if (!value) return null;
  return TRACK_TIME_SOURCE_I18N_KEYS[value];
};

export const TRACK_TIME_SOURCE_LABELS: Record<TrackTimeSource, string> = {
  GPX: "GPX",
  MANUAL: "Manual",
  NONE: "Not set",
};

export const formatTrackTimeSource = (value?: TrackTimeSource | null): string | null => {
  if (!value) return null;
  return TRACK_TIME_SOURCE_LABELS[value];
};
