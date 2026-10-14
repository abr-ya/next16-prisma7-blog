"use server";

import { revalidatePath } from "next/cache";

import { getTrackActivityTypeById } from "@/app/_data/track-activity-types";
import type { FileAssetStatus, FileAssetVisibility, HikeType, TrackStatus } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { authSession } from "@/lib/auth-utils";
import { InsufficientTrustError, requireTrustGatedAction } from "@/lib/auth-trust-gates.server";
import { assertVerifiedResourceQuota, createWithinVerifiedResourceQuota } from "@/lib/auth-trust-quotas.server";
import { validateGpxString } from "@/lib/gpx-validation";
import { createSlug } from "@/lib/slug-generator";
import {
  parseDurationSeconds,
  parseManualTrackStartAt,
  TrackDurationInputError,
  TrackStartAtParseError,
} from "@/lib/track-duration-input";
import { parseTrackGpxMetadata } from "@/lib/track-gpx-parser";
import { requireTrackRecordingTimezone } from "@/lib/track-recording-timezone";
import { uploadSyntheticTrackGpx } from "@/lib/uploadthing/server-gpx";
import { buildSyntheticGpxBytes } from "@/lib/track-synthetic-gpx";
import {
  getTrackGpxMetadataState,
  markTrackGpxMetadataStale,
  toTrackMapViewModel,
  type TrackGpxCoordinate,
  type TrackGpxSummary,
  type TrackMapViewModel,
} from "@/lib/track-gpx-metadata";

export type TrackActionValues = {
  id?: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  status?: TrackStatus;
  fileAssetId?: string | null;
  activityTypeId?: string | null;
};

export type CreateManualTrackInput = {
  title: string;
  slug?: string | null;
  description?: string | null;
  status?: TrackStatus;
  points: { lat: number; lng: number }[];
  activityTypeId?: string | null;
  recordingStartAt?: string | null;
  recordingDurationSeconds?: number | null;
  recordingTimezone?: string | null;
};

export type CreateManualTrackResult =
  | { ok: true; trackId: string; trackSlug: string }
  | { ok: false; code: "TRUST" | "QUOTA" | "SLUG" | "VALIDATION" | "INTERNAL"; message: string };

export type ManualTrackPoint = { lat: number; lng: number };

type PublicTrackRecord = Prisma.TrackGetPayload<{
  select: {
    id: true;
    title: true;
    slug: true;
    description: true;
    recordingTimezone: true;
    updatedAt: true;
    createdAt: true;
    fileAsset: {
      select: {
        id: true;
        name: true;
        fileKey: true;
        sizeBytes: true;
        status: true;
        visibility: true;
        uploadedAt: true;
        updatedAt: true;
      };
    };
    metadata: true;
    hikes: {
      select: {
        assignedAt: true;
        hike: {
          select: {
            id: true;
            title: true;
            slug: true;
            startDate: true;
            endDate: true;
            type: true;
            status: true;
          };
        };
      };
    };
  };
}>;

export type PublicTrack = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  recordingTimezone: string | null;
  updatedAt: Date;
  createdAt: Date;
  file: {
    id: string;
    name: string;
    sizeBytes: number;
    uploadedAt: Date;
    updatedAt: Date;
    downloadUrl: string | null;
    downloadAvailable: boolean;
  };
  parsed: {
    summary: TrackGpxSummary;
    mapGeometry: TrackGpxCoordinate[] | null;
  } | null;
  map: TrackMapViewModel | null;
  hikes: {
    id: string;
    title: string;
    slug: string;
    startDate: Date;
    endDate: Date;
    type: HikeType;
    assignedAt: Date;
  }[];
};

const DEFAULT_TRACK_STATUS: TrackStatus = "DRAFT";
const TRACK_STATUSES = new Set<TrackStatus>(["DRAFT", "PUBLISHED"]);
const ACTIVE_FILE_STATUS: FileAssetStatus = "ACTIVE";
const PUBLIC_DOWNLOAD_VISIBILITIES = new Set<FileAssetVisibility>(["PUBLIC", "UNLISTED"]);

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

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

const normalizeTrackSlug = (title: string, value?: string | null) => {
  const slug = createSlug(value?.trim() || title);

  if (!slug) {
    throw new Error("Slug is required");
  }

  return slug;
};

