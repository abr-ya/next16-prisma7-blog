"use server";

import { revalidatePath } from "next/cache";

import type { FileAssetStatus, Prisma } from "@/generated/prisma/client";
import { requireTrustGatedAction, InsufficientTrustError } from "@/lib/auth-trust-gates.server";
import { assertVerifiedResourceQuota, reconcileVerifiedUserTrust } from "@/lib/auth-trust-quotas.server";
import { currentUserRole } from "@/lib/auth-utils";
import { hasAdminRole } from "@/lib/auth-roles";
import { normalizePhotoInput } from "@/lib/photos";
import { parsePhotoExifMetadata } from "@/lib/photo-exif-parser";
import {
  readPhotoExifMetadata,
  withPhotoCaptureTimeNormalization,
  withPhotoMapCoordinate,
  withoutPhotoCaptureTimeNormalization,
} from "@/lib/photo-exif-metadata";
import { canRefreshHikePhotoExif } from "@/lib/hike-photo-detail-policy";
import { derivePhotoCaptureInstantUtc } from "@/lib/photo-capture-timezone";
import { normalizeTrackRecordingTimezone } from "@/lib/track-recording-timezone";
import type { HikeNoteInput } from "@/lib/hike-notes";
import {
  ensureEligibleTrackFileAsset,
  ensureSlugAvailable,
  getTrackData,
  parseTrackGpx,
  type TrackActionValues,
} from "@/app/_data/tracks";

import { getPhotoDetailAccess, isAcceptedHikeParticipant } from "./queries";
import {
  expireHikeParticipantIfNeeded,
  getEligiblePublishedHikePhoto,
  getHikeData,
  getHikeParticipantManager,
  getRequiredAdminUserId,
  getRequiredUserId,
  normalizeHikeNote,
  normalizeHikePhotoPositions,
  persistHikePhotoMapCoordinateRejection,
  persistHikePhotoTrackTimeMatchCandidate,
  revalidateHikePaths,
  revalidateHikePhotoAssociationPaths,
  revalidateHikeTrackAssociationPaths,
} from "./internal";
import {
  type CreateTrackAndAttachToHikeInput,
  type CreateTrackAndAttachToHikeResult,
  type HikeActionValues,
  type HikePhotoContributionValues,
  type HikePhotoIdAssociation,
} from "./types";

const ACTIVE_FILE_STATUS: FileAssetStatus = "ACTIVE";

export const acceptHikePhotoTrackTimeMatchCandidate = async ({
  hikeId,
  photoId,
  candidateId,
  lat,
  lng,
}: {
  hikeId: string;
  photoId: string;
  candidateId: string;
  lat?: number | null;
  lng?: number | null;
}) => {
  const access = await getPhotoDetailAccess({ hikeId, photoId });
  if (!access?.canReviewCoordinate) throw new Error("You cannot review this photo coordinate");

  return persistHikePhotoTrackTimeMatchCandidate({
    hikeId,
    photoId,
    candidateId,
    lat,
    lng,
    reviewedByUserId: access.reviewedByUserId,
  });
};

export const rejectHikePhotoMapCoordinate = async ({ hikeId, photoId }: { hikeId: string; photoId: string }) => {
  const access = await getPhotoDetailAccess({ hikeId, photoId });
  if (!access?.canReviewCoordinate) throw new Error("You cannot review this photo coordinate");

  return persistHikePhotoMapCoordinateRejection({ hikeId, photoId, reviewedByUserId: access.reviewedByUserId });
};

