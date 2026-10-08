import { revalidatePath } from "next/cache";

import type { HikeParticipantStatus, HikeStatus, HikeType, Prisma } from "@/generated/prisma/client";
import { authSession, currentUserRole, requireAdmin } from "@/lib/auth-utils";
import { hasAdminRole } from "@/lib/auth-roles";
import { getHikeMapDays, getTimestampDayKey, getTrackDayKeys } from "@/lib/hike-map-days";
import { isValidHikeNoteCoordinate, validateHikeNoteDayKey, type HikeNoteInput } from "@/lib/hike-notes";
import {
  getPhotoExifMetadataState,
  getPhotoMapCoordinate,
  isValidGps,
  readPhotoExifMetadata,
  withPhotoMapCoordinate,
  type PhotoMapCoordinate,
} from "@/lib/photo-exif-metadata";
import { derivePhotoCaptureInstantUtc } from "@/lib/photo-capture-timezone";
import { normalizeTrackRecordingTimezone } from "@/lib/track-recording-timezone";
import {
  canPersistInsideTrackWithoutManualOverride,
  proposeTrackTimeMatchCandidates,
  resolveTrackTimeMatchCoordinate,
  type TrackTimeMatchPhotoInput,
  type TrackTimeMatchTrackInput,
} from "@/lib/outdoor-photo-track-time-matching";
import type { TrackTimelineLookup } from "@/lib/outdoor-photo-track-time-coordinate";
import { createSlug } from "@/lib/slug-generator";
import { getTrackGpxMetadataState } from "@/lib/track-gpx-metadata";

import type { HikeActionValues, HikeTrackAssociationWithStoredMetadata, PublicHike, PublicHikeRecord } from "./types";

const DEFAULT_HIKE_STATUS: HikeStatus = "DRAFT";
const HIKE_TYPES = new Set<HikeType>(["HIKING", "MOUNTAIN", "WATER", "SKI", "BIKE", "OTHER"]);
const HIKE_STATUSES = new Set<HikeStatus>(["DRAFT", "PUBLISHED"]);

export const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
};

export const getRequiredAdminUserId = async () => {
  const session = await requireAdmin();

  return session.user.id;
};

const normalizeRequiredText = (value: string, fieldName: string) => {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
};

const normalizeOptionalText = (value?: string | null) => {
  const normalized = value?.trim();

  return normalized ? normalized : null;
};

const normalizeHikeDate = (value: Date | string, fieldName: string) => {
  const date = value instanceof Date ? value : new Date(value);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`${fieldName} is invalid`);
  }

  return date;
};

const normalizeHikeSlug = (title: string, value?: string | null) => {
  const slug = createSlug(value?.trim() || title);

  if (!slug) {
    throw new Error("Slug is required");
  }

  return slug;
};

export const getHikeData = ({ title, slug, description, startDate, endDate, type, status }: HikeActionValues) => {
  const normalizedTitle = normalizeRequiredText(title, "Title");
  const normalizedStartDate = normalizeHikeDate(startDate, "Start date");
  const normalizedEndDate = normalizeHikeDate(endDate, "End date");

  if (normalizedEndDate < normalizedStartDate) {
    throw new Error("End date must be the same as or later than start date");
  }

  if (!HIKE_TYPES.has(type)) {
    throw new Error("Hike type is invalid");
  }

  const normalizedStatus = status ?? DEFAULT_HIKE_STATUS;

  if (!HIKE_STATUSES.has(normalizedStatus)) {
    throw new Error("Hike status is invalid");
  }

  return {
    title: normalizedTitle,
    slug: normalizeHikeSlug(normalizedTitle, slug),
    description: normalizeOptionalText(description),
    startDate: normalizedStartDate,
    endDate: normalizedEndDate,
    type,
    status: normalizedStatus,
  };
};

export const ensureSlugAvailable = async ({ slug, id }: { slug: string; id?: string }) => {
  const { default: prisma } = await import("@/lib/prisma");
  const existingHike = await prisma.hike.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingHike && existingHike.id !== id) {
    throw new Error("A hike with this slug already exists");
  }
};