export const getTrackData = async ({
  title,
  slug,
  description,
  status,
  fileAssetId,
  activityTypeId,
}: TrackActionValues) => {
  const normalizedTitle = normalizeRequiredText(title, "Title");
  const normalizedStatus = status ?? DEFAULT_TRACK_STATUS;
  const normalizedFileAssetId = normalizeRequiredText(fileAssetId ?? "", "GPX file");

  if (!TRACK_STATUSES.has(normalizedStatus)) {
    throw new Error("Track status is invalid");
  }

  const normalizedActivityTypeId = activityTypeId?.trim() || null;
  if (normalizedActivityTypeId) {
    const { default: prisma } = await import("@/lib/prisma");
    const activityType = await prisma.trackActivityType.findFirst({
      where: { id: normalizedActivityTypeId, isActive: true },
    });
    if (!activityType) throw new Error("Activity type is unavailable");
  }

  return {
    title: normalizedTitle,
    slug: normalizeTrackSlug(normalizedTitle, slug),
    description: normalizeOptionalText(description),
    status: normalizedStatus,
    fileAssetId: normalizedFileAssetId,
    activityTypeId: normalizedActivityTypeId,
  };
};

export const ensureSlugAvailable = async ({ slug, id }: { slug: string; id?: string }) => {
  const { default: prisma } = await import("@/lib/prisma");
  const existingTrack = await prisma.track.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingTrack && existingTrack.id !== id) {
    throw new Error("A track with this slug already exists");
  }
};

export const ensureEligibleTrackFileAsset = async ({
  fileAssetId,
  userId,
  trackId,
}: {
  fileAssetId: string;
  userId: string;
  trackId?: string;
}) => {
  const { default: prisma } = await import("@/lib/prisma");
  const fileAsset = await prisma.fileAsset.findFirst({
    where: {
      id: fileAssetId,
      ownerUserId: userId,
      purpose: "TRACK_GPX",
      status: ACTIVE_FILE_STATUS,
    },
    select: {
      id: true,
      fileKey: true,
      url: true,
      track: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!fileAsset) {
    throw new Error("Selected GPX file is not eligible for tracks");
  }

  if (fileAsset.track && fileAsset.track.id !== trackId) {
    throw new Error("Selected GPX file is already linked to another track");
  }

  return fileAsset;
};

const trackListInclude = {
  activityType: true,
  fileAsset: true,
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  hikes: {
    orderBy: {
      assignedAt: "desc",
    },
    include: {
      hike: {
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          type: true,
          status: true,
        },
      },
    },
  },
} satisfies Prisma.TrackInclude;

export type TrackListItem = Prisma.TrackGetPayload<{
  include: typeof trackListInclude;
}>;

const publicTrackSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  recordingTimezone: true,
  updatedAt: true,
  createdAt: true,
  metadata: true,
  hikes: {
    where: {
      hike: {
        status: "PUBLISHED",
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
    select: {
      assignedAt: true,
      hike: {
        select: {
          id: true,
          title: true,
          slug: true,
          startDate: true,
          endDate: true,
          type: true,
          status: true,
        },
      },
    },
  },
  fileAsset: {
    select: {
      id: true,
      name: true,
      fileKey: true,
      sizeBytes: true,
      status: true,
      visibility: true,
      uploadedAt: true,
      updatedAt: true,
    },
  },
} satisfies Prisma.TrackSelect;

const toPublicTrack = (
  track: PublicTrackRecord,
  { includeMapGeometry }: { includeMapGeometry: boolean },
): PublicTrack => {
  const downloadAvailable =
    track.fileAsset.status === ACTIVE_FILE_STATUS && PUBLIC_DOWNLOAD_VISIBILITIES.has(track.fileAsset.visibility);
  const parsedState = getTrackGpxMetadataState(track.metadata, {
    fileAssetId: track.fileAsset.id,
    fileKey: track.fileAsset.fileKey,
  });

  return {
    id: track.id,
    title: track.title,
    slug: track.slug,
    description: track.description,
    recordingTimezone: track.recordingTimezone,
    updatedAt: track.updatedAt,
    createdAt: track.createdAt,
    file: {
      id: track.fileAsset.id,
      name: track.fileAsset.name,
      sizeBytes: track.fileAsset.sizeBytes,
      uploadedAt: track.fileAsset.uploadedAt,
      updatedAt: track.fileAsset.updatedAt,
      downloadUrl: downloadAvailable ? `/files/${track.fileAsset.id}/download` : null,
      downloadAvailable,
    },
    parsed:
      parsedState.status === "SUCCESS"
        ? {
            summary: parsedState.summary,
            mapGeometry: includeMapGeometry ? parsedState.mapGeometry : null,
          }
        : null,
    map: includeMapGeometry
      ? toTrackMapViewModel(track.title, track.metadata, {
          fileAssetId: track.fileAsset.id,
          fileKey: track.fileAsset.fileKey,
        })
      : null,
    hikes: track.hikes.map((association) => ({
      id: association.hike.id,
      title: association.hike.title,
      slug: association.hike.slug,
      startDate: association.hike.startDate,
      endDate: association.hike.endDate,
      type: association.hike.type,
      assignedAt: association.assignedAt,
    })),
  };
};

const fetchTrackGpxContent = async (url: string) => {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error("Unable to read GPX file from storage");
    }

    return response.text();
  } catch {
    throw new Error("Unable to read GPX file from storage");
  }
};

