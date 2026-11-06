import { computeBounds, distanceBetweenPoints, type EditableGpxPoint } from "@/lib/track-gpx-parser";
import type { TrackGpxBounds } from "@/lib/track-gpx-metadata";

/** feature-138: the most points the cleanup modal receives in one payload. */
export const MAX_EDITOR_POINTS = 2000;
/** A click also removes hidden GPX points within this distance of the clicked one. */
export const CLEANUP_POINT_RADIUS_METERS = 15;
/** ...and within this time window, when both points carry a timestamp. */
export const CLEANUP_TIME_WINDOW_SECONDS = 10;
/** A track needs at least two usable points after a cleanup. */
export const MIN_RETAINED_POINTS = 2;
/** Guards the O(points × clicks) expansion pass on the server. */
const MAX_CLICK_EXPANSIONS = 100;
/** A point is suspicious when it detours this far from its neighbours... */
const SUSPICIOUS_EXTRA_METERS = 100;
/** ...and sits at least this far off the straight line between them. */
const SUSPICIOUS_DEVIATION_METERS = 50;
/** Bounds how many detected outliers can be added to the sampled payload. */
const MAX_SUSPICIOUS_POINTS = 1000;

export type TrackPointEditorPoint = {
  index: number;
  lat: number;
  lng: number;
  ele?: number;
  time?: string;
  /** Metres per second from the previous point; `null` without usable time. */
  speedMps: number | null;
  /** Distance from the track start to this point, along the full point list. */
  distanceFromStartMeters: number;
};

export type TrackPointIndexRange = {
  startIndex: number;
  endIndex: number;
};

export type TrackPointSelection = {
  ranges: TrackPointIndexRange[];
  clickedIndices: number[];
};

export type TrackPointEditorView = {
  totalPoints: number;
  hasTimeline: boolean;
  /** Summed distance of the full point list in metres. */
  distanceMeters: number;
  /** Evenly sampled points carrying their original full-list index. */
  points: TrackPointEditorPoint[];
  bounds: TrackGpxBounds;
};

export type TrackPointRemovalMask = {
  mask: boolean[];
  removedCount: number;
};

const EMPTY_BOUNDS: TrackGpxBounds = { north: 0, south: 0, east: 0, west: 0 };

const parsePointTime = (value?: string) => (value ? Date.parse(value) : Number.NaN);

const sampleIndices = (total: number) => {
  if (total <= MAX_EDITOR_POINTS) return Array.from({ length: total }, (_, index) => index);

  const step = Math.ceil(total / MAX_EDITOR_POINTS);
  const indices = new Set<number>();

  for (let index = 0; index < total; index += step) indices.add(index);
  indices.add(total - 1);

  return [...indices].sort((a, b) => a - b);
};

const METERS_PER_DEGREE_LAT = 111_320;

const projectToMeters = (origin: { lat: number; lng: number }, point: { lat: number; lng: number }) => {
  const latRadians = (origin.lat * Math.PI) / 180;

  return {
    x: (point.lng - origin.lng) * METERS_PER_DEGREE_LAT * Math.cos(latRadians),
    y: (point.lat - origin.lat) * METERS_PER_DEGREE_LAT,
  };
};

/** Perpendicular distance from `point` to the segment `from`–`to`, in metres. */
const distanceToSegmentMeters = (
  point: { lat: number; lng: number },
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
) => {
  const projected = projectToMeters(from, point);
  const target = projectToMeters(from, to);
  const lengthSquared = target.x * target.x + target.y * target.y;
  const ratio =
    lengthSquared === 0
      ? 0
      : Math.max(0, Math.min(1, (projected.x * target.x + projected.y * target.y) / lengthSquared));
  const projectedX = target.x * ratio;
  const projectedY = target.y * ratio;

  return Math.hypot(projected.x - projectedX, projected.y - projectedY);
};

/**
 * feature-138: uniform sampling can skip a lone GPS spike, which is exactly
 * the point the owner wants to remove. Flag points whose detour around the
 * line between their neighbours is large, so they always reach the modal.
 */
const findSuspiciousPointIndices = (points: EditableGpxPoint[]) => {
  const suspicious = new Set<number>();

  for (let index = 1; index < points.length - 1; index += 1) {
    const previous = points[index - 1]!;
    const point = points[index]!;
    const next = points[index + 1]!;
    const detour = distanceBetweenPoints(previous, point) + distanceBetweenPoints(point, next);
    const direct = distanceBetweenPoints(previous, next);

    if (detour - direct < SUSPICIOUS_EXTRA_METERS) continue;
    if (distanceToSegmentMeters(point, previous, next) < SUSPICIOUS_DEVIATION_METERS) continue;

    suspicious.add(index);
    suspicious.add(index + 1);
  }

  return [...suspicious].sort((left, right) => left - right);
};

