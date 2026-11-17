import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { RouteSegmentRole } from "@/generated/prisma/enums";
import { validateGpxString } from "@/lib/gpx-validation";
import prisma from "@/lib/prisma";
import {
  buildRouteCompositionPoints,
  validateRouteCompositionSegments,
  type RouteCompositionPoint,
  type RouteCompositionSegmentInput,
} from "@/lib/route-composition";
import { revalidateRoutePaths } from "@/lib/route-revalidation";
import { createSlug } from "@/lib/slug-generator";
import { buildTrackGpxMetadata, fetchTrackGpxContent } from "@/lib/track-gpx-file";
import { parseGpxEditablePoints } from "@/lib/track-gpx-parser";
import { revalidateTrackPaths } from "@/lib/track-revalidation";
import { buildSyntheticGpxBytes } from "@/lib/track-synthetic-gpx";
import { uploadSyntheticTrackGpx } from "@/lib/uploadthing/server-gpx";

// feature-152: the rebuild core of a composite route.
//
// This module is server-only rather than a `"use server"` action module: the
// caller has already resolved the actor, and `updateRoute` reuses the same
// core to propagate a child edit. Nothing here is reachable from a browser,
// so an internal `userId` parameter cannot be spoofed the way a server
// action's argument could.

const ACTIVE_FILE_STATUS = "ACTIVE";
const TRACK_GPX_MIME_TYPE = "application/gpx+xml";

export type SaveRouteCompositionResult =
  | { ok: true; routeId: string; pointCount: number }
  | {
      ok: false;
      code: "NOT_FOUND" | "VALIDATION" | "SHARED_CONFIRMATION" | "INTERNAL";
      message: string;
      linkedTrackCount?: number;
    };

export type RebuildRouteCompositionResult =
  | { ok: true; pointCount: number }
  | { ok: false; code: "NOT_FOUND" | "VALIDATION" | "INTERNAL"; message: string };

export type RouteCompositionPropagationResult = {
  rebuilt: number;
  failed: number;
};

type StoredSegment = {
  childRouteId: string;
  role: RouteSegmentRole;
  sortOrder: number;
  lapCount: number;
  childRoute: { fileAsset: { url: string } };
};

const normalizeSegments = (segments: RouteCompositionSegmentInput[]) =>
  [...segments].sort((first, second) => first.sortOrder - second.sortOrder);

const readChildPoints = async (url: string): Promise<RouteCompositionPoint[]> => {
  const content = await fetchTrackGpxContent(url);

  return parseGpxEditablePoints(content).map((point) => ({ lat: point.lat, lng: point.lng }));
};

const planPoints = async (segments: StoredSegment[]) => {
  const withPoints: Array<StoredSegment & { points: RouteCompositionPoint[] }> = [];

  for (const segment of segments) {
    const points = await readChildPoints(segment.childRoute.fileAsset.url);
    withPoints.push({ ...segment, points });
  }

  return buildRouteCompositionPoints(withPoints);
};

/**
 * Build the parent's synthetic GPX from the planned points, upload it, and
 * repoint the parent inside one transaction. The composition rows are written
 * in the same transaction when a full recipe is supplied; a rebuild only
 * clears the stale marker.
 */
const materializeRoute = async ({
  parent,
  points,
  segments,
}: {
  parent: { id: string; title: string; fileAssetId: string; userId: string };
  points: RouteCompositionPoint[];
  segments?: Array<RouteCompositionSegmentInput & { role: RouteSegmentRole }>;
}) => {
  const gpxBytes = buildSyntheticGpxBytes(parent.title, points);
  const gpxValidation = validateGpxString(gpxBytes);

  if (!gpxValidation.ok) {
    throw new Error("The route composition could not be turned into a GPX line");
  }

  const uploadResult = await uploadSyntheticTrackGpx({
    bytes: gpxBytes,
    ownerUserId: parent.userId,
    filename: `${createSlug(parent.title) || "route"}.gpx`,
  });

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const fileAsset = await tx.fileAsset.create({
      data: {
        provider: "UPLOADTHING",
        fileKey: uploadResult.key,
        customId: null,
        url: uploadResult.url,
        name: uploadResult.name,
        mimeType: TRACK_GPX_MIME_TYPE,
        sizeBytes: uploadResult.sizeBytes,
        purpose: "TRACK_GPX",
        visibility: "PRIVATE",
        status: ACTIVE_FILE_STATUS,
        ownerUserId: parent.userId,
      },
      select: { id: true },
    });

    // The GPX was generated here, so parse the same bytes instead of fetching
    // the file back from storage.
    const metadata = buildTrackGpxMetadata({
      content: gpxBytes,
      fileAssetId: fileAsset.id,
      fileKey: uploadResult.key,
    });

    const composition = await tx.routeComposition.upsert({
      where: { routeId: parent.id },
      create: { routeId: parent.id },
      update: { staleAt: null },
      select: { id: true },
    });

    if (segments) {
      await tx.routeSegment.deleteMany({ where: { compositionId: composition.id } });
      await tx.routeSegment.createMany({
        data: segments.map((segment) => ({
          compositionId: composition.id,
          childRouteId: segment.childRouteId,
          role: segment.role,
          sortOrder: segment.sortOrder,
          lapCount: segment.lapCount,
        })),
      });
    }

    await tx.route.update({
      where: { id: parent.id },
      data: {
        fileAssetId: fileAsset.id,
        metadata: metadata as Prisma.InputJsonValue,
      },
    });

    // The replaced file has no owner left. The project never hard-deletes
    // file rows; `PENDING_DELETE` is the same retirement the route edit and
    // `/admin/files` use.
    await tx.fileAsset.updateMany({
      where: { id: parent.fileAssetId, status: ACTIVE_FILE_STATUS },
      data: { status: "PENDING_DELETE", deletedAt: new Date() },
    });
  });

  revalidateRoutePaths();
  revalidateTrackPaths();

  return points.length;
};

