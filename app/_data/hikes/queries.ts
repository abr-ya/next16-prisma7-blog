"use server";

import type { Prisma } from "@/generated/prisma/client";
import type { HikeParticipantStatus } from "@/generated/prisma/enums";
import { AUTH_TRUST_LEVELS } from "@/lib/auth-trust";
import { VERIFIED_RESOURCE_LIMITS } from "@/lib/auth-trust-quotas.server";
import { authSession, currentUserRole } from "@/lib/auth-utils";
import { hasAdminRole } from "@/lib/auth-roles";
import {
  canRefreshHikePhotoExif,
  canReviewHikePhotoCoordinate,
  canViewHikePhotoDetail,
  getAcceptedHikePhotoCoordinate,
} from "@/lib/hike-photo-detail-policy";
import { getPhotoExifMetadataState, getPhotoMapCoordinate } from "@/lib/photo-exif-metadata";
import {
  proposeTrackTimeMatchCandidates,
  type TrackTimeMatchTrackInput,
} from "@/lib/outdoor-photo-track-time-matching";
import { getTrackGpxMetadataState } from "@/lib/track-gpx-metadata";

import {
  expireHikeParticipantIfNeeded,
  getRequiredAdminUserId,
  getRequiredUserId,
  orderHikeTrackAssociations,
  toPublicHike,
  toTrackTimeMatchPhotoInput,
  toTrackTimeMatchTrackInput,
} from "./internal";
import {
  hikeListInclude,
  publicHikeInclude,
  type HikeListItem,
  type HikeParticipantManagement,
  type HikePhotoContributionCapability,
  type HikePhotoDetail,
  type HikePhotoLikeState,
  type HikePhotoOption,
  type HikePhotoOptionRecord,
  type HikeTrackContributionCapability,
  type MyLikedHikePhoto,
  type MyLikedHikePhotoRecord,
  type PendingHikeInvitation,
  type PublicHike,
  type PublicHikeListItem,
  type PublicTripCreationCapability,
} from "./types";

export const getAllHikes = async (): Promise<HikeListItem[]> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  const hikes = (await prisma.hike.findMany({
    where: { userId },
    include: hikeListInclude,
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  })) as HikeListItem[];

  return hikes.map((hike) => ({ ...hike, tracks: orderHikeTrackAssociations(hike.tracks) }));
};

export const getHikePhotoOptions = async (): Promise<HikePhotoOption[]> => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const photos = (await prisma.photo.findMany({
    select: {
      id: true,
      title: true,
      status: true,
      metadata: true,
      images: {
        orderBy: {
          sortOrder: "asc",
        },
        take: 1,
        select: {
          fileAsset: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  })) as HikePhotoOptionRecord[];

  return photos.map((photo) => ({
    id: photo.id,
    title: photo.title,
    status: photo.status,
    trackTimeMatch: toTrackTimeMatchPhotoInput(photo),
    mapCoordinate: getPhotoMapCoordinate(photo.metadata),
    previewImage: photo.images.at(0)?.fileAsset
      ? {
          id: photo.images[0].fileAsset.id,
          name: photo.images[0].fileAsset.name,
          thumbnailUrl: `/files/${photo.images[0].fileAsset.id}/thumbnail`,
        }
      : null,
  }));
};

export const getHikeById = async (id: string): Promise<HikeListItem | null> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  const hike = await prisma.hike.findFirst({
    where: { id, userId },
    include: hikeListInclude,
  });

  return hike ? { ...hike, tracks: orderHikeTrackAssociations(hike.tracks) } : null;
};

export const getPublicHikes = async (): Promise<PublicHikeListItem[]> => {
  const session = await authSession();
  const { default: prisma } = await import("@/lib/prisma");

  const hikes = (await prisma.hike.findMany({
    where: { status: "PUBLISHED" },
    include: hikeListInclude,
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  })) as HikeListItem[];

  if (!session) return hikes.map((hike) => ({ ...hike, viewerStatus: "viewer" }));

  const acceptedParticipations = (await prisma.hikeParticipant.findMany({
    where: {
      userId: session.user.id,
      status: "ACCEPTED",
      hike: { status: "PUBLISHED" },
    },
    select: { hikeId: true },
  })) as { hikeId: string }[];
  const participantHikeIds = new Set(acceptedParticipations.map((participation) => participation.hikeId));

  return hikes.map((hike) => ({
    ...hike,
    viewerStatus:
      hike.userId === session.user.id ? "creator" : participantHikeIds.has(hike.id) ? "participant" : "viewer",
  }));
};

export const getPublicHikeBySlug = async (slug: string): Promise<PublicHike | null> => {
  const { default: prisma } = await import("@/lib/prisma");

  const hike = await prisma.hike.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: publicHikeInclude,
  });

  return hike ? toPublicHike(hike) : null;
};

