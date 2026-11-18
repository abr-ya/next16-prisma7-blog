import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { RouteSegmentRole } from "@/generated/prisma/enums";
import { requireTrustGatedAction } from "@/lib/auth-trust-gates.server";
import { validateGpxString } from "@/lib/gpx-validation";
import prisma from "@/lib/prisma";
import {
  AUTHORABLE_ROUTE_SEGMENT_ROLE,
  buildRouteCompositionPoints,
  validateRouteCompositionRecipe,
  type RouteCompositionPoint,
  type RouteCompositionSegmentInput,
} from "@/lib/route-composition";
import { revalidateRoutePaths } from "@/lib/route-revalidation";
import { ROUTE_TITLE_MAX_LENGTH } from "@/lib/route-title";
import { validateRouteTitle } from "@/lib/route-title";
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
//
// feature-153: the create path shares the preparation and the materialization
// with the replace path, so a recipe cannot be stored one way and built
// another. The preparation knows nothing about a parent; the checks that do —
// the parent cannot be its own segment, the shared confirmation — stay with
// the caller.

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

export type CreateRouteCompositionResult =
  | { ok: true; routeId: string; pointCount: number }
  | { ok: false; code: "VALIDATION" | "INTERNAL"; message: string };

export type RouteCompositionPropagationResult = {
  rebuilt: number;
  failed: number;
};

/**
 * The raw segment a caller may hand over. The ids and the role may be
 * missing: the core normalizes them, so no caller can smuggle a padded id
 * past a check that compares it with a route id.
 */
export type RouteCompositionSegmentRequest = {
  childRouteId?: string | null;
  role?: string | null;
  sortOrder: number;
  lapCount: number;
};

/** A segment as it is written to the database. */
type CompositionSegmentRow = {
  childRouteId: string;
  role: RouteSegmentRole;
  sortOrder: number;
  lapCount: number;
};

type StoredSegment = CompositionSegmentRow & {
  title: string;
  childRoute: { fileAsset: { url: string } };
};

/** A child route whose GPX file could not be read from storage. */
class UnreadableChildRouteError extends Error {
  constructor(readonly routeTitle: string) {
    super(`"${routeTitle}" could not be read from storage`);
    this.name = "UnreadableChildRouteError";
  }
}

const normalizeSegmentInputs = (segments: RouteCompositionSegmentRequest[]): RouteCompositionSegmentInput[] =>
  segments.map((segment) => ({
    childRouteId: segment.childRouteId?.trim() ?? "",
    role: segment.role?.trim() || AUTHORABLE_ROUTE_SEGMENT_ROLE,
    sortOrder: segment.sortOrder,
    lapCount: segment.lapCount,
  }));

const normalizeSegments = (segments: RouteCompositionSegmentInput[]) =>
  [...segments].sort((first, second) => first.sortOrder - second.sortOrder);

const readChildPoints = async (url: string): Promise<RouteCompositionPoint[]> => {
  const content = await fetchTrackGpxContent(url);

  return parseGpxEditablePoints(content).map((point) => ({ lat: point.lat, lng: point.lng }));
};

const planPoints = async (segments: StoredSegment[]) => {
  const withPoints: Array<StoredSegment & { points: RouteCompositionPoint[] }> = [];

  for (const segment of segments) {
    let points: RouteCompositionPoint[];

    try {
      points = await readChildPoints(segment.childRoute.fileAsset.url);
    } catch {
      throw new UnreadableChildRouteError(segment.title);
    }

    withPoints.push({ ...segment, points });
  }

  return buildRouteCompositionPoints(withPoints);
};

/**
 * The heavy preparation of a recipe: load the children with the owner scope,
 * refuse a foreign or nested child, read the children's full points and plan
 * the concatenated geometry.
 *
 * The step knows nothing about a parent, so the create path can run it before
 * the parent route exists. It runs after the cheap recipe checks and after
 * the shared confirmation, so the children are read once per save and not
 * once per refusal.
 */
