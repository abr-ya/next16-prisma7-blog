"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { InsufficientTrustError, requireTrustGatedAction } from "@/lib/auth-trust-gates.server";
import { authSession } from "@/lib/auth-utils";
import { validateGpxString } from "@/lib/gpx-validation";
import { createSlug } from "@/lib/slug-generator";
import { buildTrackGpxMetadata, fetchTrackGpxContent } from "@/lib/track-gpx-file";
import { toTrackMapViewModel, type TrackMapViewModel } from "@/lib/track-gpx-metadata";
import { revalidateTrackPaths } from "@/lib/track-revalidation";
import { buildSyntheticGpxBytes } from "@/lib/track-synthetic-gpx";
import { uploadSyntheticTrackGpx } from "@/lib/uploadthing/server-gpx";

const ACTIVE_FILE_STATUS = "ACTIVE";
const TRACK_GPX_MIME_TYPE = "application/gpx+xml";

export type RoutePoint = { lat: number; lng: number };

export type CreateRouteInput = {
  title: string;
  description?: string | null;
  points: RoutePoint[];
};

export type CreateRouteResult =
  | { ok: true; routeId: string }
  | { ok: false; code: "TRUST" | "VALIDATION" | "INTERNAL"; message: string };

export type RouteListItem = {
  id: string;
  title: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  trackCount: number;
  hasMetadata: boolean;
};

export type RouteDetail = RouteListItem & {
  points: { lat: number; lng: number }[];
};

export type UpdateRouteInput = {
  routeId: string;
  /** Leave undefined to keep the stored title. */
  title?: string;
  /** Leave undefined to keep the stored description; `null` clears it. */
  description?: string | null;
  /** Provide the full new point list to rewrite the route geometry. */
  points?: RoutePoint[];
  /** Required when the route is linked to more than one track. */
  confirmShared?: boolean;
};

export type UpdateRouteResult =
  | { ok: true; routeId: string; linkedTrackCount: number }
  | {
      ok: false;
      code: "TRUST" | "VALIDATION" | "NOT_FOUND" | "SHARED_CONFIRMATION" | "INTERNAL";
      message: string;
      linkedTrackCount?: number;
    };

export type DeleteRouteResult =
  | { ok: true; routeId: string }
  | { ok: false; code: "NOT_FOUND" | "IN_USE" | "INTERNAL"; message: string; linkedTrackCount?: number };

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
};

/**
 * feature-128: the surfaces that list the owner's routes. `/my/tracks` and
 * `/my/workouts` carry the track dialog's route picker, so a route rename,
 * geometry change, or deletion has to refresh them too.
 */
const revalidateRoutePaths = () => {
  revalidatePath("/my/routes");
  revalidatePath("/my/tracks");
  revalidatePath("/my/workouts");
};

const validatePoints = (points: RoutePoint[]) => {
  if (!Array.isArray(points) || points.length < 2) {
    return "Place at least two points on the map";
  }

  for (const point of points) {
    if (
      typeof point?.lat !== "number" ||
      typeof point?.lng !== "number" ||
      !Number.isFinite(point.lat) ||
      !Number.isFinite(point.lng) ||
      point.lat < -90 ||
      point.lat > 90 ||
      point.lng < -180 ||
      point.lng > 180
    ) {
      return "Placed points have invalid coordinates";
    }
  }

  return null;
};

/**
 * feature-127: create a route from points placed on the map. A route owns the
 * reusable geometry — the synthetic GPX file and its parsed metadata — and
 * stores no recording data. Tracks created from it read both through
 * `routeId`; see `resolveTrackGeometry`.
 */
export const createRouteFromPoints = async (input: CreateRouteInput): Promise<CreateRouteResult> => {
  try {
    const user = await requireTrustGatedAction("track-upload");
    const { default: prisma } = await import("@/lib/prisma");

    const title = input.title?.trim() ?? "";
    if (!title) {
      return { ok: false, code: "VALIDATION", message: "Route title is required" };
    }

    const pointsError = validatePoints(input.points);
    if (pointsError) {
      return { ok: false, code: "VALIDATION", message: pointsError };
    }

    const description = input.description?.trim() || null;
    const gpxBytes = buildSyntheticGpxBytes(title, input.points);
    const gpxValidation = validateGpxString(gpxBytes);
    if (!gpxValidation.ok) {
      return { ok: false, code: "VALIDATION", message: "Placed points could not be turned into a GPX route" };
    }

    const uploadResult = await uploadSyntheticTrackGpx({
      bytes: gpxBytes,
      ownerUserId: user.id,
      filename: `${createSlug(title) || "route"}.gpx`,
    });

    const route = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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
          ownerUserId: user.id,
        },
        select: { id: true },
      });

      const created = await tx.route.create({
        data: {
          title,
          description,
          fileAssetId: fileAsset.id,
          userId: user.id,
          metadata: Prisma.JsonNull,
        },
        select: { id: true, fileAssetId: true },
      });

      return { id: created.id, fileAssetId: created.fileAssetId as string };
    });

    // Parse outside the transaction so a failed parse leaves the route in the
    // "not parsed" state instead of rolling back the write.
    const content = await fetchTrackGpxContent(uploadResult.url).catch(() => "");
    const metadata = buildTrackGpxMetadata({
      content,
      fileAssetId: route.fileAssetId,
      fileKey: uploadResult.key,
    });

    await prisma.route.update({
      where: { id: route.id },
      data: { metadata: metadata as Prisma.InputJsonValue },
    });

    revalidateRoutePaths();

    return { ok: true, routeId: route.id };
  } catch (error) {
    if (error instanceof InsufficientTrustError) {
      return { ok: false, code: "TRUST", message: error.message };
    }

    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not create route",
    };
  }
};