export const getPublicTripCreationCapability = async (): Promise<PublicTripCreationCapability> => {
  const session = await authSession();

  if (!session) return { eligible: false, reason: "anonymous" };

  const { default: prisma } = await import("@/lib/prisma");
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, trustLevel: true },
  });

  if (hasAdminRole(user?.role)) return { eligible: true };

  const trustLevel = user?.trustLevel ?? AUTH_TRUST_LEVELS.NEW;

  if (trustLevel !== AUTH_TRUST_LEVELS.VERIFIED && trustLevel !== AUTH_TRUST_LEVELS.TRUSTED) {
    return { eligible: false, reason: "insufficient-trust" };
  }

  if (trustLevel === AUTH_TRUST_LEVELS.VERIFIED) {
    const tripCount = await prisma.hike.count({ where: { userId: session.user.id } });

    if (tripCount >= VERIFIED_RESOURCE_LIMITS.trip) {
      return { eligible: false, reason: "verified-trip-quota-reached" };
    }
  }

  return { eligible: true };
};

export const getPublicHikePhotoLikeStates = async ({
  hikeId,
  photoIds,
}: {
  hikeId: string;
  photoIds: string[];
}): Promise<Record<string, HikePhotoLikeState>> => {
  const uniquePhotoIds = [...new Set(photoIds)];
  if (uniquePhotoIds.length === 0) return {};

  const session = await authSession();
  if (!session) return {};

  const { default: prisma } = await import("@/lib/prisma");
  const eligibleAssociations = (await prisma.hikesToPhotos.findMany({
    where: {
      hikeId,
      hike: { status: "PUBLISHED" },
      photoId: { in: uniquePhotoIds },
      photo: { status: "PUBLISHED" },
    },
    select: { photoId: true },
  })) as { photoId: string }[];
  const eligiblePhotoIds = eligibleAssociations.map(({ photoId }) => photoId);

  if (eligiblePhotoIds.length === 0) return {};

  const viewerLikes = (await prisma.photoLike.findMany({
    where: { photoId: { in: eligiblePhotoIds }, userId: session.user.id },
    select: { photoId: true },
  })) as { photoId: string }[];
  const likedPhotoIds = new Set(viewerLikes.map(({ photoId }) => photoId));

  return Object.fromEntries(
    eligiblePhotoIds.map((photoId) => [photoId, { isLikedByViewer: likedPhotoIds.has(photoId) }]),
  );
};

export const getMyLikedHikePhotos = async (): Promise<MyLikedHikePhoto[]> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  const likes = (await prisma.photoLike.findMany({
    where: {
      userId,
      photo: {
        status: "PUBLISHED",
        hikes: { some: { hike: { status: "PUBLISHED" } } },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      createdAt: true,
      photo: {
        select: {
          id: true,
          title: true,
          description: true,
          hikes: {
            where: { hike: { status: "PUBLISHED" } },
            select: { hike: { select: { id: true, slug: true, title: true } } },
          },
        },
      },
    },
  })) as MyLikedHikePhotoRecord[];

  return likes.map(({ id, createdAt, photo }) => ({
    id,
    likedAt: createdAt,
    photo: { ...photo, trips: photo.hikes.map(({ hike }) => hike) },
  }));
};

export const isAcceptedHikeParticipant = async ({ hikeId, userId }: { hikeId: string; userId: string }) => {
  const { default: prisma } = await import("@/lib/prisma");
  const participant = await prisma.hikeParticipant.findUnique({
    where: { hikeId_userId: { hikeId, userId } },
    select: { id: true, status: true, expiresAt: true },
  });

  if (!participant || (await expireHikeParticipantIfNeeded(participant))) return false;
  return participant.status === "ACCEPTED";
};