const limitSuspiciousIndices = (indices: number[]) => {
  if (indices.length <= MAX_SUSPICIOUS_POINTS) return indices;

  const step = Math.ceil(indices.length / MAX_SUSPICIOUS_POINTS);

  return indices.filter((_, index) => index % step === 0);
};

/** Speed for every point, derived from the previous point's distance and time. */
export const computePointSpeeds = (points: EditableGpxPoint[]): (number | null)[] =>
  points.map((point, index) => {
    if (index === 0) return null;

    const previous = points[index - 1];
    const from = parsePointTime(previous.time);
    const to = parsePointTime(point.time);

    if (!Number.isFinite(from) || !Number.isFinite(to)) return null;

    const seconds = (to - from) / 1000;

    if (seconds <= 0) return null;

    return distanceBetweenPoints(previous, point) / seconds;
  });

export const buildTrackPointEditorView = (points: EditableGpxPoint[]): TrackPointEditorView => {
  if (points.length === 0) {
    return { totalPoints: 0, hasTimeline: false, distanceMeters: 0, points: [], bounds: EMPTY_BOUNDS };
  }

  const speeds = computePointSpeeds(points);
  const cumulative: number[] = [];

  for (let index = 0; index < points.length; index += 1) {
    cumulative.push(
      index === 0 ? 0 : cumulative[index - 1]! + distanceBetweenPoints(points[index - 1]!, points[index]!),
    );
  }

  const sampledIndices = [
    ...new Set([...sampleIndices(points.length), ...limitSuspiciousIndices(findSuspiciousPointIndices(points))]),
  ].sort((left, right) => left - right);

  const sampled = sampledIndices.map((pointIndex) => {
    const point = points[pointIndex]!;

    return {
      index: point.index,
      lat: point.lat,
      lng: point.lng,
      ...(point.ele !== undefined ? { ele: point.ele } : {}),
      ...(point.time ? { time: point.time } : {}),
      speedMps: speeds[pointIndex] ?? null,
      distanceFromStartMeters: cumulative[pointIndex] ?? 0,
    };
  });

  return {
    totalPoints: points.length,
    hasTimeline: points.some((point) => Boolean(point.time)),
    distanceMeters: cumulative[cumulative.length - 1] ?? 0,
    points: sampled,
    bounds: computeBounds(points),
  };
};

export const normalizeIndexRanges = (ranges: TrackPointIndexRange[], totalPoints: number) => {
  if (totalPoints <= 0) return [];

  const clamped = ranges
    .map((range) => {
      const first = Math.min(range.startIndex, range.endIndex);
      const last = Math.max(range.startIndex, range.endIndex);

      return {
        startIndex: Math.max(0, Math.min(totalPoints - 1, first)),
        endIndex: Math.max(0, Math.min(totalPoints - 1, last)),
      };
    })
    .sort((left, right) => left.startIndex - right.startIndex);

  const merged: TrackPointIndexRange[] = [];

  for (const range of clamped) {
    const previous = merged[merged.length - 1];

    if (previous && range.startIndex <= previous.endIndex + 1) {
      previous.endIndex = Math.max(previous.endIndex, range.endIndex);
    } else {
      merged.push({ ...range });
    }
  }

  return merged;
};

/** Whether a full point falls inside the radius/time window of one clicked point. */
export const isPointWithinCleanupWindow = (
  point: { lat: number; lng: number; time?: string },
  clicked: { lat: number; lng: number; time?: string },
) => {
  if (distanceBetweenPoints(point, clicked) > CLEANUP_POINT_RADIUS_METERS) return false;

  if (!point.time || !clicked.time) return true;

  const pointTime = Date.parse(point.time);
  const clickedTime = Date.parse(clicked.time);

  if (!Number.isFinite(pointTime) || !Number.isFinite(clickedTime)) return true;

  return Math.abs(pointTime - clickedTime) / 1000 <= CLEANUP_TIME_WINDOW_SECONDS;
};

/**
 * Turns the editor selection into a keep/remove mask over the FULL point list.
 * Returns `null` when the selection cannot be applied safely.
 */