const prepareComposition = async ({
  userId,
  segments,
}: {
  userId: string;
  segments: RouteCompositionSegmentInput[];
}): Promise<
  | { ok: true; prepared: { segments: CompositionSegmentRow[]; points: RouteCompositionPoint[] } }
  | { ok: false; message: string }
> => {
  const ordered = normalizeSegments(segments);
  const childIds = [...new Set(ordered.map((segment) => segment.childRouteId))];

  const children = (await prisma.route.findMany({
    where: { id: { in: childIds }, userId },
    select: {
      id: true,
      title: true,
      composition: { select: { id: true } },
      fileAsset: { select: { url: true } },
    },
  })) as Array<{
    id: string;
    title: string;
    composition: { id: string } | null;
    fileAsset: { url: string };
  }>;

  if (children.length !== childIds.length) {
    return { ok: false, message: "One of the selected routes is not available" };
  }

  if (children.some((child) => child.composition)) {
    return { ok: false, message: "A route that is already a composition cannot be a segment" };
  }

  const childrenById = new Map(children.map((child) => [child.id, child]));

  const storedSegments: StoredSegment[] = ordered.map((segment) => {
    const child = childrenById.get(segment.childRouteId);

    if (!child) {
      // The length check above already refused a missing child; this is the
      // backstop that keeps a broken lookup from reading an empty file url.
      throw new Error("A selected route is not available");
    }

    return {
      childRouteId: segment.childRouteId,
      title: child.title,
      role: AUTHORABLE_ROUTE_SEGMENT_ROLE,
      sortOrder: segment.sortOrder,
      lapCount: segment.lapCount,
      childRoute: { fileAsset: { url: child.fileAsset.url } },
    };
  });

  let plan: Awaited<ReturnType<typeof planPoints>>;

  try {
    plan = await planPoints(storedSegments);
  } catch (error) {
    // A child whose file cannot be read makes this recipe unusable, which the
    // owner can act on — it is a refusal of the recipe, not a server fault.
    if (error instanceof UnreadableChildRouteError) {
      return { ok: false, message: error.message };
    }

    throw error;
  }

  if (!plan.ok) {
    return { ok: false, message: plan.issue.message };
  }

  return {
    ok: true,
    prepared: {
      segments: storedSegments.map((segment) => ({
        childRouteId: segment.childRouteId,
        role: segment.role,
        sortOrder: segment.sortOrder,
        lapCount: segment.lapCount,
      })),
      points: plan.points,
    },
  };
};

/**
 * Build the parent's synthetic GPX from the planned points and upload it.
 *
 * The upload happens before the transaction, the way `createRouteFromPoints`
 * and `updateRoute` do it: a failed transaction leaves the uploaded object
 * behind, which the file cleanup job picks up later.
 */
const buildAndUploadCompositionFile = async ({
  title,
  userId,
  points,
}: {
  title: string;
  userId: string;
  points: RouteCompositionPoint[];
}) => {
  const gpxBytes = buildSyntheticGpxBytes(title, points);
  const gpxValidation = validateGpxString(gpxBytes);

  if (!gpxValidation.ok) {
    throw new Error("The route composition could not be turned into a GPX line");
  }

  const uploadResult = await uploadSyntheticTrackGpx({
    bytes: gpxBytes,
    ownerUserId: userId,
    filename: `${createSlug(title) || "route"}.gpx`,
  });

  return { gpxBytes, uploadResult };
};

type MaterializeCompositionInput =
  | {
      mode: "create";
      userId: string;
      title: string;
      description?: string | null;
      points: RouteCompositionPoint[];
      segments: CompositionSegmentRow[];
    }
  | {
      mode: "existing";
      parent: { id: string; title: string; fileAssetId: string; userId: string };
      points: RouteCompositionPoint[];
      /** Omitted by a rebuild: the stored segments stay as they are. */
      segments?: CompositionSegmentRow[];
    };

/**
 * Materialize a composition's geometry.
 *
 * The create branch writes the parent route, its composition and its segments;
 * the existing branch repoints a parent that is already there and retires the
 * file it used. Both share the upload, the file row, the parsed metadata and
 * the revalidation, so a created parent and a replaced one cannot differ in
 * how they are built.
 */