export const getPhotoDetailAccess = async ({ hikeId, photoId }: { hikeId: string; photoId: string }) => {
  const session = await authSession();
  if (!session) return null;

  const { default: prisma } = await import("@/lib/prisma");
  const [role, hike] = await Promise.all([
    currentUserRole(),
    prisma.hike.findFirst({
      where: { id: hikeId, status: "PUBLISHED" },
      select: {
        id: true,
        slug: true,
        userId: true,
        photos: {
          where: { photoId, photo: { status: "PUBLISHED" } },
          select: {
            photo: {
              select: {
                id: true,
                userId: true,
                title: true,
                metadata: true,
                images: {
                  orderBy: { sortOrder: "asc" },
                  select: {
                    sortOrder: true,
                    fileAsset: { select: { id: true, fileKey: true, url: true, purpose: true, status: true } },
                  },
                },
              },
            },
          },
          take: 1,
        },
        tracks: {
          where: { track: { status: "PUBLISHED" } },
          select: {
            track: {
              select: {
                id: true,
                title: true,
                slug: true,
                recordingTimezone: true,
                metadata: true,
                fileAsset: { select: { id: true, fileKey: true } },
              },
            },
          },
        },
      },
    }),
  ]);

  const photo = hike?.photos.at(0)?.photo;
  if (!hike || !photo) return null;

  const isAdmin = hasAdminRole(role);
  const isCreator = hike.userId === session.user.id;
  const isPhotoOwner = photo.userId === session.user.id;
  const isParticipant =
    !isAdmin &&
    !isCreator &&
    !isPhotoOwner &&
    (await isAcceptedHikeParticipant({ hikeId: hike.id, userId: session.user.id }));

  const accessFlags = { isAdmin, isCreator, isPhotoOwner, isAcceptedParticipant: isParticipant };
  if (!canViewHikePhotoDetail(accessFlags)) return null;

  return {
    hike,
    photo,
    accessFlags,
    canReviewCoordinate: canReviewHikePhotoCoordinate(accessFlags),
    canRefreshExif: canRefreshHikePhotoExif(accessFlags),
    reviewedByUserId: session.user.id,
  };
};

export const getHikePhotoDetail = async ({
  hikeId,
  photoId,
}: {
  hikeId: string;
  photoId: string;
}): Promise<HikePhotoDetail | null> => {
  const access = await getPhotoDetailAccess({ hikeId, photoId });
  if (!access) return null;

  const metadataState = getPhotoExifMetadataState(access.photo.metadata);
  const directGps = metadataState.status === "SUCCESS" ? metadataState.summary.gps : null;
  const mapCoordinate = getPhotoMapCoordinate(access.photo.metadata);
  const acceptedCoordinate = getAcceptedHikePhotoCoordinate({ directGps, mapCoordinate });
  const trackInputs: TrackTimeMatchTrackInput[] = (
    access.hike.tracks as Array<{
      track: {
        id: string;
        title: string;
        slug: string | null;
        recordingTimezone: string | null;
        metadata: Prisma.JsonValue | null;
        fileAsset: { id: string; fileKey: string };
      };
    }>
  ).map(({ track }) => toTrackTimeMatchTrackInput(track));
  const linkedTrackTimezones = [
    ...new Set(
      trackInputs.map((track) => track.recordingTimezone).filter((timezone): timezone is string => Boolean(timezone)),
    ),
  ];
  const photoInput = toTrackTimeMatchPhotoInput({ ...access.photo, linkedTrackTimezones });
  const captureTimeAssumption =
    metadataState.status === "SUCCESS" && metadataState.summary.captureTimeTimezoneEvidence === "MISSING"
      ? metadataState.summary.captureTimeNormalization
        ? {
            timeZone: metadataState.summary.captureTimeNormalization.timeZone,
            provenance: metadataState.summary.captureTimeNormalization.provenance,
          }
        : linkedTrackTimezones.length === 1
          ? { timeZone: linkedTrackTimezones[0], provenance: "TRACK_DEFAULT" as const }
          : null
      : null;
  const candidates = access.canReviewCoordinate ? proposeTrackTimeMatchCandidates(photoInput, trackInputs) : [];
  const previewByCandidateId: HikePhotoDetail["previewByCandidateId"] = {};

  if (access.canReviewCoordinate) {
    for (const candidate of candidates) {
      if (candidate.type !== "INSIDE_TRACK_WINDOW" || !candidate.hasTimedTimeline) continue;
      const track = (
        access.hike.tracks as Array<{
          track: {
            id: string;
            title: string;
            metadata: Prisma.JsonValue | null;
            fileAsset: { id: string; fileKey: string };
          };
        }>
      ).find(({ track }) => track.id === candidate.trackId)?.track;
      if (!track) continue;
      const state = getTrackGpxMetadataState(track.metadata, {
        fileAssetId: track.fileAsset.id,
        fileKey: track.fileAsset.fileKey,
      });
      if (state.status !== "SUCCESS" || !state.timeline?.length || !state.mapGeometry.length) continue;
      previewByCandidateId[candidate.id] = {
        capturedAt: candidate.capturedAt,
        timeline: state.timeline,
        track: { title: track.title, bounds: state.summary.bounds, geometry: state.mapGeometry },
      };
    }
  }

  return {
    hikeId: access.hike.id,
    photoId: access.photo.id,
    captureSummary: metadataState.status === "SUCCESS" ? metadataState.summary : null,
    adminExifMetadata: access.accessFlags.isAdmin && metadataState.status === "SUCCESS" ? metadataState.metadata : null,
    linkedTrackTimezones,
    captureTimeAssumption,
    timezoneConfirmationRequired:
      metadataState.status === "SUCCESS" &&
      metadataState.summary.captureTimeTimezoneEvidence === "MISSING" &&
      !metadataState.summary.captureTimeNormalization &&
      linkedTrackTimezones.length !== 1,
    canRefreshExif: access.canRefreshExif,
    requiresCameraTimeRefresh:
      metadataState.status === "SUCCESS" &&
      Boolean(metadataState.summary.captureTimeProvenance?.instantUtc) &&
      !metadataState.summary.captureTimeProvenance?.localWallTime,
    acceptedCoordinate,
    canReviewCoordinate: access.canReviewCoordinate,
    isAdmin: access.accessFlags.isAdmin,
    candidates,
    previewByCandidateId,
  };
};