const revalidateTrackPaths = () => {
  revalidatePath("/admin/tracks");
  revalidatePath("/my/tracks");
  revalidatePath("/admin/files");
  revalidatePath("/tracks");
  revalidatePath("/hikes");
};

const revalidateTrackDetailPaths = (slug?: string | null) => {
  revalidateTrackPaths();

  if (slug) revalidatePath(`/tracks/${slug}`);
};

export const getAllTracks = async (): Promise<TrackListItem[]> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.track.findMany({
    where: { userId },
    include: trackListInclude,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
};

/**
 * Trip-side candidate list for the `Attach existing` section of the trip
 * contribution dialog. Returns the actor's own tracks that are not currently
 * linked to any trip, projected to the minimum needed by the dialog. Ordered
 * by most recently updated first.
 */
type CreatorUnlinkedTrackRecord = {
  id: string;
  title: string;
  slug: string;
  updatedAt: Date;
  metadata: Prisma.JsonValue | null;
};

export type CreatorUnlinkedTrack = {
  id: string;
  title: string;
  slug: string;
  updatedAt: Date;
  parseState: "PARSED" | "NOT_PARSED";
};

export const getCreatorUnlinkedTracks = async (userId: string): Promise<CreatorUnlinkedTrack[]> => {
  const { default: prisma } = await import("@/lib/prisma");

  const records = (await prisma.track.findMany({
    where: {
      userId,
      hikes: { none: {} },
    },
    select: {
      id: true,
      title: true,
      slug: true,
      updatedAt: true,
      metadata: true,
    },
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  })) as CreatorUnlinkedTrackRecord[];

  return records.map((record) => {
    const state = getTrackGpxMetadataState(record.metadata);
    return {
      id: record.id,
      title: record.title,
      slug: record.slug,
      updatedAt: record.updatedAt,
      parseState: (state.status === "SUCCESS" ? "PARSED" : "NOT_PARSED") as "PARSED" | "NOT_PARSED",
    };
  });
};

export const getActiveTrackActivityTypes = async () => {
  const { default: prisma } = await import("@/lib/prisma");
  return prisma.trackActivityType.findMany({
    where: { isActive: true },
    orderBy: [{ nameEn: "asc" }, { nameRu: "asc" }],
  });
};

export const getTrackById = async (id: string): Promise<TrackListItem | null> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.track.findFirst({
    where: { id, userId },
    include: trackListInclude,
  });
};

export const getPublicTracks = async (): Promise<PublicTrack[]> => {
  const { default: prisma } = await import("@/lib/prisma");
  const tracks = (await prisma.track.findMany({
    where: { status: "PUBLISHED" },
    select: publicTrackSelect,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  })) as PublicTrackRecord[];

  return tracks.map((track) => toPublicTrack(track, { includeMapGeometry: false }));
};

export const getPublicTrackBySlug = async (slug: string): Promise<PublicTrack | null> => {
  const { default: prisma } = await import("@/lib/prisma");
  const track = (await prisma.track.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: publicTrackSelect,
  })) as PublicTrackRecord | null;

  return track ? toPublicTrack(track, { includeMapGeometry: true }) : null;
};