const materializeComposition = async (input: MaterializeCompositionInput): Promise<string> => {
  const title = input.mode === "create" ? input.title : input.parent.title;
  const userId = input.mode === "create" ? input.userId : input.parent.userId;
  const { gpxBytes, uploadResult } = await buildAndUploadCompositionFile({ title, userId, points: input.points });

  const routeId = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
        ownerUserId: userId,
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

    if (input.mode === "create") {
      const created = await tx.route.create({
        data: {
          title: input.title,
          description: input.description?.trim() || null,
          fileAssetId: fileAsset.id,
          userId: input.userId,
          metadata: metadata as Prisma.InputJsonValue,
        },
        select: { id: true },
      });

      const composition = await tx.routeComposition.create({
        data: { routeId: created.id },
        select: { id: true },
      });

      await tx.routeSegment.createMany({
        data: input.segments.map((segment) => ({
          compositionId: composition.id,
          childRouteId: segment.childRouteId,
          role: segment.role,
          sortOrder: segment.sortOrder,
          lapCount: segment.lapCount,
        })),
      });

      return created.id;
    }

    const parent = input.parent;

    const composition = await tx.routeComposition.upsert({
      where: { routeId: parent.id },
      create: { routeId: parent.id },
      update: { staleAt: null },
      select: { id: true },
    });

    if (input.segments) {
      await tx.routeSegment.deleteMany({ where: { compositionId: composition.id } });
      await tx.routeSegment.createMany({
        data: input.segments.map((segment) => ({
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

    return parent.id;
  });

  revalidateRoutePaths();
  revalidateTrackPaths();

  return routeId;
};

/**
 * Store a recipe on a route and materialize its geometry. The builder calls
 * it to edit a stored composition.
 *
 * The order of the checks is the product decision of `feature-153`: the cheap
 * recipe checks run first, then the shared confirmation, then the children are
 * read and planned. The owner confirms a well-formed recipe, and the children
 * are read once per save instead of once per refusal.
 */
export const saveRouteCompositionForOwner = async ({
  routeId,
  userId,
  segments,
  confirmShared,
}: {
  routeId: string;
  userId: string;
  segments: RouteCompositionSegmentRequest[];
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

  const recipe = normalizeSegmentInputs(segments);

  if (recipe.some((segment) => segment.childRouteId === parent.id)) {
    return { ok: false, code: "VALIDATION", message: "A route cannot use itself as a segment" };
  }

  // The cheap recipe checks — the shape and whether the recipe means
  // anything — need no database work, so a malformed recipe is refused before
  // the owner is asked to confirm anything.
  const recipeIssue = validateRouteCompositionRecipe(recipe);

  if (recipeIssue) {
    return { ok: false, code: "VALIDATION", message: recipeIssue.message };
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

  try {
    const prepared = await prepareComposition({ userId, segments: recipe });

    if (!prepared.ok) {
      return { ok: false, code: "VALIDATION", message: prepared.message };
    }

    await materializeComposition({
      mode: "existing",
      parent,
      points: prepared.prepared.points,
      segments: prepared.prepared.segments,
    });

    return { ok: true, routeId: parent.id, pointCount: prepared.prepared.points.length };
  } catch (error) {
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not save the route composition",
    };
  }
};

/**
 * Create a parent route from a recipe: the generated geometry, the route, its
 * composition and its segments in one flow.
 */
export const createRouteCompositionForOwner = async ({
  userId,
  title,
  description,
  segments,
}: {
  userId: string;
  title: string;
  description?: string | null;
  segments: RouteCompositionSegmentRequest[];
}): Promise<CreateRouteCompositionResult> => {
  const titleIssue = validateRouteTitle(title);

  if (titleIssue) {
    return { ok: false, code: "VALIDATION", message: titleIssue };
  }

  const recipe = normalizeSegmentInputs(segments);
  const recipeIssue = validateRouteCompositionRecipe(recipe);

  if (recipeIssue) {
    return { ok: false, code: "VALIDATION", message: recipeIssue.message };
  }

  try {
    const prepared = await prepareComposition({ userId, segments: recipe });

    if (!prepared.ok) {
      return { ok: false, code: "VALIDATION", message: prepared.message };
    }

    const routeId = await materializeComposition({
      mode: "create",
      userId,
      title: title.trim(),
      description,
      points: prepared.prepared.points,
      segments: prepared.prepared.segments,
    });

    return { ok: true, routeId, pointCount: prepared.prepared.points.length };
  } catch (error) {
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not create the route composition",
    };
  }
};

/**
 * Rebuild a composition from its stored recipe. Used by the **Rebuild route**
 * action and by child-edit propagation.
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
              childRoute: { select: { title: true, fileAsset: { select: { url: true } } } },
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

    await materializeComposition({ mode: "existing", parent, points: plan.points });

    return { ok: true, pointCount: plan.points.length };
  } catch (error) {
    // A child whose file cannot be read makes the recipe unusable, which the
    // owner can act on — it is a refusal of the recipe, not a server fault.
    if (error instanceof UnreadableChildRouteError) {
      return { ok: false, code: "VALIDATION", message: error.message };
    }

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

export type ResolveLapVariantResult = { ok: true; routeId: string; created: boolean } | { ok: false; message: string };

/**
 * feature-154: turn "this loop, that many laps" into a route the workout can
 * point at.
 *
 * One lap means the chosen route itself, so no route row is created. More than
 * one lap means a lap variant: a composite route with one `MAIN` segment. An
 * identical variant already owned by the caller is reused, so the same loop at
 * the same lap count never produces a second copy.
 */
export const resolveLapVariantRoute = async ({
  userId,
  routeId,
  lapCount,
}: {
  userId: string;
  routeId: string;
  lapCount?: number | null;
}): Promise<ResolveLapVariantResult> => {
  const laps = lapCount ?? 1;

  if (!Number.isInteger(laps) || laps < 1) {
    return { ok: false, message: "Lap count must be a whole number of at least one" };
  }

  if (laps === 1) {
    return { ok: true, routeId, created: false };
  }

  const child = (await prisma.route.findFirst({
    where: { id: routeId, userId },
    select: { id: true, title: true },
  })) as { id: string; title: string } | null;

  if (!child) {
    return { ok: false, message: "Selected route is not available" };
  }

  const candidates = (await prisma.route.findMany({
    where: {
      userId,
      isPart: false,
      composition: {
        is: {
          segments: { some: { childRouteId: routeId, role: "MAIN", lapCount: laps } },
        },
      },
    },
    select: {
      id: true,
      composition: {
        select: {
          segments: { select: { childRouteId: true, role: true, lapCount: true } },
        },
      },
    },
  })) as Array<{
    id: string;
    composition: {
      segments: Array<{ childRouteId: string; role: RouteSegmentRole; lapCount: number }>;
    } | null;
  }>;

  const existing = candidates.find((candidate) => candidate.composition?.segments.length === 1);

  if (existing) {
    return { ok: true, routeId: existing.id, created: false };
  }

  // A variant uploads a generated GPX, so it follows the same gate as any
  // other geometry write.
  await requireTrustGatedAction("track-upload");

  const suffix = ` × ${laps}`;
  const maxBaseLength = Math.max(1, ROUTE_TITLE_MAX_LENGTH - suffix.length);
  const baseTitle = child.title.length > maxBaseLength ? child.title.slice(0, maxBaseLength).trim() : child.title;
  const title = `${baseTitle}${suffix}`;

  const created = await createRouteCompositionForOwner({
    userId,
    title,
    description: null,
    segments: [{ childRouteId: routeId, role: AUTHORABLE_ROUTE_SEGMENT_ROLE, sortOrder: 0, lapCount: laps }],
  });

  if (!created.ok) {
    return { ok: false, message: created.message };
  }

  return { ok: true, routeId: created.routeId, created: true };
};
