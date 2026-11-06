"use server";

import { revalidatePath } from "next/cache";

import type { FileAssetStatus, FileAssetVisibility } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { InsufficientTrustError, requireTrustGatedAction } from "@/lib/auth-trust-gates.server";
import { AuthorizationError } from "@/lib/auth-utils";
import { authSession } from "@/lib/auth-utils";
import { validateGpxString } from "@/lib/gpx-validation";
import { buildTrackGpxMetadata, fetchTrackGpxContent } from "@/lib/track-gpx-file";
import {
  buildEditedTrackGpxFileName,
  buildRemovalMask,
  buildTrackPointEditorView,
  MIN_RETAINED_POINTS,
  removePointsFromGpx,
  type TrackPointEditorPoint,
  type TrackPointSelection,
} from "@/lib/track-gpx-edit";
import type { TrackGpxBounds } from "@/lib/track-gpx-metadata";
import { parseGpxEditablePoints } from "@/lib/track-gpx-parser";
import { revalidateTrackPaths } from "@/lib/track-revalidation";
import { uploadSyntheticTrackGpx } from "@/lib/uploadthing/server-gpx";

const TRACK_GPX_MIME_TYPE = "application/gpx+xml";
const ACTIVE_FILE_STATUS: FileAssetStatus = "ACTIVE";

export type TrackPointCleanupData = {
  trackId: string;
  title: string;
  /** The file the modal loaded; the save rejects when the track has moved on. */
  fileAssetId: string;
  totalPoints: number;
  hasTimeline: boolean;
  distanceMeters: number;
  points: TrackPointEditorPoint[];
  bounds: TrackGpxBounds;
};

export type TrackPointCleanupLoadResult =
  | { ok: true; data: TrackPointCleanupData }
  | {
      ok: false;
      code: "NOT_FOUND" | "NOT_EDITABLE" | "UNAUTHORIZED" | "VALIDATION" | "INTERNAL";
      message: string;
    };

export type TrackPointCleanupSaveResult =
  | { ok: true; totalPoints: number; removedCount: number }
  | {
      ok: false;
      code: "NOT_FOUND" | "NOT_EDITABLE" | "VALIDATION" | "STALE" | "TRUST" | "UNAUTHORIZED" | "INTERNAL";
      message: string;
    };

class StaleTrackFileError extends Error {}

const requiresOwnedGpx = (track: {
  routeId: string | null;
  fileAsset: { purpose: string; status: FileAssetStatus; url: string; visibility: FileAssetVisibility } | null;
}) =>
  !track.routeId &&
  track.fileAsset !== null &&
  track.fileAsset.purpose === "TRACK_GPX" &&
  track.fileAsset.status === ACTIVE_FILE_STATUS;

export const getTrackPointCleanupData = async (trackId: string): Promise<TrackPointCleanupLoadResult> => {
  const normalizedId = trackId?.trim() ?? "";

  if (!normalizedId) return { ok: false, code: "NOT_FOUND", message: "Track not found" };

  const session = await authSession();

  if (!session) return { ok: false, code: "UNAUTHORIZED", message: "Sign in to edit track points" };

  try {
    const { default: prisma } = await import("@/lib/prisma");
    const track = await prisma.track.findFirst({
      where: { id: normalizedId, userId: session.user.id },
      select: {
        id: true,
        title: true,
        routeId: true,
        fileAsset: { select: { id: true, purpose: true, status: true, url: true, visibility: true } },
      },
    });

    if (!track) return { ok: false, code: "NOT_FOUND", message: "Track not found" };
    if (!requiresOwnedGpx(track)) {
      return {
        ok: false,
        code: "NOT_EDITABLE",
        message: "This track uses a route's geometry and cannot be cleaned up here",
      };
    }

    const content = await fetchTrackGpxContent(track.fileAsset!.url);
    const points = parseGpxEditablePoints(content);

    if (points.length < MIN_RETAINED_POINTS) {
      return { ok: false, code: "VALIDATION", message: "This track has too few points to clean up" };
    }

    const view = buildTrackPointEditorView(points);

    return {
      ok: true,
      data: {
        trackId: track.id,
        title: track.title,
        fileAssetId: track.fileAsset!.id,
        ...view,
      },
    };
  } catch (error) {
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not load track points",
    };
  }
};

