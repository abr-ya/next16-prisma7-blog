import {
  createFailedTrackGpxMetadata,
  createSuccessfulTrackGpxMetadata,
  type TrackGpxBounds,
  type TrackGpxCoordinate,
  type TrackGpxElevationSummary,
  type TrackGpxMetadata,
  type TrackGpxSummary,
  type TrackGpxTimeSummary,
  type TrackGpxTimezoneEvidence,
} from "@/lib/track-gpx-metadata";

type ParsedGpxPoint = TrackGpxCoordinate & {
  ele?: number;
  time?: string;
  timeTimezoneEvidence?: Exclude<TrackGpxTimezoneEvidence, "MIXED" | "UNKNOWN">;
};

type ParseTrackGpxInput = {
  content: string;
  sourceFileAssetId: string;
  sourceFileKey: string;
};

const EARTH_RADIUS_METERS = 6371000;
const MAX_SIMPLIFIED_POINTS = 1000;
const SIMPLIFY_TOLERANCE_DEGREES = 0.00008;

const decodeXmlEntity = (value: string) =>
  value
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const readAttribute = (attributes: string, name: string) => {
  const match = attributes.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']+)["']`, "i"));

  return match ? decodeXmlEntity(match[1]) : null;
};

const readChildText = (content: string, name: string) => {
  const match = content.match(
    new RegExp(`<\\s*(?:[\\w-]+:)?${name}\\b[^>]*>([\\s\\S]*?)<\\s*/\\s*(?:[\\w-]+:)?${name}\\s*>`, "i"),
  );

  return match ? decodeXmlEntity(match[1].trim()) : null;
};

const isFiniteCoordinate = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;

const TIMEZONE_OFFSET_PATTERN = /(?:z|[+-]\d{2}:?\d{2})$/i;

const getTimeTimezoneEvidence = (value: string): Exclude<TrackGpxTimezoneEvidence, "MIXED" | "UNKNOWN"> =>
  TIMEZONE_OFFSET_PATTERN.test(value.trim()) ? "UTC_OR_OFFSET" : "MISSING";

const parseGpxPoints = (content: string): ParsedGpxPoint[] => {
  const points: ParsedGpxPoint[] = [];
  const pointPattern =
    /<\s*(?:[\w-]+:)?(?:trkpt|rtept)\b([^>/]*)(?:\/>|>([\s\S]*?)<\s*\/\s*(?:[\w-]+:)?(?:trkpt|rtept)\s*>)/gi;

  for (const match of content.matchAll(pointPattern)) {
    const latValue = readAttribute(match[1], "lat");
    const lngValue = readAttribute(match[1], "lon");
    const lat = latValue === null ? Number.NaN : Number(latValue);
    const lng = lngValue === null ? Number.NaN : Number(lngValue);

    if (!isFiniteCoordinate(lat, lng)) continue;

    const eleValue = readChildText(match[2] ?? "", "ele");
    const timeValue = readChildText(match[2] ?? "", "time");
    const ele = eleValue === null ? undefined : Number(eleValue);
    const time = timeValue && !Number.isNaN(Date.parse(timeValue)) ? new Date(timeValue).toISOString() : undefined;
    const timeTimezoneEvidence = time && timeValue ? getTimeTimezoneEvidence(timeValue) : undefined;

    points.push({
      lat,
      lng,
      ...(Number.isFinite(ele) ? { ele } : {}),
      ...(time ? { time } : {}),
      ...(timeTimezoneEvidence ? { timeTimezoneEvidence } : {}),
    });
  }

  return points;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceBetweenPoints = (from: TrackGpxCoordinate, to: TrackGpxCoordinate) => {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_METERS * c;
};

const computeBounds = (points: TrackGpxCoordinate[]): TrackGpxBounds =>
  points.reduce(
    (bounds, point) => ({
      north: Math.max(bounds.north, point.lat),
      south: Math.min(bounds.south, point.lat),
      east: Math.max(bounds.east, point.lng),
      west: Math.min(bounds.west, point.lng),
    }),
    {
      north: points[0].lat,
      south: points[0].lat,
      east: points[0].lng,
      west: points[0].lng,
    },
  );

const computeDistance = (points: TrackGpxCoordinate[]) =>
  points.reduce((total, point, index) => {
    if (index === 0) return total;

    return total + distanceBetweenPoints(points[index - 1], point);
  }, 0);

const computeElevation = (points: ParsedGpxPoint[]): TrackGpxElevationSummary | null => {
  const elevations = points.map((point) => point.ele).filter((value): value is number => Number.isFinite(value));

  if (elevations.length === 0) return null;

  let ascentMeters = 0;
  let descentMeters = 0;
  let previous: number | null = null;

  for (const point of points) {
    const elevation = point.ele;

    if (typeof elevation !== "number" || !Number.isFinite(elevation)) continue;

    if (previous !== null) {
      const delta = elevation - previous;

      if (delta > 0) ascentMeters += delta;
      if (delta < 0) descentMeters += Math.abs(delta);
    }

    previous = elevation;
  }

  return {
    minMeters: Math.min(...elevations),
    maxMeters: Math.max(...elevations),
    ascentMeters,
    descentMeters,
  };
};

const computeTime = (points: ParsedGpxPoint[]): TrackGpxTimeSummary | null => {
  const times = points
    .map((point) => ({
      timestamp: point.time ? new Date(point.time).getTime() : Number.NaN,
      timezoneEvidence: point.timeTimezoneEvidence,
    }))
    .filter(
      (
        value,
      ): value is { timestamp: number; timezoneEvidence: Exclude<TrackGpxTimezoneEvidence, "MIXED" | "UNKNOWN"> } =>
        Number.isFinite(value.timestamp) && Boolean(value.timezoneEvidence),
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  if (times.length === 0) return null;

  const start = times[0].timestamp;
  const end = times[times.length - 1].timestamp;
  const evidenceValues = new Set(times.map((time) => time.timezoneEvidence));

  return {
    start: new Date(start).toISOString(),
    end: new Date(end).toISOString(),
    durationSeconds: Math.max(0, Math.round((end - start) / 1000)),
    timezoneEvidence: evidenceValues.size === 1 ? times[0].timezoneEvidence : "MIXED",
  };
};

const perpendicularDistance = (point: TrackGpxCoordinate, start: TrackGpxCoordinate, end: TrackGpxCoordinate) => {
  const dx = end.lng - start.lng;
  const dy = end.lat - start.lat;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.lng - start.lng, point.lat - start.lat);
  }

  const numerator = Math.abs(dx * (start.lat - point.lat) - (start.lng - point.lng) * dy);
  const denominator = Math.hypot(dx, dy);

  return numerator / denominator;
};

const simplifyDouglasPeucker = (points: TrackGpxCoordinate[], tolerance: number): TrackGpxCoordinate[] => {
  if (points.length <= 2) return points;

  let maxDistance = 0;
  let index = 0;

  for (let i = 1; i < points.length - 1; i += 1) {
    const distance = perpendicularDistance(points[i], points[0], points[points.length - 1]);

    if (distance > maxDistance) {
      index = i;
      maxDistance = distance;
    }
  }

  if (maxDistance <= tolerance) return [points[0], points[points.length - 1]];

  const before = simplifyDouglasPeucker(points.slice(0, index + 1), tolerance);
  const after = simplifyDouglasPeucker(points.slice(index), tolerance);

  return [...before.slice(0, -1), ...after];
};

const getBoundsPreservingIndices = (points: TrackGpxCoordinate[]) => {
  const bounds = computeBounds(points);
  const indices = new Set([0, points.length - 1]);

  points.forEach((point, index) => {
    if (
      point.lat === bounds.north ||
      point.lat === bounds.south ||
      point.lng === bounds.east ||
      point.lng === bounds.west
    ) {
      indices.add(index);
    }
  });

  return [...indices].sort((a, b) => a - b);
};

const thinToMaxPoints = (points: TrackGpxCoordinate[], maxPoints: number) => {
  if (points.length <= maxPoints) return points;

  const mandatoryIndices = getBoundsPreservingIndices(points);
  const selected = new Set<number>(mandatoryIndices);
  const step = (points.length - 1) / (maxPoints - 1);

  for (let i = 1; i < maxPoints - 1; i += 1) {
    selected.add(Math.round(i * step));
  }

  return [...selected].sort((a, b) => a - b).map((index) => points[index]);
};

const simplifyMapGeometry = (points: TrackGpxCoordinate[]) => {
  if (points.length <= MAX_SIMPLIFIED_POINTS) return points;

  const boundsIndices = getBoundsPreservingIndices(points);
  const simplifiedSegments = boundsIndices.flatMap((startIndex, listIndex) => {
    const endIndex = boundsIndices[listIndex + 1];

    if (endIndex === undefined) return [];

    const segment = points.slice(startIndex, endIndex + 1);
    const simplified = simplifyDouglasPeucker(segment, SIMPLIFY_TOLERANCE_DEGREES);

    return listIndex === 0 ? simplified : simplified.slice(1);
  });

  return thinToMaxPoints(simplifiedSegments, MAX_SIMPLIFIED_POINTS);
};

const sanitizeErrorMessage = (error: unknown) => {
  const message = error instanceof Error ? error.message : "GPX parsing failed";

  if (
    message === "GPX file is not valid XML" ||
    message === "GPX file has no usable coordinates" ||
    message === "Unable to read GPX file from storage"
  ) {
    return message;
  }

  return "GPX parsing failed";
};

export const parseTrackGpxMetadata = ({
  content,
  sourceFileAssetId,
  sourceFileKey,
}: ParseTrackGpxInput): TrackGpxMetadata => {
  try {
    if (!/<\s*(?:[\w-]+:)?gpx(?:\s|>)/i.test(content)) {
      throw new Error("GPX file is not valid XML");
    }

    const points = parseGpxPoints(content);

    if (points.length === 0) {
      throw new Error("GPX file has no usable coordinates");
    }

    const mapGeometry = simplifyMapGeometry(points.map(({ lat, lng }) => ({ lat, lng })));
    const summary: TrackGpxSummary = {
      distanceMeters: computeDistance(points),
      bounds: computeBounds(points),
      elevation: computeElevation(points),
      time: computeTime(points),
      points: {
        source: points.length,
        simplified: mapGeometry.length,
      },
    };

    return createSuccessfulTrackGpxMetadata({
      sourceFileAssetId,
      sourceFileKey,
      summary,
      mapGeometry,
    });
  } catch (error) {
    return createFailedTrackGpxMetadata({
      sourceFileAssetId,
      sourceFileKey,
      errorMessage: sanitizeErrorMessage(error),
    });
  }
};
