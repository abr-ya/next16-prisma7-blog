"use server";

import { revalidatePath } from "next/cache";

import { Prisma } from "@/generated/prisma/client";
import { InsufficientTrustError, requireTrustGatedAction } from "@/lib/auth-trust-gates.server";
import { authSession } from "@/lib/auth-utils";
import { validateGpxString } from "@/lib/gpx-validation";
import { createSlug } from "@/lib/slug-generator";
import { buildTrackGpxMetadata, fetchTrackGpxContent } from "@/lib/track-gpx-file";
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

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
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

    revalidatePath("/my/routes");

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