const getStoredTrackRecordingStart = (association: HikeTrackAssociationWithStoredMetadata) => {
  const state = getTrackGpxMetadataState(association.track.metadata, {
    fileAssetId: association.track.fileAsset.id,
    fileKey: association.track.fileAsset.fileKey,
  });

  if (state.status !== "SUCCESS" || !state.summary.time) return null;

  const timestamp = Date.parse(state.summary.time.start);
  return Number.isFinite(timestamp) ? timestamp : null;
};

export const orderHikeTrackAssociations = <T extends HikeTrackAssociationWithStoredMetadata>(associations: T[]): T[] =>
  associations
    .map((association, fallbackIndex) => ({
      association,
      fallbackIndex,
      recordingStart: getStoredTrackRecordingStart(association),
    }))
    .sort((left, right) => {
      if (left.recordingStart !== null && right.recordingStart !== null) {
        return left.recordingStart - right.recordingStart || left.fallbackIndex - right.fallbackIndex;
      }

      if (left.recordingStart !== null) return -1;
      if (right.recordingStart !== null) return 1;
      return left.fallbackIndex - right.fallbackIndex;
    })
    .map(({ association }) => association);

export const toHikePhotoMapMarker = ({
  photo,
  hikeDayKeys,
}: {
  photo: PublicHikeRecord["photos"][number]["photo"];
  hikeDayKeys: Set<string>;
}) => {
  const state = getPhotoExifMetadataState(photo.metadata);
  const preview = photo.images.at(0)?.fileAsset;
  const thumbnailUrl = preview ? `/files/${preview.id}/thumbnail` : null;
  const dayKey =
    state.status === "SUCCESS"
      ? getTimestampDayKey(state.summary.capturedAt, state.summary.captureTimeTimezoneEvidence)
      : null;
  const dayKeys = dayKey && hikeDayKeys.has(dayKey) ? [dayKey] : [];

  // Prefer direct EXIF GPS over approved inferred/manual coordinates.
  if (state.status === "SUCCESS" && state.summary.gps) {
    const { lat, lng } = state.summary.gps;
    if (isValidGps(lat, lng)) {
      return {
        photoId: photo.id,
        title: photo.title,
        lat,
        lng,
        thumbnailUrl,
        dayKeys,
      };
    }
  }

  const mapCoordinate = getPhotoMapCoordinate(photo.metadata);

  if (
    mapCoordinate?.status === "APPROVED" &&
    mapCoordinate.lat !== null &&
    mapCoordinate.lng !== null &&
    isValidGps(mapCoordinate.lat, mapCoordinate.lng)
  ) {
    return {
      photoId: photo.id,
      title: photo.title,
      lat: mapCoordinate.lat,
      lng: mapCoordinate.lng,
      thumbnailUrl,
      dayKeys,
    };
  }

  return null;
};

export const toTrackTimeMatchPhotoInput = ({
  id,
  title,
  metadata,
  linkedTrackTimezones = [],
}: {
  id: string;
  title: string;
  metadata: Prisma.JsonValue | null;
  linkedTrackTimezones?: string[];
}): TrackTimeMatchPhotoInput => {
  const state = getPhotoExifMetadataState(metadata);
  const summary = state.status === "SUCCESS" ? state.summary : null;
  const confirmedNormalization = summary?.captureTimeNormalization ?? null;
  const normalizedTrackTimezones = [
    ...new Set(
      linkedTrackTimezones
        .map(normalizeTrackRecordingTimezone)
        .filter((timezone): timezone is string => Boolean(timezone)),
    ),
  ];
  const singleTrackTimezone = normalizedTrackTimezones.length === 1 ? normalizedTrackTimezones[0] : null;
  const normalization =
    confirmedNormalization ??
    (summary?.captureTimeTimezoneEvidence === "MISSING" &&
    singleTrackTimezone &&
    summary.captureTimeProvenance?.localWallTime
      ? {
          timeZone: singleTrackTimezone,
          provenance: "TRACK_DEFAULT" as const,
          instantUtc: derivePhotoCaptureInstantUtc({
            localWallTime: summary.captureTimeProvenance.localWallTime,
            timeZone: singleTrackTimezone,
          }),
        }
      : null);

  return {
    id,
    title,
    capturedAt: normalization?.instantUtc ?? summary?.capturedAt ?? null,
    captureTimeTimezoneEvidence: summary?.captureTimeTimezoneEvidence ?? null,
    hasDirectGps: Boolean(summary?.gps),
  };
};

