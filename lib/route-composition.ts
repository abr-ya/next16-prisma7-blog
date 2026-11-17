// feature-152: the wording-independent parts of a composite route.
//
// A composition is a recipe — ordered child routes, a role and a lap count —
// and the parent's geometry is materialized from the children's full points.
// This module owns the geometry plan only: it takes the validated recipe and
// the child points, and returns the single point list that becomes the
// parent's synthetic GPX. Ownership, nesting and storage belong to the data
// layer, so the plan stays testable without Prisma or upload calls.

/** A gap larger than this between consecutive segments is refused. */
export const ROUTE_COMPOSITION_CONTINUITY_TOLERANCE_METERS = 25;

/**
 * A loop whose first and last point sit this close is treated as closed: the
 * duplicate closing point is dropped before the lap is repeated, so the seam
 * adds no zero-length section.
 */
export const ROUTE_COMPOSITION_LOOP_CLOSURE_TOLERANCE_METERS = 25;

/** The only role this slice can author; start/end segments ship separately. */
export const AUTHORABLE_ROUTE_SEGMENT_ROLE = "MAIN" as const;

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

export type RouteCompositionPlanIssue = {
  code: "NO_SEGMENTS" | "ORDER" | "DUPLICATE_ORDER" | "NON_MAIN_ROLE" | "LAP_COUNT" | "NOT_ENOUGH_POINTS" | "GAP";
  message: string;
};

export type RouteCompositionPlan =
  | { ok: true; points: RouteCompositionPoint[]; droppedClosingPoints: number }
  | { ok: false; issue: RouteCompositionPlanIssue };

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
 * Validate the shape of a recipe before any geometry or storage work. A
 * recipe is ordered, non-empty, MAIN-only and carries a positive lap count.
 */
export const validateRouteCompositionSegments = (
  segments: RouteCompositionSegmentInput[],
): RouteCompositionPlanIssue | null => {
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

    if (segment.role !== AUTHORABLE_ROUTE_SEGMENT_ROLE) {
      return {
        code: "NON_MAIN_ROLE",
        message: "Only the main segment role is supported yet",
      };
    }

    if (!Number.isInteger(segment.lapCount) || segment.lapCount < 1) {
      return { code: "LAP_COUNT", message: "A segment lap count must be a positive whole number" };
    }
  }

  return null;
};

/**
 * Build the parent's point list from its ordered segments.
 *
 * Each segment contributes its full-precision points, repeated `lapCount`
 * times. A closed loop loses its duplicate closing point before the repeat.
 * Consecutive segments must meet inside the continuity tolerance, because the
 * parent is materialized as one polyline — a larger gap would draw a straight
 * connector and inflate the parsed distance.
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
    const isClosedLoop =
      segment.lapCount > 1 && distanceMeters(first, last) <= ROUTE_COMPOSITION_LOOP_CLOSURE_TOLERANCE_METERS;

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