export const getOwnerRoutes = async (): Promise<RouteListItem[]> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  const routes = (await prisma.route.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      metadata: true,
      _count: { select: { tracks: true } },
    },
  })) as Array<{
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    metadata: Prisma.JsonValue | null;
    _count: { tracks: number };
  }>;

  return routes.map((route) => ({
    id: route.id,
    title: route.title,
    description: route.description,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt,
    trackCount: route._count.tracks,
    hasMetadata: route.metadata !== null,
  }));
};

export const getRouteById = async (routeId: string): Promise<RouteDetail | null> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  const route = (await prisma.route.findFirst({
    where: { id: routeId, userId },
    select: {
      id: true,
      title: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      metadata: true,
      _count: { select: { tracks: true } },
    },
  })) as {
    id: string;
    title: string;
    description: string | null;
    createdAt: Date;
    updatedAt: Date;
    metadata: Prisma.JsonValue | null;
    _count: { tracks: number };
  } | null;

  if (!route) return null;

  return {
    id: route.id,
    title: route.title,
    description: route.description,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt,
    trackCount: route._count.tracks,
    hasMetadata: route.metadata !== null,
    points: readRoutePoints(route.metadata),
  };
};

const readRoutePoints = (metadata: Prisma.JsonValue | null): { lat: number; lng: number }[] => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];

  const geometry = (metadata as Record<string, unknown>).mapGeometry;

  if (!Array.isArray(geometry)) return [];

  return geometry.flatMap((point) => {
    if (!point || typeof point !== "object") return [];

    const { lat, lng } = point as { lat?: unknown; lng?: unknown };

    return typeof lat === "number" && typeof lng === "number" ? [{ lat, lng }] : [];
  });
};

/**
 * feature-128: the route's shape for the preview dialog, built from the same
 * metadata the track surfaces read. Passing the current file pair lets stale
 * metadata (a file that changed after the parse) report no preview instead of
 * a shape that no longer matches the stored file.
 */
export const getRoutePreview = async (routeId: string): Promise<TrackMapViewModel | null> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  const route = await prisma.route.findFirst({
    where: { id: routeId, userId },
    select: {
      title: true,
      metadata: true,
      fileAsset: { select: { id: true, fileKey: true } },
    },
  });

  if (!route) return null;

  return toTrackMapViewModel(route.title, route.metadata, {
    fileAssetId: route.fileAsset.id,
    fileKey: route.fileAsset.fileKey,
  });
};

/**
 * feature-128: rename, re-describe, and re-place a route's geometry.
 *
 * A route's shape lives in two places: the synthetic GPX `FileAsset` that
 * maps, downloads, and trip views read through `resolveTrackGeometry`, and the
 * parsed `metadata` that provides points, distance, and bounds. A geometry
 * edit therefore rebuilds both together — a metadata-only write would leave
 * the file showing the old shape.
 */