const getReliablePhotoCaptureInstant = (metadata: Prisma.JsonValue | null) => {
  const state = getPhotoExifMetadataState(metadata);
  if (state.status !== "SUCCESS") return null;

  const summary = state.summary;
  const instant =
    summary.captureTimeNormalization?.instantUtc ??
    summary.captureTimeProvenance?.instantUtc ??
    (summary.captureTimeTimezoneEvidence === "UTC_OR_OFFSET" ? summary.capturedAt : null);

  return instant && Number.isFinite(Date.parse(instant)) ? instant : null;
};

export const toTrackTimeMatchTrackInput = ({
  id,
  title,
  slug,
  recordingTimezone,
  metadata,
  fileAsset,
}: {
  id: string;
  title: string;
  slug?: string | null;
  recordingTimezone?: string | null;
  metadata: Prisma.JsonValue | null;
  fileAsset: {
    id: string;
    fileKey: string;
  };
}): TrackTimeMatchTrackInput => {
  const state = getTrackGpxMetadataState(metadata, {
    fileAssetId: fileAsset.id,
    fileKey: fileAsset.fileKey,
  });

  if (state.status !== "SUCCESS" || !state.summary.time) {
    return {
      id,
      title,
      slug: slug ?? null,
      recordingTime: null,
      startPoint: null,
      endPoint: null,
      timeline: null,
      timezoneEvidence: null,
      recordingTimezone: normalizeTrackRecordingTimezone(recordingTimezone),
    };
  }

  return {
    id,
    title,
    slug: slug ?? null,
    recordingTime: {
      start: state.summary.time.start,
      end: state.summary.time.end,
    },
    startPoint: state.mapGeometry.at(0) ?? null,
    endPoint: state.mapGeometry.at(-1) ?? null,
    timeline: state.timeline,
    timezoneEvidence: state.summary.time.timezoneEvidence,
    recordingTimezone: normalizeTrackRecordingTimezone(recordingTimezone),
  };
};

export const toPublicHike = (hike: PublicHikeRecord): PublicHike => {
  const hikeDays = getHikeMapDays(hike.startDate, hike.endDate);
  const hikeDayKeys = new Set(hikeDays.map(({ key }) => key));
  const tracks = orderHikeTrackAssociations(hike.tracks);

  return {
    ...hike,
    tracks: tracks.map((association) => {
      const { metadata, fileAsset, ...track } = association.track;
      const parsedState = getTrackGpxMetadataState(metadata, {
        fileAssetId: fileAsset.id,
        fileKey: fileAsset.fileKey,
      });

      return {
        ...association,
        track: {
          ...track,
          parsed: parsedState.status === "SUCCESS" ? { summary: parsedState.summary } : null,
          map:
            parsedState.status === "SUCCESS" && parsedState.mapGeometry.length > 0
              ? {
                  title: track.title,
                  bounds: parsedState.summary.bounds,
                  geometry: parsedState.mapGeometry,
                  dayKeys: parsedState.summary.time
                    ? getTrackDayKeys({
                        start: parsedState.summary.time.start,
                        end: parsedState.summary.time.end,
                        timezoneEvidence: parsedState.summary.time.timezoneEvidence,
                        hikeDays,
                      })
                    : [],
                }
              : null,
        },
      };
    }),
    photos: hike.photos.map((association) => ({
      ...association,
      photo: {
        id: association.photo.id,
        title: association.photo.title,
        description: association.photo.description,
        status: association.photo.status,
        images: association.photo.images,
        captureInstant: getReliablePhotoCaptureInstant(association.photo.metadata),
      },
    })),
    photoMapMarkers: hike.photos.flatMap(({ photo }) => {
      const marker = toHikePhotoMapMarker({ photo, hikeDayKeys });
      return marker ? [marker] : [];
    }),
    noteMapMarkers: hike.notes.flatMap((note) => {
      if (
        note.latitude === null ||
        note.longitude === null ||
        !isValidHikeNoteCoordinate(note.latitude, note.longitude)
      )
        return [];
      return [
        {
          noteId: note.id,
          title: note.title,
          body: note.body,
          lat: note.latitude,
          lng: note.longitude,
          dayKeys: note.dayKey && hikeDayKeys.has(note.dayKey) ? [note.dayKey] : [],
        },
      ];
    }),
  };
};