export const confirmHikePhotoCaptureTimezone = async ({
  hikeId,
  photoId,
  timeZone,
}: {
  hikeId: string;
  photoId: string;
  timeZone: string;
}) => {
  const access = await getPhotoDetailAccess({ hikeId, photoId });
  if (!access?.canReviewCoordinate) throw new Error("You cannot confirm this photo timezone");

  const metadata = readPhotoExifMetadata(access.photo.metadata);
  const summary = metadata?.summary;
  if (
    !metadata ||
    !summary ||
    summary.captureTimeTimezoneEvidence !== "MISSING" ||
    !summary.captureTimeProvenance?.localWallTime
  ) {
    throw new Error("This photo does not have an unconfirmed camera-local capture time");
  }
  const normalizedTimezone = normalizeTrackRecordingTimezone(timeZone);
  const instantUtc = derivePhotoCaptureInstantUtc({
    localWallTime: summary.captureTimeProvenance.localWallTime,
    timeZone: normalizedTimezone,
  });
  if (!normalizedTimezone || !instantUtc) {
    throw new Error("Choose a valid IANA timezone with an unambiguous capture time");
  }

  let nextMetadata = withPhotoCaptureTimeNormalization(metadata, {
    timeZone: normalizedTimezone,
    provenance: "USER_CONFIRMED",
    instantUtc,
  });
  const priorCoordinate = nextMetadata.mapCoordinate;
  if (priorCoordinate?.source === "INFERRED_TRACK_TIME") {
    nextMetadata = withPhotoMapCoordinate(nextMetadata, {
      ...priorCoordinate,
      status: "PENDING_REVIEW",
      explanation: `${priorCoordinate.explanation ?? "Inferred coordinate"} Timezone changed; review this retained coordinate again.`,
      reviewedAt: null,
      reviewedByUserId: null,
    });
  }

  const { default: prisma } = await import("@/lib/prisma");
  await prisma.photo.update({ where: { id: photoId }, data: { metadata: nextMetadata as Prisma.InputJsonValue } });
  revalidateHikePhotoAssociationPaths(access.hike.slug);
  return { success: true, instantUtc };
};

export const clearHikePhotoCaptureTimezone = async ({ hikeId, photoId }: { hikeId: string; photoId: string }) => {
  const access = await getPhotoDetailAccess({ hikeId, photoId });
  if (!access?.canReviewCoordinate) throw new Error("You cannot clear this photo timezone");

  const metadata = readPhotoExifMetadata(access.photo.metadata);
  const summary = metadata?.summary;
  if (!metadata || !summary || !summary.captureTimeNormalization) {
    throw new Error("This photo has no capture-time normalization to reset");
  }

  let nextMetadata = withoutPhotoCaptureTimeNormalization(metadata);
  const priorCoordinate = nextMetadata.mapCoordinate;
  if (priorCoordinate?.source === "INFERRED_TRACK_TIME") {
    nextMetadata = withPhotoMapCoordinate(nextMetadata, {
      ...priorCoordinate,
      status: "PENDING_REVIEW",
      explanation: `${priorCoordinate.explanation ?? "Inferred coordinate"} Timezone reset; review this retained coordinate again.`,
      reviewedAt: null,
      reviewedByUserId: null,
    });
  }

  const { default: prisma } = await import("@/lib/prisma");
  await prisma.photo.update({ where: { id: photoId }, data: { metadata: nextMetadata as Prisma.InputJsonValue } });
  revalidateHikePhotoAssociationPaths(access.hike.slug);
  return { success: true };
};

export const refreshHikePhotoExifMetadata = async ({ hikeId, photoId }: { hikeId: string; photoId: string }) => {
  const access = await getPhotoDetailAccess({ hikeId, photoId });
  if (!access || !canRefreshHikePhotoExif(access.accessFlags))
    throw new Error("You cannot refresh this photo metadata");
  const images = access.photo.images as Array<{
    sortOrder: number;
    fileAsset: { id: string; fileKey: string; url: string; purpose: string; status: FileAssetStatus };
  }>;

  const ineligibleImage = images.find(
    (image) => image.fileAsset.purpose !== "OUTDOOR_PHOTO_IMAGE" || image.fileAsset.status !== ACTIVE_FILE_STATUS,
  );
  if (ineligibleImage) throw new Error("Selected image file is not eligible for photos");

  const metadata = await parsePhotoExifMetadata({
    images: images.map((image) => ({
      fileAssetId: image.fileAsset.id,
      fileKey: image.fileAsset.fileKey,
      sortOrder: image.sortOrder,
      url: image.fileAsset.url,
    })),
  });
  const previousMapCoordinate = readPhotoExifMetadata(access.photo.metadata)?.mapCoordinate;
  const metadataToPersist =
    previousMapCoordinate !== undefined ? { ...metadata, mapCoordinate: previousMapCoordinate } : metadata;
  const { default: prisma } = await import("@/lib/prisma");

  await prisma.photo.update({
    where: { id: access.photo.id },
    data: { metadata: metadataToPersist as Prisma.InputJsonValue },
  });
  revalidateHikePhotoAssociationPaths(access.hike.slug);

  return metadataToPersist;
};