export const createTrack = async (values: TrackActionValues) => {
  const user = await requireTrustGatedAction("track-upload");
  const userId = user.id;
  const data = await getTrackData(values);
  await ensureSlugAvailable({ slug: data.slug });
  await ensureEligibleTrackFileAsset({ fileAssetId: data.fileAssetId, userId });

  const track = await createWithinVerifiedResourceQuota(user, "track", (tx) =>
    tx.track.create({
      data: {
        ...data,
        userId,
        // Every GPX-uploaded track is GPX-sourced. The post-commit
        // `parseTrackGpx` hook re-asserts this on every (re-)parse so the
        // write here is the create-time guarantee that `timeSource` is never
        // null between create and parse.
        timeSource: "GPX",
      },
      include: trackListInclude,
    }),
  );

  revalidateTrackPaths();

  return track;
};

export const updateTrack = async (values: TrackActionValues) => {
  if (!values.id) {
    throw new Error("Track id is required");
  }

  const userId = await getRequiredUserId();
  const data = await getTrackData(values);
  const { default: prisma } = await import("@/lib/prisma");
  const existingTrack = await prisma.track.findFirst({
    where: { id: values.id, userId },
    select: {
      id: true,
      metadata: true,
      fileAssetId: true,
      fileAsset: {
        select: {
          fileKey: true,
        },
      },
    },
  });

  if (!existingTrack) {
    throw new Error("Track not found");
  }

  await ensureSlugAvailable({ slug: data.slug, id: existingTrack.id });
  const fileAsset = await ensureEligibleTrackFileAsset({
    fileAssetId: data.fileAssetId,
    userId,
    trackId: existingTrack.id,
  });
  const staleMetadata =
    existingTrack.fileAssetId !== data.fileAssetId || existingTrack.fileAsset.fileKey !== fileAsset.fileKey
      ? markTrackGpxMetadataStale(existingTrack.metadata, fileAsset.id, fileAsset.fileKey)
      : null;

  const track = await prisma.track.update({
    where: { id: existingTrack.id },
    data: {
      ...data,
      ...(staleMetadata ? { metadata: staleMetadata as Prisma.InputJsonValue } : {}),
    },
    include: trackListInclude,
  });

  revalidateTrackDetailPaths(track.slug);

  return track;
};

export const updateTrackRecordingTimezone = async ({
  id,
  recordingTimezone,
}: {
  id: string;
  recordingTimezone: string;
}) => {
  const userId = await getRequiredUserId();
  const timezone = requireTrackRecordingTimezone(recordingTimezone);
  const { default: prisma } = await import("@/lib/prisma");
  const existingTrack = await prisma.track.findFirst({
    where: { id, userId },
    select: {
      id: true,
      slug: true,
      hikes: {
        select: {
          hike: {
            select: { slug: true },
          },
        },
      },
    },
  });

  if (!existingTrack) throw new Error("Track not found");

  const track = await prisma.track.update({
    where: { id: existingTrack.id },
    data: { recordingTimezone: timezone },
    include: trackListInclude,
  });

  revalidateTrackDetailPaths(track.slug);
  for (const association of existingTrack.hikes) {
    revalidatePath(`/hikes/${association.hike.slug}`);
  }

  return track;
};

export const parseTrackGpx = async (id: string) => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const track = await prisma.track.findFirst({
    where: { id, userId },
    select: {
      id: true,
      slug: true,
      fileAsset: {
        select: {
          id: true,
          fileKey: true,
          url: true,
          purpose: true,
          status: true,
        },
      },
    },
  });

  if (!track) {
    throw new Error("Track not found");
  }

  if (track.fileAsset.purpose !== "TRACK_GPX" || track.fileAsset.status !== ACTIVE_FILE_STATUS) {
    throw new Error("Selected GPX file is not eligible for tracks");
  }

  const content = await fetchTrackGpxContent(track.fileAsset.url).catch(() => "");
  const metadata = parseTrackGpxMetadata({
    content,
    sourceFileAssetId: track.fileAsset.id,
    sourceFileKey: track.fileAsset.fileKey,
  });
  const metadataToPersist =
    content.length > 0
      ? metadata
      : {
          ...metadata,
          gpxParse: {
            ...metadata.gpxParse,
            errorMessage: "Unable to read GPX file from storage",
          },
        };

  await prisma.track.update({
    where: { id: track.id },
    data: {
      metadata: metadataToPersist as Prisma.InputJsonValue,
      // Every parse (success, failed, stale, re-parse) re-asserts that this
      // row is GPX-sourced — the source-of-time classification is orthogonal
      // to whether the GPX actually carried `<time>` elements. The write
      // happens before any success/failed branching on the metadata so all
      // three outcomes converge on the same value.
      timeSource: "GPX",
    },
  });

  revalidateTrackDetailPaths(track.slug);

  return metadataToPersist;
};