export const revalidateHikePaths = (slug?: string | null) => {
  revalidatePath("/admin/hikes");
  revalidatePath("/admin/trips");
  revalidatePath("/hikes");
  revalidatePath("/trips");
  revalidatePath("/trips/invitations");
  revalidatePath("/profile");

  if (slug) {
    revalidatePath(`/hikes/${slug}`);
    revalidatePath(`/trips/${slug}`);
  }
};

export const getHikeParticipantManager = async ({ hikeId, userId }: { hikeId: string; userId: string }) => {
  const { default: prisma } = await import("@/lib/prisma");
  const [role, hike] = await Promise.all([
    currentUserRole(),
    prisma.hike.findUnique({ where: { id: hikeId }, select: { id: true, slug: true, userId: true } }),
  ]);

  if (!hike) throw new Error("Trip not found");
  if (hike.userId !== userId && !hasAdminRole(role)) throw new Error("Unauthorized to manage trip participants");

  return hike;
};

export const expireHikeParticipantIfNeeded = async ({
  id,
  status,
  expiresAt,
}: {
  id: string;
  status: HikeParticipantStatus;
  expiresAt: Date | null;
}) => {
  if (status !== "PENDING" || !expiresAt || expiresAt > new Date()) return false;

  const { default: prisma } = await import("@/lib/prisma");
  await prisma.hikeParticipant.update({ where: { id }, data: { status: "EXPIRED", respondedAt: new Date() } });
  return true;
};

export const revalidateHikeTrackAssociationPaths = ({
  hikeSlug,
  trackSlug,
}: {
  hikeSlug?: string | null;
  trackSlug?: string | null;
}) => {
  revalidateHikePaths(hikeSlug);
  revalidatePath("/admin/tracks");
  revalidatePath("/tracks");

  if (trackSlug) {
    revalidatePath(`/tracks/${trackSlug}`);
  }
};

export const revalidateHikePhotoAssociationPaths = (hikeSlug?: string | null) => {
  revalidateHikePaths(hikeSlug);
  revalidatePath("/admin/photos");
};

export const normalizeHikePhotoPositions = async (
  tx: Prisma.TransactionClient,
  hikeId: string,
  orderedPhotoIds?: string[],
) => {
  const associations = await tx.hikesToPhotos.findMany({
    where: { hikeId },
    orderBy: [{ position: "asc" }, { assignedAt: "asc" }],
    select: {
      photoId: true,
      position: true,
    },
  });
  const associationsByPhotoId = new Map(associations.map((association) => [association.photoId, association]));
  const nextPhotoIds = orderedPhotoIds
    ? [
        ...orderedPhotoIds,
        ...associations
          .map((association) => association.photoId)
          .filter((photoId) => !orderedPhotoIds.includes(photoId)),
      ]
    : associations.map((association) => association.photoId);

  await Promise.all(
    nextPhotoIds.map((photoId, index) =>
      tx.hikesToPhotos.update({
        where: {
          hikeId_photoId: {
            hikeId,
            photoId,
          },
        },
        data: {
          position: -index - 1,
        },
      }),
    ),
  );

  await Promise.all(
    nextPhotoIds.map((photoId, index) => {
      const association = associationsByPhotoId.get(photoId);

      return tx.hikesToPhotos.update({
        where: {
          hikeId_photoId: {
            hikeId,
            photoId,
          },
        },
        data: {
          position: index,
          updatedAt: association?.position === index ? undefined : new Date(),
        },
      });
    }),
  );
};

export const getEligiblePublishedHikePhoto = async ({ hikeId, photoId }: { hikeId: string; photoId: string }) => {
  const { default: prisma } = await import("@/lib/prisma");
  const association = await prisma.hikesToPhotos.findFirst({
    where: {
      hikeId,
      photoId,
      hike: { status: "PUBLISHED" },
      photo: { status: "PUBLISHED" },
    },
    select: { hike: { select: { slug: true } }, photo: { select: { userId: true } } },
  });

  if (!association) throw new Error("Photo is not available to like");
  return { hikeSlug: association.hike.slug, ownerUserId: association.photo.userId };
};