export const likeHikePhoto = async ({ hikeId, photoId }: { hikeId: string; photoId: string }) => {
  const user = await requireTrustGatedAction("like");

  const { hikeSlug, ownerUserId } = await getEligiblePublishedHikePhoto({ hikeId, photoId });
  if (ownerUserId === user.id) throw new Error("You cannot like your own photo");

  const { default: prisma } = await import("@/lib/prisma");
  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.photoLike.upsert({
      where: { photoId_userId: { photoId, userId: user.id } },
      create: { photoId, userId: user.id },
      update: {},
    });
    await reconcileVerifiedUserTrust(tx, ownerUserId);
  });
  revalidateHikePhotoAssociationPaths(hikeSlug);

  return { liked: true };
};

export const unlikeHikePhoto = async ({ hikeId, photoId }: { hikeId: string; photoId: string }) => {
  const user = await requireTrustGatedAction("like");

  const { hikeSlug } = await getEligiblePublishedHikePhoto({ hikeId, photoId });
  const { default: prisma } = await import("@/lib/prisma");
  await prisma.photoLike.deleteMany({ where: { photoId, userId: user.id } });
  revalidateHikePhotoAssociationPaths(hikeSlug);

  return { liked: false };
};

export const contributePhotoToHike = async ({
  hikeId,
  title,
  description,
  fileAssetIds,
}: HikePhotoContributionValues) => {
  const user = await requireTrustGatedAction("photo-upload");

  const data = normalizePhotoInput({ title, description, status: "PUBLISHED", fileAssetIds });
  const { default: prisma } = await import("@/lib/prisma");
  const [role, hike] = await Promise.all([
    currentUserRole(),
    prisma.hike.findFirst({
      where: { id: hikeId, status: "PUBLISHED" },
      select: { id: true, slug: true, userId: true },
    }),
  ]);

  if (!hike) throw new Error("Trip is not available for photo contributions");

  const isAdmin = hasAdminRole(role);
  const isCreator = hike.userId === user.id;
  const isParticipant = !isCreator && !isAdmin && (await isAcceptedHikeParticipant({ hikeId, userId: user.id }));
  if (!isAdmin && !isCreator && !isParticipant) throw new Error("You cannot add photos to this trip");

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await assertVerifiedResourceQuota(tx, user, "photo");

    if (!isAdmin) {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${`${hikeId}:${user.id}`}))`;
      const contributedCount = await tx.hikesToPhotos.count({
        where: { hikeId, photo: { userId: user.id } },
      });

      if (contributedCount >= 10) throw new Error("You have reached the 10-photo limit for this trip");
    }

    const fileAssets = await tx.fileAsset.findMany({
      where: {
        id: { in: data.fileAssetIds },
        ownerUserId: user.id,
        purpose: "OUTDOOR_PHOTO_IMAGE",
        status: ACTIVE_FILE_STATUS,
      },
      select: { id: true, photoImages: { select: { photoId: true } } },
    });
    const assetsById = new Map(fileAssets.map((fileAsset) => [fileAsset.id, fileAsset]));
    if (data.fileAssetIds.some((fileAssetId) => !assetsById.has(fileAssetId))) {
      throw new Error("Selected image file is not eligible for photos");
    }
    if (fileAssets.some((fileAsset) => fileAsset.photoImages.length > 0)) {
      throw new Error("Selected image file is already linked to another photo");
    }

    const lastAssociation = await tx.hikesToPhotos.findFirst({
      where: { hikeId },
      orderBy: { position: "desc" },
      select: { position: true },
    });
    const photo = await tx.photo.create({
      data: {
        title: data.title,
        description: data.description,
        status: "PUBLISHED",
        userId: user.id,
        images: {
          create: data.fileAssetIds.map((fileAssetId, sortOrder) => ({ fileAssetId, sortOrder })),
        },
      },
      select: { id: true },
    });
    await tx.hikesToPhotos.create({
      data: { hikeId, photoId: photo.id, position: (lastAssociation?.position ?? -1) + 1 },
    });
  });

  revalidateHikePhotoAssociationPaths(hike.slug);
  revalidatePath("/admin/photos");
  revalidatePath("/admin/files");

  return { success: true };
};

export const inviteHikeParticipant = async ({ hikeId, email }: { hikeId: string; email: string }) => {
  const userId = await getRequiredUserId();
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail) throw new Error("This user cannot be invited");

  const hike = await getHikeParticipantManager({ hikeId, userId });
  const { default: prisma } = await import("@/lib/prisma");
  const invitedUser = await prisma.user.findFirst({
    where: { email: { equals: normalizedEmail, mode: "insensitive" } },
    select: { id: true },
  });
  if (!invitedUser || invitedUser.id === hike.userId) throw new Error("This user cannot be invited");

  const existing = await prisma.hikeParticipant.findUnique({
    where: { hikeId_userId: { hikeId: hike.id, userId: invitedUser.id } },
    select: { id: true, status: true },
  });
  if (existing?.status === "PENDING" || existing?.status === "ACCEPTED") {
    throw new Error("This user cannot be invited");
  }

  const invitedAt = new Date();
  if (existing) {
    await prisma.hikeParticipant.update({
      where: { id: existing.id },
      data: { status: "PENDING", invitedById: userId, invitedAt, respondedAt: null, expiresAt: null },
    });
  } else {
    await prisma.hikeParticipant.create({
      data: { hikeId: hike.id, userId: invitedUser.id, invitedById: userId, invitedAt },
    });
  }

  revalidateHikePaths(hike.slug);
  return { success: true };
};

export const respondToHikeInvitation = async ({ id, accept }: { id: string; accept: boolean }) => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const invitation = await prisma.hikeParticipant.findUnique({
    where: { id },
    select: { id: true, userId: true, status: true, expiresAt: true, hike: { select: { slug: true } } },
  });
  if (!invitation || invitation.userId !== userId || (await expireHikeParticipantIfNeeded(invitation))) {
    throw new Error("Invitation is no longer available");
  }
  if (invitation.status !== "PENDING") throw new Error("Invitation is no longer available");

  await prisma.hikeParticipant.update({
    where: { id: invitation.id },
    data: { status: accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() },
  });
  revalidateHikePaths(invitation.hike.slug);
  return { success: true };
};

export const cancelHikeInvitation = async ({ hikeId, id }: { hikeId: string; id: string }) => {
  const userId = await getRequiredUserId();
  const hike = await getHikeParticipantManager({ hikeId, userId });
  const { default: prisma } = await import("@/lib/prisma");
  const updated = await prisma.hikeParticipant.updateMany({
    where: { id, hikeId: hike.id, status: "PENDING" },
    data: { status: "CANCELLED", respondedAt: new Date() },
  });
  if (updated.count === 0) throw new Error("Invitation is no longer available");

  revalidateHikePaths(hike.slug);
  return { success: true };
};

export const removeHikeParticipant = async ({ hikeId, id }: { hikeId: string; id: string }) => {
  const userId = await getRequiredUserId();
  const hike = await getHikeParticipantManager({ hikeId, userId });
  const { default: prisma } = await import("@/lib/prisma");
  const updated = await prisma.hikeParticipant.updateMany({
    where: { id, hikeId: hike.id, status: "ACCEPTED" },
    data: { status: "CANCELLED", respondedAt: new Date() },
  });
  if (updated.count === 0) throw new Error("Participant is no longer active");

  revalidateHikePaths(hike.slug);
  return { success: true };
};

export const attachTrackToHike = async ({ hikeId, trackId }: { hikeId: string; trackId: string }) => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const [hike, track] = await Promise.all([
    prisma.hike.findUnique({
      where: { id: hikeId },
      select: { id: true, slug: true },
    }),
    prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true, slug: true },
    }),
  ]);

  if (!hike) {
    throw new Error("Hike not found");
  }

  if (!track) {
    throw new Error("Track not found");
  }

  await prisma.hikesToTracks.upsert({
    where: {
      hikeId_trackId: {
        hikeId: hike.id,
        trackId: track.id,
      },
    },
    create: {
      hikeId: hike.id,
      trackId: track.id,
    },
    update: {},
  });

  revalidateHikeTrackAssociationPaths({ hikeSlug: hike.slug, trackSlug: track.slug });

  return { success: true };
};

export const detachTrackFromHike = async ({ hikeId, trackId }: { hikeId: string; trackId: string }) => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const association = await prisma.hikesToTracks.findUnique({
    where: {
      hikeId_trackId: {
        hikeId,
        trackId,
      },
    },
    select: {
      hike: {
        select: {
          slug: true,
        },
      },
      track: {
        select: {
          slug: true,
        },
      },
    },
  });

  if (!association) {
    return { success: false };
  }

  await prisma.hikesToTracks.delete({
    where: {
      hikeId_trackId: {
        hikeId,
        trackId,
      },
    },
  });

  revalidateHikeTrackAssociationPaths({ hikeSlug: association.hike.slug, trackSlug: association.track.slug });

  return { success: true };
};

/**
 * Creator-only attach. Mirrors the admin-only `attachTrackToHike` but enforces
 * that the actor owns the track and the trip. Used by the trip-side
 * `HikeTrackContributionDialog` so the trip creator can attach one of their
 * own unlinked tracks to the trip they own.
 */
export const attachCreatorTrackToHike = async ({ hikeId, trackId }: { hikeId: string; trackId: string }) => {
  const actor = await requireTrustGatedAction("track-upload");
  const { default: prisma } = await import("@/lib/prisma");

  const [hike, track] = await Promise.all([
    prisma.hike.findUnique({
      where: { id: hikeId },
      select: { id: true, slug: true, userId: true },
    }),
    prisma.track.findUnique({
      where: { id: trackId },
      select: { id: true, slug: true, userId: true },
    }),
  ]);

  if (!hike) throw new Error("Trip is not available");
  if (!track) throw new Error("Track is not available");
  if (hike.userId !== actor.id) throw new Error("You can only attach tracks to your own trip");
  if (track.userId !== actor.id) throw new Error("You can only attach tracks you own");

  await prisma.hikesToTracks.upsert({
    where: {
      hikeId_trackId: {
        hikeId: hike.id,
        trackId: track.id,
      },
    },
    create: {
      hikeId: hike.id,
      trackId: track.id,
    },
    update: {},
  });

  revalidateHikeTrackAssociationPaths({ hikeSlug: hike.slug, trackSlug: track.slug });

  return { success: true };
};

/**
 * Trip-side upload+attach in one transaction. Validates the actor's trust and
 * verified-track quota, the trip ownership, the supplied GPX file asset, and
 * the slug uniqueness, then writes the `Track` + `HikesToTracks` rows
 * atomically. The `parseTrackGpx` call runs outside the transaction so a parse
 * failure cannot undo the successful write — it just leaves the metadata
 * in the "stale" state for the user to reparse.
 */
export const createTrackAndAttachToHike = async (
  input: CreateTrackAndAttachToHikeInput,
): Promise<CreateTrackAndAttachToHikeResult> => {
  try {
    const user = await requireTrustGatedAction("track-upload");
    const userId = user.id;
    const { default: prisma } = await import("@/lib/prisma");

    const hike = await prisma.hike.findUnique({
      where: { id: input.hikeId },
      select: { id: true, slug: true, userId: true, status: true },
    });

    if (!hike) {
      return { ok: false, code: "VALIDATION", message: "Trip is not available" };
    }
    if (hike.userId !== userId) {
      return { ok: false, code: "VALIDATION", message: "You can only add tracks to your own trip" };
    }

    const trackValues: TrackActionValues = {
      title: input.title,
      slug: input.slug ?? null,
      description: input.description ?? null,
      status: input.status ?? (hike.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT"),
      fileAssetId: input.fileAssetId,
      activityTypeId: input.activityTypeId ?? null,
    };

    const { id: trackId, slug: trackSlug } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await assertVerifiedResourceQuota(tx, user, "track");
      const data = await getTrackData(trackValues);
      try {
        await ensureSlugAvailable({ slug: data.slug });
        await ensureEligibleTrackFileAsset({ fileAssetId: data.fileAssetId, userId });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Track input is invalid";
        if (message.toLowerCase().includes("slug")) {
          throw new SlugConflictError(message);
        }
        throw new ValidationTrackInputError(message);
      }
      const track = await tx.track.create({
        data: {
          ...data,
          recordingTimezone: normalizeTrackRecordingTimezone(input.recordingTimezone) ?? null,
          userId,
        },
        select: { id: true, slug: true },
      });
      await tx.hikesToTracks.create({
        data: { hikeId: hike.id, trackId: track.id },
      });
      return track;
    });

    // Parse outside the transaction so a parse failure does not roll back the
    // successful track + association.
    await parseTrackGpx(trackId).catch(() => null);

    revalidateHikeTrackAssociationPaths({ hikeSlug: hike.slug, trackSlug });

    return { ok: true, trackId, trackSlug };
  } catch (error) {
    if (error instanceof InsufficientTrustError) {
      return { ok: false, code: "TRUST", message: error.message };
    }
    if (error instanceof SlugConflictError) {
      return { ok: false, code: "SLUG", message: error.message };
    }
    if (error instanceof ValidationTrackInputError) {
      return { ok: false, code: "VALIDATION", message: error.message };
    }
    if (error instanceof Error) {
      const message = error.message;
      if (message.toLowerCase().includes("limit reached")) {
        return { ok: false, code: "QUOTA", message };
      }
    }
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not create track for this trip",
    };
  }
};

class SlugConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SlugConflictError";
  }
}

class ValidationTrackInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationTrackInputError";
  }
}

export const attachPhotoToHike = async ({ hikeId, photoId }: { hikeId: string; photoId: string }) => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const [hike, photo] = await Promise.all([
    prisma.hike.findUnique({
      where: { id: hikeId },
      select: { id: true, slug: true },
    }),
    prisma.photo.findUnique({
      where: { id: photoId },
      select: { id: true },
    }),
  ]);

  if (!hike) {
    throw new Error("Hike not found");
  }

  if (!photo) {
    throw new Error("Photo not found");
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const existingAssociation = await tx.hikesToPhotos.findUnique({
      where: {
        hikeId_photoId: {
          hikeId: hike.id,
          photoId: photo.id,
        },
      },
      select: {
        photoId: true,
      },
    });

    if (existingAssociation) return;

    const lastAssociation = await tx.hikesToPhotos.findFirst({
      where: { hikeId: hike.id },
      orderBy: {
        position: "desc",
      },
      select: {
        position: true,
      },
    });

    await tx.hikesToPhotos.create({
      data: {
        hikeId: hike.id,
        photoId: photo.id,
        position: (lastAssociation?.position ?? -1) + 1,
      },
    });
  });

  revalidateHikePhotoAssociationPaths(hike.slug);

  return { success: true };
};

export const detachPhotoFromHike = async ({ hikeId, photoId }: { hikeId: string; photoId: string }) => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const association = await prisma.hikesToPhotos.findUnique({
    where: {
      hikeId_photoId: {
        hikeId,
        photoId,
      },
    },
    select: {
      hike: {
        select: {
          id: true,
          slug: true,
        },
      },
    },
  });

  if (!association) {
    return { success: false };
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.hikesToPhotos.delete({
      where: {
        hikeId_photoId: {
          hikeId,
          photoId,
        },
      },
    });
    await normalizeHikePhotoPositions(tx, association.hike.id);
  });

  revalidateHikePhotoAssociationPaths(association.hike.slug);

  return { success: true };
};

export const reorderHikePhotos = async ({ hikeId, photoIds }: { hikeId: string; photoIds: string[] }) => {
  await getRequiredAdminUserId();
  const uniquePhotoIds = Array.from(new Set(photoIds));

  if (uniquePhotoIds.length !== photoIds.length) {
    throw new Error("Photo order contains duplicate photos");
  }

  const { default: prisma } = await import("@/lib/prisma");
  const hike = await prisma.hike.findUnique({
    where: { id: hikeId },
    select: {
      id: true,
      slug: true,
      photos: {
        select: {
          photoId: true,
        },
      },
    },
  });

  if (!hike) {
    throw new Error("Hike not found");
  }

  const currentPhotoIds = new Set((hike.photos as HikePhotoIdAssociation[]).map((association) => association.photoId));
  const unknownPhotoId = uniquePhotoIds.find((photoId) => !currentPhotoIds.has(photoId));

  if (unknownPhotoId) {
    throw new Error("Photo is not attached to this hike");
  }

  await prisma.$transaction((tx: Prisma.TransactionClient) => normalizeHikePhotoPositions(tx, hike.id, uniquePhotoIds));

  revalidateHikePhotoAssociationPaths(hike.slug);

  return { success: true };
};

export const createHikeNote = async (values: HikeNoteInput) => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const hike = await prisma.hike.findUnique({
    where: { id: values.hikeId },
    select: { id: true, slug: true, startDate: true, endDate: true },
  });
  if (!hike) throw new Error("Hike not found");
  const note = await prisma.hikeNote.create({ data: { hikeId: hike.id, ...normalizeHikeNote(values, hike) } });
  revalidateHikePaths(hike.slug);
  return note;
};

export const updateHikeNote = async (values: HikeNoteInput) => {
  if (!values.id) throw new Error("Note id is required");
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const note = await prisma.hikeNote.findUnique({
    where: { id: values.id },
    include: { hike: { select: { slug: true, startDate: true, endDate: true } } },
  });
  if (!note) throw new Error("Hike note not found");
  const updated = await prisma.hikeNote.update({ where: { id: note.id }, data: normalizeHikeNote(values, note.hike) });
  revalidateHikePaths(note.hike.slug);
  return updated;
};

export const deleteHikeNote = async (id: string) => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const note = await prisma.hikeNote.findUnique({ where: { id }, include: { hike: { select: { slug: true } } } });
  if (!note) return { success: false };
  await prisma.hikeNote.delete({ where: { id: note.id } });
  revalidateHikePaths(note.hike.slug);
  return { success: true };
};

export const createHike = async (values: HikeActionValues) => {
  const user = await requireTrustGatedAction("trip-create");
  const userId = user.id;
  const data = getHikeData(values);
  const { default: prisma } = await import("@/lib/prisma");

  await ensureSlugAvailable({ slug: data.slug });

  const hike = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await assertVerifiedResourceQuota(tx, user, "trip");
    return tx.hike.create({ data: { ...data, userId } });
  });

  revalidateHikePaths(hike.slug);

  return hike;
};

export const updateHike = async (values: HikeActionValues) => {
  if (!values.id) {
    throw new Error("Hike id is required");
  }

  const userId = await getRequiredUserId();
  const data = getHikeData(values);
  const { default: prisma } = await import("@/lib/prisma");
  const existingHike = await prisma.hike.findFirst({
    where: { id: values.id, userId },
    select: { id: true, slug: true },
  });

  if (!existingHike) {
    throw new Error("Hike not found");
  }

  await ensureSlugAvailable({ slug: data.slug, id: existingHike.id });

  const hike = await prisma.hike.update({
    where: { id: existingHike.id },
    data,
  });

  revalidateHikePaths(existingHike.slug);
  revalidateHikePaths(hike.slug);

  return hike;
};

export const deleteHike = async (id: string) => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const existingHike = await prisma.hike.findFirst({
    where: { id, userId },
    select: { id: true, slug: true },
  });

  if (!existingHike) {
    return { success: false };
  }

  await prisma.hike.delete({
    where: { id: existingHike.id },
  });

  revalidateHikePaths(existingHike.slug);

  return { success: true };
};