export const deleteTrack = async (id: string) => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const existingTrack = await prisma.track.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existingTrack) {
    return { success: false };
  }

  await prisma.track.delete({
    where: { id: existingTrack.id },
  });

  revalidateTrackPaths();

  return { success: true };
};

class ManualTrackSlugConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualTrackSlugConflictError";
  }
}

class ManualTrackValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ManualTrackValidationError";
  }
}

/**
 * Create a new `Track` row from points placed on a map (feature-111's
 * "Place on map" tab). The flow:
 *
 *   1. Gate the actor on the existing `track-upload` trust action and the
 *      verified `track` quota (10).
 *   2. Build a synthetic GPX 1.1 byte string from the placed points
 *      (no `<time>` elements — manual tracks have no recording time).
 *   3. Validate the synthetic bytes with `validateGpxString` (root `<gpx>`,
 *      at least one parseable `<trkpt>`) and reject invalid inputs.
 *   4. Upload the bytes via `uploadSyntheticTrackGpx` (server-side UploadThing
 *      write path) and persist a `FileAsset` row with
 *      `purpose: TRACK_GPX`, `ownerUserId: actor.id`, `visibility: PRIVATE`,
 *      `status: ACTIVE`. `visibility: PRIVATE` intentionally fails the
 *      public-track-detail download affordance so manual tracks never expose
 *      the synthetic GPX as a downloadable artifact.
 *   5. Create the `Track` row bound to that file asset.
 *   6. After commit, call `parseTrackGpx(trackId).catch(() => null)` outside
 *      the transaction so a parse failure does not roll back the successful
 *      write — it just leaves the metadata in the "stale" state for the
 *      user to reparse.
 *
 * Returns a discriminated `CreateManualTrackResult` mirroring
 * `createTrackAndAttachToHike` so the client can map the same `code`
 * vocabulary into localized toast messages.
 */