export const updateRoute = async (input: UpdateRouteInput): Promise<UpdateRouteResult> => {
  const routeId = input.routeId?.trim() ?? "";
  const hasPoints = input.points !== undefined;
  const nextTitle = input.title?.trim();

  if (!routeId) {
    return { ok: false, code: "VALIDATION", message: "Route id is required" };
  }

  if (nextTitle !== undefined && !nextTitle) {
    return { ok: false, code: "VALIDATION", message: "Route title is required" };
  }

  if (!hasPoints && nextTitle === undefined && input.description === undefined) {
    return { ok: false, code: "VALIDATION", message: "Nothing to update" };
  }

  try {
    // A geometry rewrite uploads a new GPX file, so it follows the same trust
    // gate as creating a route. Renaming or re-describing does not.
    const actor = hasPoints ? await requireTrustGatedAction("track-upload") : null;
    const userId = actor?.id ?? (await getRequiredUserId());

    const { default: prisma } = await import("@/lib/prisma");

    const existing = await prisma.route.findFirst({
      where: { id: routeId, userId },
      select: {
        id: true,
        title: true,
        fileAssetId: true,
        _count: { select: { tracks: true } },
      },
    });

    if (!existing) {
      return { ok: false, code: "NOT_FOUND", message: "Route not found" };
    }

    const linkedTrackCount = existing._count.tracks;
    const textData: Prisma.RouteUncheckedUpdateInput = {};

    if (nextTitle !== undefined) textData.title = nextTitle;
    if (input.description !== undefined) textData.description = input.description?.trim() || null;

    if (!hasPoints) {
      await prisma.route.update({ where: { id: existing.id }, data: textData });
      revalidateRoutePaths();

      return { ok: true, routeId: existing.id, linkedTrackCount };
    }

    if (linkedTrackCount > 1 && !input.confirmShared) {
      return {
        ok: false,
        code: "SHARED_CONFIRMATION",
        message: `This route is used by ${linkedTrackCount} tracks. Confirm that the new shape should replace it everywhere.`,
        linkedTrackCount,
      };
    }

    const points = input.points ?? [];
    const pointsError = validatePoints(points);

    if (pointsError) {
      return { ok: false, code: "VALIDATION", message: pointsError };
    }

    const effectiveTitle = nextTitle ?? existing.title;
    const gpxBytes = buildSyntheticGpxBytes(effectiveTitle, points);
    const gpxValidation = validateGpxString(gpxBytes);

    if (!gpxValidation.ok) {
      return { ok: false, code: "VALIDATION", message: "Placed points could not be turned into a GPX route" };
    }

    const uploadResult = await uploadSyntheticTrackGpx({
      bytes: gpxBytes,
      ownerUserId: userId,
      filename: `${createSlug(effectiveTitle) || "route"}.gpx`,
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
          ownerUserId: userId,
        },
        select: { id: true },
      });

      // The GPX was generated here, so parse the same bytes instead of
      // fetching the file back from storage.
      const metadata = buildTrackGpxMetadata({
        content: gpxBytes,
        fileAssetId: fileAsset.id,
        fileKey: uploadResult.key,
      });

      await tx.route.update({
        where: { id: existing.id },
        data: {
          ...textData,
          fileAssetId: fileAsset.id,
          metadata: metadata as Prisma.InputJsonValue,
        },
      });

      // The replaced file has no owner left. The project never hard-deletes
      // file rows; `PENDING_DELETE` is the same retirement `/admin/files` uses.
      await tx.fileAsset.updateMany({
        where: { id: existing.fileAssetId, status: ACTIVE_FILE_STATUS },
        data: { status: "PENDING_DELETE", deletedAt: new Date() },
      });
    });

    revalidateRoutePaths();
    revalidateTrackPaths();

    return { ok: true, routeId: existing.id, linkedTrackCount };
  } catch (error) {
    if (error instanceof InsufficientTrustError) {
      return { ok: false, code: "TRUST", message: error.message };
    }

    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not update route",
    };
  }
};

/**
 * feature-128: delete an unused route and retire its synthetic GPX file in one
 * transaction, so the owner either loses both rows or neither. A foreign-key
 * error never reaches the client as an exception — `onDelete: Restrict` stays
 * the database backstop, while the count check produces the readable refusal.
 */
export const deleteRoute = async (routeId: string): Promise<DeleteRouteResult> => {
  const normalizedId = routeId?.trim() ?? "";

  if (!normalizedId) {
    return { ok: false, code: "NOT_FOUND", message: "Route not found" };
  }

  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const existing = await prisma.route.findFirst({
      where: { id: normalizedId, userId },
      select: {
        id: true,
        fileAssetId: true,
        _count: { select: { tracks: true } },
      },
    });

    if (!existing) {
      return { ok: false, code: "NOT_FOUND", message: "Route not found" };
    }

    const linkedTrackCount = existing._count.tracks;

    if (linkedTrackCount > 0) {
      return {
        ok: false,
        code: "IN_USE",
        message: `This route is used by ${linkedTrackCount} track${linkedTrackCount === 1 ? "" : "s"} and cannot be deleted.`,
        linkedTrackCount,
      };
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.route.delete({ where: { id: existing.id } });
      await tx.fileAsset.updateMany({
        where: { id: existing.fileAssetId, status: ACTIVE_FILE_STATUS },
        data: { status: "PENDING_DELETE", deletedAt: new Date() },
      });
    });

    revalidateRoutePaths();

    return { ok: true, routeId: existing.id };
  } catch {
    return {
      ok: false,
      code: "INTERNAL",
      message: "Could not delete the route. Nothing was removed — please try again.",
    };
  }
};