/**
 * Store a recipe on a route and materialize its geometry. No UI calls this
 * yet; `outdoor-route-builder` does. The owner-gated action wrapper lives in
 * `app/_data/route-compositions.ts`.
 */
export const saveRouteCompositionForOwner = async ({
  routeId,
  userId,
  segments,
  confirmShared,
}: {
  routeId: string;
  userId: string;
  segments: RouteCompositionSegmentInput[];
  confirmShared?: boolean;
}): Promise<SaveRouteCompositionResult> => {
  const parent = await prisma.route.findFirst({
    where: { id: routeId, userId },
    select: {
      id: true,
      title: true,
      fileAssetId: true,
      userId: true,
      _count: { select: { tracks: true } },
    },
  });

  if (!parent) {
    return { ok: false, code: "NOT_FOUND", message: "Route not found" };
  }

  const shapeIssue = validateRouteCompositionSegments(segments);

  if (shapeIssue) {
    return { ok: false, code: "VALIDATION", message: shapeIssue.message };
  }

  const linkedTrackCount = parent._count.tracks;

  if (linkedTrackCount > 1 && !confirmShared) {
    return {
      ok: false,
      code: "SHARED_CONFIRMATION",
      message: `This route is used by ${linkedTrackCount} tracks. Confirm that the new shape should replace it everywhere.`,
      linkedTrackCount,
    };
  }

  const ordered = normalizeSegments(segments);
  const childIds = [...new Set(ordered.map((segment) => segment.childRouteId))];

  if (childIds.includes(parent.id)) {
    return { ok: false, code: "VALIDATION", message: "A route cannot use itself as a segment" };
  }

  const children = (await prisma.route.findMany({
    where: { id: { in: childIds }, userId },
    select: {
      id: true,
      composition: { select: { id: true } },
      fileAsset: { select: { url: true } },
    },
  })) as Array<{
    id: string;
    composition: { id: string } | null;
    fileAsset: { url: string };
  }>;

  if (children.length !== childIds.length) {
    return { ok: false, code: "VALIDATION", message: "One of the selected routes is not available" };
  }

  if (children.some((child) => child.composition)) {
    return { ok: false, code: "VALIDATION", message: "A route that is already a composition cannot be a segment" };
  }

  const childrenById = new Map(children.map((child) => [child.id, child]));

  const storedSegments: StoredSegment[] = ordered.map((segment) => {
    const child = childrenById.get(segment.childRouteId);

    return {
      childRouteId: segment.childRouteId,
      role: "MAIN",
      sortOrder: segment.sortOrder,
      lapCount: segment.lapCount,
      childRoute: { fileAsset: { url: child?.fileAsset.url ?? "" } },
    };
  });

  try {
    const plan = await planPoints(storedSegments);

    if (!plan.ok) {
      return { ok: false, code: "VALIDATION", message: plan.issue.message };
    }

    const pointCount = await materializeRoute({ parent, points: plan.points, segments: storedSegments });

    return { ok: true, routeId: parent.id, pointCount };
  } catch (error) {
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not save the route composition",
    };
  }
};

/**
 * Rebuild a composition from its stored recipe. Used by the future
 * **Rebuild route** action and by child-edit propagation.
 */
export const rebuildRouteCompositionForOwner = async ({
  routeId,
  userId,
}: {
  routeId: string;
  userId: string;
}): Promise<RebuildRouteCompositionResult> => {
  const parent = await prisma.route.findFirst({
    where: { id: routeId, userId },
    select: {
      id: true,
      title: true,
      fileAssetId: true,
      userId: true,
      composition: {
        select: {
          segments: {
            orderBy: { sortOrder: "asc" },
            select: {
              childRouteId: true,
              role: true,
              sortOrder: true,
              lapCount: true,
              childRoute: { select: { fileAsset: { select: { url: true } } } },
            },
          },
        },
      },
    },
  });

  if (!parent) {
    return { ok: false, code: "NOT_FOUND", message: "Route not found" };
  }

  if (!parent.composition || parent.composition.segments.length === 0) {
    return { ok: false, code: "NOT_FOUND", message: "This route has no composition" };
  }

  try {
    const plan = await planPoints(parent.composition.segments);

    if (!plan.ok) {
      return { ok: false, code: "VALIDATION", message: plan.issue.message };
    }

    const pointCount = await materializeRoute({ parent, points: plan.points });

    return { ok: true, pointCount };
  } catch (error) {
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not rebuild the route composition",
    };
  }
};

/**
 * Rebuild every composition that uses the edited route as a child. The child
 * change is already committed, so a failed parent keeps the last good
 * geometry and is marked stale instead of being rolled back.
 */
export const rebuildRouteCompositionsUsing = async ({
  childRouteId,
  userId,
}: {
  childRouteId: string;
  userId: string;
}): Promise<RouteCompositionPropagationResult> => {
  const parents = await prisma.routeComposition.findMany({
    where: { segments: { some: { childRouteId } }, route: { userId } },
    select: { routeId: true },
  });

  let rebuilt = 0;
  let failed = 0;

  for (const parent of parents) {
    const result = await rebuildRouteCompositionForOwner({ routeId: parent.routeId, userId });

    if (result.ok) {
      rebuilt += 1;
      continue;
    }

    failed += 1;

    await prisma.routeComposition
      .update({ where: { routeId: parent.routeId }, data: { staleAt: new Date() } })
      .catch(() => undefined);
  }

  return { rebuilt, failed };
};