export const getHikePhotoContributionCapabilityBySlug = async (
  slug: string,
): Promise<HikePhotoContributionCapability | null> => {
  const session = await authSession();
  if (!session) return null;

  const { default: prisma } = await import("@/lib/prisma");
  const [role, hike] = await Promise.all([
    currentUserRole(),
    prisma.hike.findFirst({
      where: { slug, status: "PUBLISHED" },
      select: { id: true, userId: true },
    }),
  ]);

  if (!hike) return null;

  const isAdmin = hasAdminRole(role);
  const isCreator = hike.userId === session.user.id;
  const isParticipant =
    !isCreator && !isAdmin && (await isAcceptedHikeParticipant({ hikeId: hike.id, userId: session.user.id }));

  if (!isAdmin && !isCreator && !isParticipant) return null;

  if (isAdmin) {
    return { hikeId: hike.id, remainingPhotoCount: null };
  }

  const contributedCount = await prisma.hikesToPhotos.count({
    where: { hikeId: hike.id, photo: { userId: session.user.id } },
  });

  return { hikeId: hike.id, remainingPhotoCount: Math.max(0, 10 - contributedCount) };
};

/**
 * Trip-side viewer capability for the `Add track` affordance on `/trips/[slug]`.
 * Five viewer states, mirroring the photo-capability pattern with the addition
 * of the trust-ineligible state (verified-track-quota is enforced separately
 * inside the new `createTrackAndAttachToHike` mutation).
 *
 * - `anonymous` — no session. Button is omitted.
 * - `non-owner` — authenticated but not the trip creator and not an admin.
 *   Button is omitted (participants are also "non-owner" by this slice).
 * - `owner-trust-ineligible` — trip owner without the `track-upload` trust
 *   gate (NEW or RESTRICTED). Button is omitted.
 * - `owner-quota-reached` — eligible creator who has hit the verified track
 *   quota cap (10). Button is rendered disabled with localized feedback.
 * - `owner-eligible` — eligible creator with remaining quota. Button enabled.
 */
