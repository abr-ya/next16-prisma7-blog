// feature-152: the wording-independent parts of a composite route.
//
// A composition is a recipe — ordered child routes, a role and a lap count —
// and the parent's geometry is materialized from the children's full points.
// This module owns the recipe rules and the geometry plan: it validates the
// shape of a recipe and turns a validated recipe plus the child points into
// the single point list that becomes the parent's synthetic GPX. Ownership,
// nesting and storage belong to the data layer, so the plan stays testable
// without Prisma or upload calls.
//
// feature-153: the recipe rules live here as pure functions — the shape of a
// recipe and whether it means anything — and the data layer applies them. The
// geometry plan does not judge whether a recipe is worth storing: a single
// segment with a single lap still plans, it is the recipe that is refused.

/** A gap larger than this between consecutive segments is refused. */
export const ROUTE_COMPOSITION_CONTINUITY_TOLERANCE_METERS = 25;

/**
 * A loop whose first and last point sit this close is treated as closed: the
 * duplicate closing point is dropped before the lap is repeated, so the seam
 * adds no zero-length section.
 */
export const ROUTE_COMPOSITION_LOOP_CLOSURE_TOLERANCE_METERS = 25;

/** The roles a recipe can carry. Only MAIN may repeat. */
export const ROUTE_SEGMENT_ROLES = ["START", "MAIN", "END"] as const;

export type RouteSegmentRoleKey = (typeof ROUTE_SEGMENT_ROLES)[number];

/** A segment without an explicit role is a main segment. */
export const DEFAULT_ROUTE_SEGMENT_ROLE = "MAIN" as const;

export type RouteCompositionPoint = { lat: number; lng: number };

export type RouteCompositionSegmentInput = {
  childRouteId: string;
  role: string;
  sortOrder: number;
  lapCount: number;
};

export type RouteCompositionSegment = RouteCompositionSegmentInput & {
  points: RouteCompositionPoint[];
};

/**
 * The codes a recipe is refused with before any geometry is planned: the
 * shape of the recipe and whether it means anything.
 */
export type RouteRecipeIssue = {
  code:
    | "NO_SEGMENTS"
    | "ORDER"
    | "DUPLICATE_ORDER"
    | "ROLE"
    | "ROLE_ORDER"
    | "ROLE_DUPLICATE"
    | "ROLE_MISSING_MAIN"
    | "CONNECTOR_LAPS"
    | "LAP_COUNT"
    | "NOT_MEANINGFUL";
  message: string;
};

/** The codes a geometry plan is refused with. */
export type RouteCompositionPlanIssue = {
  code: "NOT_ENOUGH_POINTS" | "OPEN_LAP" | "GAP";
  message: string;
};

export type RouteCompositionIssue = RouteRecipeIssue | RouteCompositionPlanIssue;

export type RouteCompositionPlan =
  | { ok: true; points: RouteCompositionPoint[]; droppedClosingPoints: number }
  | { ok: false; issue: RouteCompositionIssue };

const toRadians = (value: number) => (value * Math.PI) / 180;

const distanceMeters = (from: RouteCompositionPoint, to: RouteCompositionPoint) => {
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);
  const dLat = lat2 - lat1;
  const dLng = toRadians(to.lng - from.lng);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;

  return 2 * 6371000 * Math.asin(Math.sqrt(a));
};

const formatMeters = (value: number) => `${Math.round(value)} m`;

/**
 * Validate the shape of a recipe before any geometry or storage work: a
 * non-empty ordered list, known roles, a start only first, an end only last,
 * at least one main segment, and a positive lap count that only a main
 * segment may raise above one.
 */
export const validateRouteCompositionSegments = (segments: RouteCompositionSegmentInput[]): RouteRecipeIssue | null => {
  if (segments.length === 0) {
    return { code: "NO_SEGMENTS", message: "A route composition needs at least one segment" };
  }

  const seenOrders = new Set<number>();

  for (const segment of segments) {
    if (!Number.isInteger(segment.sortOrder) || segment.sortOrder < 0) {
      return { code: "ORDER", message: "A segment order must be a whole number from zero" };
    }

    if (seenOrders.has(segment.sortOrder)) {
      return { code: "DUPLICATE_ORDER", message: "Route composition segment order must be unique" };
    }
    seenOrders.add(segment.sortOrder);

    if (!(ROUTE_SEGMENT_ROLES as readonly string[]).includes(segment.role)) {
      return { code: "ROLE", message: "A segment role must be start, main, or end" };
    }

    if (!Number.isInteger(segment.lapCount) || segment.lapCount < 1) {
      return { code: "LAP_COUNT", message: "A segment lap count must be a positive whole number" };
    }

    if (segment.role !== DEFAULT_ROUTE_SEGMENT_ROLE && segment.lapCount !== 1) {
      return {
        code: "CONNECTOR_LAPS",
        message: "Only a main segment can repeat; a start or an end is a single pass",
      };
    }
  }

  const ordered = [...segments].sort((first, second) => first.sortOrder - second.sortOrder);
  const starts = ordered.filter((segment) => segment.role === "START");
  const ends = ordered.filter((segment) => segment.role === "END");
  const mains = ordered.filter((segment) => segment.role === DEFAULT_ROUTE_SEGMENT_ROLE);

  if (starts.length > 1) {
    return { code: "ROLE_DUPLICATE", message: "A route composition can have only one start segment" };
  }

  if (ends.length > 1) {
    return { code: "ROLE_DUPLICATE", message: "A route composition can have only one end segment" };
  }

  if (starts.length === 1 && ordered[0].role !== "START") {
    return { code: "ROLE_ORDER", message: "The start segment must be the first segment" };
  }

  if (ends.length === 1 && ordered[ordered.length - 1].role !== "END") {
    return { code: "ROLE_ORDER", message: "The end segment must be the last segment" };
  }

  if (mains.length === 0) {
    return { code: "ROLE_MISSING_MAIN", message: "A route composition needs at least one main segment" };
  }

  return null;
};