export const persistHikePhotoTrackTimeMatchCandidate = async ({
  hikeId,
  photoId,
  candidateId,
  lat,
  lng,
  reviewedByUserId,
}: {
  hikeId: string;
  photoId: string;
  candidateId: string;
  lat?: number | null;
  lng?: number | null;
  reviewedByUserId: string;
}) => {
  const { default: prisma } = await import("@/lib/prisma");
  const hike = await prisma.hike.findUnique({
    where: { id: hikeId },
    select: {
      id: true,
      title: true,
      slug: true,
      tracks: {
        where: {
          track: {
            status: "PUBLISHED",
          },
        },
        select: {
          track: {
            select: {
              id: true,
              title: true,
              slug: true,
              recordingTimezone: true,
              metadata: true,
              fileAsset: {
                select: {
                  id: true,
                  fileKey: true,
                },
              },
            },
          },
        },
      },
      photos: {
        where: {
          photoId,
          photo: {
            status: "PUBLISHED",
          },
        },
        select: {
          photo: {
            select: {
              id: true,
              title: true,
              metadata: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!hike) {
    throw new Error("Hike not found");
  }

  const photo = hike.photos.at(0)?.photo;

  if (!photo) {
    throw new Error("Published photo is not attached to this hike");
  }

  const trackInputs: TrackTimeMatchTrackInput[] = (
    hike.tracks as Array<{
      track: {
        id: string;
        title: string;
        slug?: string | null;
        recordingTimezone?: string | null;
        metadata: Prisma.JsonValue | null;
        fileAsset: { id: string; fileKey: string };
      };
    }>
  ).map((association) => toTrackTimeMatchTrackInput(association.track));
  const photoInput = toTrackTimeMatchPhotoInput({
    ...photo,
    linkedTrackTimezones: trackInputs
      .map((track) => track.recordingTimezone)
      .filter((timezone): timezone is string => Boolean(timezone)),
  });

  if (photoInput.hasDirectGps) {
    throw new Error("Photo already has direct EXIF GPS coordinates");
  }
  const candidates = proposeTrackTimeMatchCandidates(photoInput, trackInputs);
  const candidate = candidates.find((entry) => entry.id === candidateId);

  if (!candidate) {
    throw new Error("Track-time match candidate is no longer available");
  }

  const tracksById = new Map<string, TrackTimelineLookup>();

  for (const track of trackInputs) {
    tracksById.set(track.id, {
      id: track.id,
      timeline: track.timeline ?? null,
      startPoint: track.startPoint,
      endPoint: track.endPoint,
      timezoneEvidence: track.timezoneEvidence ?? null,
    });
  }

  const hasManualOverride =
    typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng);

  if (hasManualOverride && !isValidGps(lat, lng)) {
    throw new Error("Manual latitude/longitude is invalid");
  }

  if (
    !hasManualOverride &&
    !canPersistInsideTrackWithoutManualOverride(candidate, tracksById) &&
    candidate.type === "INSIDE_TRACK_WINDOW"
  ) {
    throw new Error("This track has no timed timeline; provide manual coordinates or reparse the GPX");
  }

  const resolved = hasManualOverride
    ? null
    : resolveTrackTimeMatchCoordinate(
        candidate.type === "INSIDE_TRACK_WINDOW"
          ? {
              type: "INSIDE_TRACK_WINDOW",
              trackId: candidate.trackId,
              capturedAt: candidate.capturedAt,
            }
          : candidate.type === "AFTER_TRACK_FINISH"
            ? {
                type: "AFTER_TRACK_FINISH",
                trackId: candidate.trackId,
                capturedAt: candidate.capturedAt,
                previousDayFinish: candidate.previousDayFinish,
              }
            : {
                type: "BETWEEN_ADJACENT_TRACKS",
                previousTrackId: candidate.previousTrackId,
                nextTrackId: candidate.nextTrackId,
                capturedAt: candidate.capturedAt,
                endpointDistanceMeters: candidate.endpointDistanceMeters,
              },
        tracksById,
      );

  if (!hasManualOverride && !resolved) {
    throw new Error("Unable to resolve coordinates for this candidate");
  }

  const existingMetadata = readPhotoExifMetadata(photo.metadata);

  if (!existingMetadata || existingMetadata.exifParse.status !== "SUCCESS" || !existingMetadata.summary) {
    throw new Error("Photo EXIF metadata must be successfully extracted before approving map coordinates");
  }

  const trackIds =
    candidate.type === "BETWEEN_ADJACENT_TRACKS"
      ? [candidate.previousTrackId, candidate.nextTrackId]
      : [candidate.trackId];

  const mapCoordinate: PhotoMapCoordinate = {
    lat: hasManualOverride ? lat : resolved!.lat,
    lng: hasManualOverride ? lng : resolved!.lng,
    source: hasManualOverride ? "MANUALLY_CORRECTED" : "INFERRED_TRACK_TIME",
    status: "APPROVED",
    candidateId: candidate.id,
    candidateType: candidate.type,
    placementMethod: hasManualOverride ? "MANUAL_OVERRIDE" : resolved!.placementMethod,
    trackIds,
    capturedAt: candidate.capturedAt,
    confidence: hasManualOverride ? "HIGH" : resolved!.confidence,
    explanation: candidate.explanation,
    reviewedAt: new Date().toISOString(),
    reviewedByUserId,
  };

  const nextMetadata = withPhotoMapCoordinate(existingMetadata, mapCoordinate);

  await prisma.photo.update({
    where: { id: photo.id },
    data: { metadata: nextMetadata as Prisma.InputJsonValue },
  });

  revalidateHikePhotoAssociationPaths(hike.slug);

  return { success: true, mapCoordinate };
};

export const persistHikePhotoMapCoordinateRejection = async ({
  hikeId,
  photoId,
  reviewedByUserId,
}: {
  hikeId: string;
  photoId: string;
  reviewedByUserId: string;
}) => {
  const { default: prisma } = await import("@/lib/prisma");
  const hike = await prisma.hike.findUnique({
    where: { id: hikeId },
    select: {
      id: true,
      slug: true,
      photos: {
        where: {
          photoId,
          photo: {
            status: "PUBLISHED",
          },
        },
        select: {
          photo: {
            select: {
              id: true,
              metadata: true,
            },
          },
        },
        take: 1,
      },
    },
  });

  if (!hike) {
    throw new Error("Hike not found");
  }

  const photo = hike.photos.at(0)?.photo;

  if (!photo) {
    throw new Error("Published photo is not attached to this hike");
  }

  const existingMetadata = readPhotoExifMetadata(photo.metadata);

  if (!existingMetadata) {
    throw new Error("Photo metadata is missing");
  }

  const previous = existingMetadata.mapCoordinate ?? null;
  const mapCoordinate: PhotoMapCoordinate = {
    lat: previous?.lat ?? null,
    lng: previous?.lng ?? null,
    source: previous?.source ?? "INFERRED_TRACK_TIME",
    status: "REJECTED",
    candidateId: previous?.candidateId ?? null,
    candidateType: previous?.candidateType ?? null,
    placementMethod: previous?.placementMethod ?? "UNRESOLVED",
    trackIds: previous?.trackIds ?? [],
    capturedAt: previous?.capturedAt ?? null,
    confidence: previous?.confidence ?? null,
    explanation: previous?.explanation ?? "Rejected by admin",
    reviewedAt: new Date().toISOString(),
    reviewedByUserId,
  };

  const nextMetadata = withPhotoMapCoordinate(existingMetadata, mapCoordinate);

  await prisma.photo.update({
    where: { id: photo.id },
    data: { metadata: nextMetadata as Prisma.InputJsonValue },
  });

  revalidateHikePhotoAssociationPaths(hike.slug);

  return { success: true, mapCoordinate };
};

export const normalizeHikeNote = (values: HikeNoteInput, hike: { startDate: Date; endDate: Date }) => {
  const title = normalizeRequiredText(values.title, "Note title");
  const body = normalizeOptionalText(values.body);
  const hasLatitude = values.latitude !== null && values.latitude !== undefined;
  const hasLongitude = values.longitude !== null && values.longitude !== undefined;
  if (hasLatitude !== hasLongitude) throw new Error("Latitude and longitude must be provided together");
  if (hasLatitude && !isValidHikeNoteCoordinate(values.latitude!, values.longitude!))
    throw new Error("Note coordinates are invalid");
  const status = values.status ?? "DRAFT";
  if (status !== "DRAFT" && status !== "PUBLISHED") throw new Error("Note status is invalid");
  return {
    title,
    body,
    latitude: hasLatitude ? values.latitude! : null,
    longitude: hasLongitude ? values.longitude! : null,
    dayKey: validateHikeNoteDayKey({ dayKey: values.dayKey, ...hike }),
    status,
  };
};