export const getHikeTrackContributionCapability = async (
  hikeId: string,
): Promise<HikeTrackContributionCapability | null> => {
  const session = await authSession();
  const { default: prisma } = await import("@/lib/prisma");

  const hike = await prisma.hike.findUnique({
    where: { id: hikeId },
    select: { id: true, userId: true },
  });

  if (!hike) return null;

  if (!session) {
    return { hikeId: hike.id, viewer: "anonymous", eligible: false, remainingTrackCount: null };
  }

  const isCreator = hike.userId === session.user.id;
  const role = await currentUserRole();
  const isAdmin = hasAdminRole(role);

  if (!isCreator && !isAdmin) {
    return { hikeId: hike.id, viewer: "non-owner", eligible: false, remainingTrackCount: null };
  }

  // Trust gate mirrors `requireTrustGatedAction("track-upload")` without
  // throwing — we want to surface "owner-trust-ineligible" rather than a
  // thrown InsufficientTrustError so the page can render the disabled button.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { trustLevel: true, role: true },
  });
  const trustLevel = user?.trustLevel ?? AUTH_TRUST_LEVELS.NEW;
  const isAdminFromUser = hasAdminRole(user?.role);
  const trustAllowsUpload =
    isAdminFromUser || trustLevel === AUTH_TRUST_LEVELS.VERIFIED || trustLevel === AUTH_TRUST_LEVELS.TRUSTED;

  if (!trustAllowsUpload) {
    return { hikeId: hike.id, viewer: "owner-trust-ineligible", eligible: false, remainingTrackCount: null };
  }

  // Admins and trusted users are uncapped; verified users follow the quota.
  if (isAdminFromUser || trustLevel !== AUTH_TRUST_LEVELS.VERIFIED) {
    return { hikeId: hike.id, viewer: "owner-eligible", eligible: true, remainingTrackCount: null };
  }

  const ownedTrackCount = await prisma.track.count({ where: { userId: session.user.id } });
  const remaining = Math.max(0, VERIFIED_RESOURCE_LIMITS.track - ownedTrackCount);

  if (remaining === 0) {
    return { hikeId: hike.id, viewer: "owner-quota-reached", eligible: false, remainingTrackCount: 0 };
  }

  return { hikeId: hike.id, viewer: "owner-eligible", eligible: true, remainingTrackCount: remaining };
};

export const getHikeParticipantManagementBySlug = async (slug: string): Promise<HikeParticipantManagement | null> => {
  const session = await authSession();
  if (!session) return null;

  const { default: prisma } = await import("@/lib/prisma");
  const hike = await prisma.hike.findUnique({
    where: { slug },
    select: {
      id: true,
      slug: true,
      title: true,
      userId: true,
      participants: {
        where: { status: { in: ["PENDING", "ACCEPTED"] } },
        orderBy: [{ status: "asc" }, { invitedAt: "desc" }],
        select: {
          id: true,
          status: true,
          invitedAt: true,
          respondedAt: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });
  const role = await currentUserRole();

  if (!hike || (hike.userId !== session.user.id && !hasAdminRole(role))) return null;

  return {
    hike: { id: hike.id, slug: hike.slug, title: hike.title },
    pendingInvitations: hike.participants
      .filter((participant: { status: HikeParticipantStatus }) => participant.status === "PENDING")
      .map((participant: { id: string; invitedAt: Date; user: { email: string; name: string } }) => ({
        id: participant.id,
        email: participant.user.email,
        name: participant.user.name,
        invitedAt: participant.invitedAt,
      })),
    acceptedParticipants: hike.participants
      .filter((participant: { status: HikeParticipantStatus }) => participant.status === "ACCEPTED")
      .map((participant: { id: string; respondedAt: Date | null; user: { email: string; name: string } }) => ({
        id: participant.id,
        email: participant.user.email,
        name: participant.user.name,
        acceptedAt: participant.respondedAt,
      })),
  };
};

export const getPendingHikeInvitations = async (): Promise<PendingHikeInvitation[]> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const now = new Date();

  await prisma.hikeParticipant.updateMany({
    where: { userId, status: "PENDING", expiresAt: { lte: now } },
    data: { status: "EXPIRED", respondedAt: now },
  });

  return prisma.hikeParticipant.findMany({
    where: { userId, status: "PENDING" },
    orderBy: { invitedAt: "desc" },
    select: {
      id: true,
      invitedAt: true,
      hike: { select: { title: true, slug: true, startDate: true, endDate: true } },
    },
  });
};