/**
 * A recipe has to mean something: two segments, or one segment repeated more
 * than once. A single segment with a single lap would only copy that route
 * under a new name, so it is refused.
 *
 * This is a product rule rather than a geometry rule, so the data layer
 * applies it — the geometry plan still materializes a single-segment recipe.
 */
export const validateRouteCompositionMeaning = (segments: RouteCompositionSegmentInput[]): RouteRecipeIssue | null => {
  if (segments.length === 0) return null;
  if (segments.length > 1) return null;
  if (segments[0].lapCount > 1) return null;

  return {
    code: "NOT_MEANINGFUL",
    message: "A route composition needs at least two segments, or one segment repeated more than once",
  };
};

/**
 * The cheap recipe checks: the shape of the recipe and whether it means
 * anything. Both are pure, so a caller can refuse a malformed recipe before
 * it reads the children or spends any work on the geometry.
 */
export const validateRouteCompositionRecipe = (segments: RouteCompositionSegmentInput[]): RouteRecipeIssue | null => {
  const shapeIssue = validateRouteCompositionSegments(segments);

  if (shapeIssue) return shapeIssue;

  return validateRouteCompositionMeaning(segments);
};

/**
 * Build the parent's point list from its ordered segments.
 *
 * Each segment contributes its full-precision points, repeated `lapCount`
 * times. A repeated segment must be a closed loop within the loop-closure
 * tolerance; repeating an open line would draw a straight connector between
 * laps and count it as distance. A closed loop loses its duplicate closing
 * point before the repeat. Consecutive segments must meet inside the
 * continuity tolerance, because the parent is materialized as one polyline —
 * a larger gap would draw a straight connector and inflate the parsed
 * distance.
 */
export const buildRouteCompositionPoints = (segments: RouteCompositionSegment[]): RouteCompositionPlan => {
  const shapeIssue = validateRouteCompositionSegments(segments);

  if (shapeIssue) return { ok: false, issue: shapeIssue };

  const points: RouteCompositionPoint[] = [];
  let droppedClosingPoints = 0;

  for (const segment of segments) {
    if (segment.points.length < 2) {
      return {
        ok: false,
        issue: {
          code: "NOT_ENOUGH_POINTS",
          message: "A route used as a segment needs at least two points",
        },
      };
    }

    const first = segment.points[0];
    const last = segment.points[segment.points.length - 1];
    const closesLoop = distanceMeters(first, last) <= ROUTE_COMPOSITION_LOOP_CLOSURE_TOLERANCE_METERS;
    const isClosedLoop = segment.lapCount > 1 && closesLoop;

    // A repeated segment has to be a loop. Repeating an open line would draw a
    // straight connector from its end back to its start on every lap, and the
    // parsed distance would count that connector as distance walked.
    if (segment.lapCount > 1 && !closesLoop) {
      return {
        ok: false,
        issue: {
          code: "OPEN_LAP",
          message: "A repeated segment must be a closed loop",
        },
      };
    }

    if (points.length > 0) {
      const gap = distanceMeters(points[points.length - 1], first);

      if (gap > ROUTE_COMPOSITION_CONTINUITY_TOLERANCE_METERS) {
        return {
          ok: false,
          issue: {
            code: "GAP",
            message: `Segments do not meet: the next segment starts ${formatMeters(gap)} away`,
          },
        };
      }
    }

    for (let lap = 0; lap < segment.lapCount; lap += 1) {
      // Drop the duplicate closing point only at a lap seam; the last lap
      // keeps it, so the loop still closes.
      if (isClosedLoop && lap < segment.lapCount - 1) {
        points.push(...segment.points.slice(0, -1));
        droppedClosingPoints += 1;
      } else {
        points.push(...segment.points);
      }
    }
  }

  return { ok: true, points, droppedClosingPoints };
};