export const buildRemovalMask = (
  points: EditableGpxPoint[],
  selection: TrackPointSelection,
): TrackPointRemovalMask | null => {
  if (points.length === 0) return null;

  const clickedIndices = [...new Set(selection.clickedIndices)].filter(
    (index) => Number.isInteger(index) && index >= 0 && index < points.length,
  );

  if (clickedIndices.length > MAX_CLICK_EXPANSIONS) return null;

  const mask = new Array<boolean>(points.length).fill(false);

  for (const range of normalizeIndexRanges(selection.ranges, points.length)) {
    for (let index = range.startIndex; index <= range.endIndex; index += 1) mask[index] = true;
  }

  for (const index of clickedIndices) {
    const clicked = points[index]!;

    for (const point of points) {
      if (!mask[point.index] && isPointWithinCleanupWindow(point, clicked)) mask[point.index] = true;
    }
  }

  const removedCount = mask.reduce((count, removed) => (removed ? count + 1 : count), 0);

  return { mask, removedCount };
};

/** Removes the masked point elements while leaving the rest of the XML byte-identical. */
export const removePointsFromGpx = (content: string, points: EditableGpxPoint[], mask: boolean[]) => {
  let cursor = 0;
  let result = "";

  for (const point of points) {
    if (!mask[point.index]) continue;
    if (point.start < cursor) continue;

    result += content.slice(cursor, point.start);
    cursor = point.end;
  }

  result += content.slice(cursor);

  return result;
};

/**
 * Approximate remaining distance after the selection is removed. The sampled
 * points bound each removed span, so the dialog labels the value as an
 * estimate; the server's re-parse produces the exact number after saving.
 */
export const estimateDistanceAfterCleanup = (view: TrackPointEditorView, selection: TrackPointSelection) => {
  if (view.points.length === 0) return view.distanceMeters;

  const clickedRanges = selection.clickedIndices.flatMap((index) => {
    const clicked = view.points.find((point) => point.index === index);

    if (!clicked) return [];

    const nearby = view.points.filter((point) => isPointWithinCleanupWindow(point, clicked));
    const first = nearby[0];
    const last = nearby[nearby.length - 1];

    return first && last ? [{ startIndex: first.index, endIndex: last.index }] : [];
  });
  const ranges = normalizeIndexRanges([...selection.ranges, ...clickedRanges], view.totalPoints);

  let removedMeters = 0;

  for (const range of ranges) {
    const before = [...view.points].reverse().find((point) => point.index < range.startIndex);
    const after = view.points.find((point) => point.index > range.endIndex);
    const startMeters = before ? before.distanceFromStartMeters : 0;
    const endMeters = after ? after.distanceFromStartMeters : view.distanceMeters;
    const removedSpan = Math.max(0, endMeters - startMeters);
    // Deleting points reconnects the neighbours, so the direct segment
    // between them still counts toward the new track.
    const reconnectedMeters = before && after ? distanceBetweenPoints(before, after) : 0;

    removedMeters += Math.max(0, removedSpan - reconnectedMeters);
  }

  return Math.max(0, view.distanceMeters - removedMeters);
};

const formatEditStamp = (date: Date, timeZone?: string | null) => {
  try {
    const parts = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
      timeZone: timeZone ?? "UTC",
    }).formatToParts(date);
    const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

    return `${read("year")}-${read("month")}-${read("day")}_${read("hour")}${read("minute")}${read("second")}`;
  } catch {
    return date.toISOString().slice(0, 19).replace("T", "_").replaceAll(":", "");
  }
};

/**
 * feature-138: keeps the owner's original GPX file name and appends one edit
 * timestamp. A name that already ends with a `(YYYY-MM-DD)` or
 * `(YYYY-MM-DD_HHmmss)` suffix from an earlier cleanup has that suffix
 * replaced instead of chained.
 */
export const buildEditedTrackGpxFileName = (originalName: string, editedAt: Date, timeZone?: string | null) => {
  const trimmed = originalName.trim();
  const extensionMatch = trimmed.match(/\.gpx$/i);
  const extension = extensionMatch ? extensionMatch[0] : ".gpx";
  const base =
    trimmed
      .replace(/\.gpx$/i, "")
      .replace(/(?:\s*\(\d{4}-\d{2}-\d{2}(?:_\d{6})?\))+$/g, "")
      .trim() || "track";

  return `${base} (${formatEditStamp(editedAt, timeZone)})${extension}`;
};