export const createManualTrack = async (input: CreateManualTrackInput): Promise<CreateManualTrackResult> => {
  try {
    const user = await requireTrustGatedAction("track-upload");
    const userId = user.id;
    const { default: prisma } = await import("@/lib/prisma");

    if (!Array.isArray(input.points) || input.points.length < 2) {
      return { ok: false, code: "VALIDATION", message: "Place at least two points on the map" };
    }

    for (const point of input.points) {
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
        return { ok: false, code: "VALIDATION", message: "Placed points have invalid coordinates" };
      }
    }

    const normalizedTitle = normalizeRequiredText(input.title, "Title");
    const normalizedStatus = input.status ?? DEFAULT_TRACK_STATUS;
    if (!TRACK_STATUSES.has(normalizedStatus)) {
      return { ok: false, code: "VALIDATION", message: "Track status is invalid" };
    }
    const normalizedSlug = normalizeTrackSlug(normalizedTitle, input.slug ?? null);
    const normalizedDescription = normalizeOptionalText(input.description);

    // feature-112 Place on map tab fields: activity type + recording time
    // + duration + timezone. None are required; when start is set the
    // timezone must also be set. `timeSource` is derived: any of start or
    // duration set → MANUAL, else NONE.
    const normalizedActivityTypeId = input.activityTypeId?.trim() || null;
    if (normalizedActivityTypeId) {
      const activityType = await getTrackActivityTypeById(normalizedActivityTypeId);
      if (!activityType) {
        return { ok: false, code: "VALIDATION", message: "Activity type is unavailable" };
      }
    }

    const trimmedStart = input.recordingStartAt?.trim();
    const hasStart = Boolean(trimmedStart);
    const hasDuration = input.recordingDurationSeconds !== undefined && input.recordingDurationSeconds !== null;

    let normalizedRecordingStartAt: Date | null = null;
    let normalizedRecordingDurationSeconds: number | null = null;
    let normalizedRecordingTimezone: string | null = null;

    if (hasStart || hasDuration) {
      if (hasStart) {
        if (!input.recordingTimezone || !input.recordingTimezone.trim()) {
          return {
            ok: false,
            code: "VALIDATION",
            message: "Recording timezone is required when start time is set",
          };
        }
        try {
          normalizedRecordingStartAt = parseManualTrackStartAt({
            wallClock: trimmedStart!,
            timezone: input.recordingTimezone,
          });
          normalizedRecordingTimezone = requireTrackRecordingTimezone(input.recordingTimezone);
        } catch (error) {
          if (error instanceof TrackStartAtParseError) {
            return { ok: false, code: "VALIDATION", message: error.message };
          }
          throw error;
        }
      }

      if (hasDuration) {
        try {
          normalizedRecordingDurationSeconds = parseDurationSeconds(input.recordingDurationSeconds!);
        } catch (error) {
          if (error instanceof TrackDurationInputError) {
            return { ok: false, code: "VALIDATION", message: error.message };
          }
          throw error;
        }
      }
    }

    const computedTimeSource: "MANUAL" | "NONE" = hasStart || hasDuration ? "MANUAL" : "NONE";

    const gpxBytes = buildSyntheticGpxBytes(normalizedTitle, input.points);
    const gpxValidation = validateGpxString(gpxBytes);
    if (!gpxValidation.ok) {
      const reason =
        gpxValidation.reason === "no-gpx-root"
          ? "Synthetic GPX is missing a <gpx> root element"
          : gpxValidation.reason === "invalid-coordinates"
            ? "Synthetic GPX has no usable coordinates"
            : "Synthetic GPX has no track points";
      return { ok: false, code: "VALIDATION", message: reason };
    }

    let uploadResult: Awaited<ReturnType<typeof uploadSyntheticTrackGpx>>;
    try {
      uploadResult = await uploadSyntheticTrackGpx({
        bytes: gpxBytes,
        ownerUserId: userId,
        filename: `${normalizedSlug}.gpx`,
      });
    } catch (error) {
      throw new ManualTrackValidationError(error instanceof Error ? error.message : "Synthetic GPX upload failed");
    }

    const { id: trackId, slug: trackSlug } = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await assertVerifiedResourceQuota(tx, user, "track");
      try {
        await ensureSlugAvailable({ slug: normalizedSlug });
      } catch (error) {
        const message = error instanceof Error ? error.message : "Slug is unavailable";
        if (message.toLowerCase().includes("slug")) {
          throw new ManualTrackSlugConflictError(message);
        }
        throw new ManualTrackValidationError(message);
      }

      const fileAsset = await tx.fileAsset.create({
        data: {
          provider: "UPLOADTHING",
          fileKey: uploadResult.key,
          customId: null,
          url: uploadResult.url,
          name: uploadResult.name,
          mimeType: "application/gpx+xml",
          sizeBytes: uploadResult.sizeBytes,
          purpose: "TRACK_GPX",
          visibility: "PRIVATE",
          status: ACTIVE_FILE_STATUS,
          ownerUserId: userId,
        },
        select: { id: true },
      });

      return tx.track.create({
        data: {
          title: normalizedTitle,
          slug: normalizedSlug,
          description: normalizedDescription,
          status: normalizedStatus,
          fileAssetId: fileAsset.id,
          userId,
          activityTypeId: normalizedActivityTypeId,
          recordingStartAt: normalizedRecordingStartAt,
          recordingDurationSeconds: normalizedRecordingDurationSeconds,
          recordingTimezone: normalizedRecordingTimezone,
          timeSource: computedTimeSource,
          metadata: Prisma.JsonNull,
        },
        select: { id: true, slug: true },
      });
    });

    // Parse outside the transaction so a parse failure does not roll back
    // the successful track write — it just leaves the metadata in the
    // "stale" state for the user to reparse.
    await parseTrackGpx(trackId).catch(() => null);

    revalidateTrackPaths();

    return { ok: true, trackId, trackSlug };
  } catch (error) {
    if (error instanceof InsufficientTrustError) {
      return { ok: false, code: "TRUST", message: error.message };
    }
    if (error instanceof ManualTrackSlugConflictError) {
      return { ok: false, code: "SLUG", message: error.message };
    }
    if (error instanceof ManualTrackValidationError) {
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
      message: error instanceof Error ? error.message : "Could not create track",
    };
  }
};