export const cleanTrackPoints = async (input: {
  trackId: string;
  fileAssetId: string;
  selection: TrackPointSelection;
}): Promise<TrackPointCleanupSaveResult> => {
  const trackId = input.trackId?.trim() ?? "";
  const fileAssetId = input.fileAssetId?.trim() ?? "";

  if (!trackId || !fileAssetId) return { ok: false, code: "NOT_FOUND", message: "Track not found" };

  try {
    const user = await requireTrustGatedAction("track-upload");
    const { default: prisma } = await import("@/lib/prisma");
    const track = await prisma.track.findFirst({
      where: { id: trackId, userId: user.id },
      select: {
        id: true,
        title: true,
        slug: true,
        routeId: true,
        fileAssetId: true,
        recordingTimezone: true,
        fileAsset: {
          select: { id: true, name: true, purpose: true, status: true, url: true, visibility: true },
        },
      },
    });

    if (!track) return { ok: false, code: "NOT_FOUND", message: "Track not found" };
    if (!requiresOwnedGpx(track)) {
      return {
        ok: false,
        code: "NOT_EDITABLE",
        message: "This track uses a route's geometry and cannot be cleaned up here",
      };
    }
    if (track.fileAssetId !== fileAssetId) {
      return { ok: false, code: "STALE", message: "The track file changed. Reload the track and try again." };
    }

    const content = await fetchTrackGpxContent(track.fileAsset!.url);
    const points = parseGpxEditablePoints(content);
    const removal = buildRemovalMask(points, input.selection);

    if (!removal || removal.removedCount === 0) {
      return { ok: false, code: "VALIDATION", message: "Select at least one point to remove" };
    }
    if (points.length - removal.removedCount < MIN_RETAINED_POINTS) {
      return { ok: false, code: "VALIDATION", message: "At least two points must remain" };
    }

    const rewritten = removePointsFromGpx(content, points, removal.mask);
    const validation = validateGpxString(rewritten);

    if (!validation.ok) {
      return { ok: false, code: "VALIDATION", message: "The cleaned GPX is not valid" };
    }

    const upload = await uploadSyntheticTrackGpx({
      bytes: rewritten,
      ownerUserId: user.id,
      filename: buildEditedTrackGpxFileName(track.fileAsset!.name, new Date(), track.recordingTimezone),
    });

    let totalPoints = points.length - removal.removedCount;

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const current = await tx.track.findFirst({
        where: { id: track.id, userId: user.id },
        select: { fileAssetId: true },
      });

      if (!current || current.fileAssetId !== fileAssetId) throw new StaleTrackFileError();

      const fileAsset = await tx.fileAsset.create({
        data: {
          provider: "UPLOADTHING",
          fileKey: upload.key,
          customId: null,
          url: upload.url,
          name: upload.name,
          mimeType: TRACK_GPX_MIME_TYPE,
          sizeBytes: upload.sizeBytes,
          purpose: "TRACK_GPX",
          visibility: track.fileAsset!.visibility,
          status: ACTIVE_FILE_STATUS,
          ownerUserId: user.id,
        },
        select: { id: true },
      });

      const metadata = buildTrackGpxMetadata({
        content: rewritten,
        fileAssetId: fileAsset.id,
        fileKey: upload.key,
      });

      totalPoints = metadata.gpxParse.status === "SUCCESS" ? metadata.summary!.points.source : totalPoints;

      await tx.track.update({
        where: { id: track.id },
        data: { fileAssetId: fileAsset.id, metadata: metadata as Prisma.InputJsonValue },
      });

      await tx.fileAsset.updateMany({
        where: { id: fileAssetId, status: ACTIVE_FILE_STATUS },
        data: { status: "PENDING_DELETE", deletedAt: new Date() },
      });
    });

    revalidateTrackPaths();
    revalidatePath(`/tracks/${track.slug}`);

    return { ok: true, totalPoints, removedCount: removal.removedCount };
  } catch (error) {
    if (error instanceof StaleTrackFileError) {
      return { ok: false, code: "STALE", message: "The track file changed. Reload the track and try again." };
    }
    if (error instanceof InsufficientTrustError) {
      return { ok: false, code: "TRUST", message: error.message };
    }
    if (error instanceof AuthorizationError) {
      return { ok: false, code: "UNAUTHORIZED", message: error.message };
    }

    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not clean up track points",
    };
  }
};
