"use server";

import { revalidatePath } from "next/cache";

import { getTrackActivityTypeById } from "@/app/_data/track-activity-types";
import type {
  FileAssetStatus,
  FileAssetVisibility,
  HikeType,
  TrackKind,
  TrackStatus,
  TrackTimeSource,
} from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import { authSession } from "@/lib/auth-utils";
import { InsufficientTrustError, requireTrustGatedAction } from "@/lib/auth-trust-gates.server";
import { assertVerifiedResourceQuota, createWithinVerifiedResourceQuota } from "@/lib/auth-trust-quotas.server";
import { gearFitsActivityType } from "@/lib/gear";
import { validateGpxString } from "@/lib/gpx-validation";
import { createSlug } from "@/lib/slug-generator";
import {
  parseDurationSeconds,
  parseManualTrackStartAt,
  TrackDurationInputError,
  TrackStartAtParseError,
} from "@/lib/track-duration-input";
import { parseTrackGpxMetadata, parseTrackGpxUtcOffsetMinutes } from "@/lib/track-gpx-parser";
import {
  requireTrackRecordingTimezone,
  resolveQuickWorkoutRecordingTimezone,
  toRecordingTimezoneFromUtcOffset,
} from "@/lib/track-recording-timezone";
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
  // feature-122: the gear the owner ran the track in. The three states are
  // deliberate: `undefined` leaves the attachment alone, `null` clears it,
  // and an id attaches that item.
  gearId?: string | null;
  kind?: TrackKind;
};

export type CreateManualTrackInput = {
  title: string;
  slug?: string | null;
  description?: string | null;
  status?: TrackStatus;
  points: { lat: number; lng: number }[];
  activityTypeId?: string | null;
  kind?: TrackKind;
  // feature-122: the gear the track was run in. Optional — a track without
  // an attachment is the normal case.
  gearId?: string | null;
  recordingStartAt?: string | null;
  recordingDurationSeconds?: number | null;
  recordingTimezone?: string | null;
};

export type CreateManualTrackResult =
  | { ok: true; trackId: string; trackSlug: string }
  | { ok: false; code: "TRUST" | "QUOTA" | "SLUG" | "VALIDATION" | "INTERNAL"; message: string };

/**
 * feature-123: the quick upload creates a workout from one file, so it sends
 * no points, no status and no kind — the action fills those in.
 */
export type CreateQuickWorkoutInput = {
  /** The uploaded GPX file asset. */
  fileAssetId: string;
  /** The activity type the button was bound to. */
  activityTypeId: string;
  title: string;
  /** The slug base the browser proposed; the server makes it unique. */
  slug?: string | null;
  /** The owner's own gear for the activity type; optional. */
  gearId?: string | null;
  /**
   * feature-124: the owner asks to remember the attached gear as the
   * preferred one for this activity type. The flag is honoured only when a
   * gear item is actually attached, and the preference is written in the same
   * transaction as the workout.
   */
  rememberGearAsPreferred?: boolean;
  /**
   * The timezone of the device the upload was made from. It is the fallback
   * for a file that names no UTC offset — the device is then the only
   * reference there is. It is validated the way any other recording timezone
   * is, and an unsupported value leaves the track's timezone unset.
   */
  deviceTimezone?: string | null;
};

/** The quick upload answers with the same vocabulary as `createManualTrack`. */
export type CreateQuickWorkoutResult = CreateManualTrackResult;

export type ManualTrackPoint = { lat: number; lng: number };

type PublicTrackRecord = Prisma.TrackGetPayload<{
  select: {
    id: true;
    title: true;
    slug: true;
    description: true;
    recordingTimezone: true;
    recordingStartAt: true;
    recordingDurationSeconds: true;
    timeSource: true;
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
  recordingStartAt: Date | null;
  recordingDurationSeconds: number | null;
  timeSource: TrackTimeSource | null;
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
// feature-120: a track is a route until its owner says otherwise. The kind
// answers "what is this track for" — a training session versus a route —
// and is deliberately private: the public read path never selects it.
const DEFAULT_TRACK_KIND: TrackKind = "ROUTE";
const TRACK_KINDS = new Set<TrackKind>(["ROUTE", "TRAINING"]);
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
  kind,
}: TrackActionValues) => {
  const normalizedTitle = normalizeRequiredText(title, "Title");
  const normalizedStatus = status ?? DEFAULT_TRACK_STATUS;
  const normalizedFileAssetId = normalizeRequiredText(fileAssetId ?? "", "GPX file");

  if (!TRACK_STATUSES.has(normalizedStatus)) {
    throw new Error("Track status is invalid");
  }

  // feature-120: the kind defaults to a route, so a caller that does not
  // know about the column keeps the pre-feature behaviour.
  const normalizedKind = kind ?? DEFAULT_TRACK_KIND;
  if (!TRACK_KINDS.has(normalizedKind)) {
    throw new Error("Track kind is invalid");
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
    kind: normalizedKind,
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

/**
 * feature-122: the gear a track may be attached to.
 *
 * The Prisma client is created through `require` in `lib/prisma.ts`, so the
 * result of a query is not inferred. This selection is typed by hand so the
 * linked activity types are known to be a list of ids.
 */
const trackGearSelect = {
  id: true,
  name: true,
  activityTypes: { select: { activityTypeId: true } },
} satisfies Prisma.GearSelect;

type TrackGearRecord = Prisma.GearGetPayload<{ select: typeof trackGearSelect }>;

/**
 * feature-122: the gear attached to a track has to be the owner's own, and it
 * has to fit the track's activity type. A missing row and somebody else's row
 * are refused with the same message, so the existence of another owner's gear
 * is never disclosed — the refusal reads as "not available", not as "belongs
 * to somebody else".
 *
 * The compatibility rule itself lives in `lib/gear.ts`, so the preference path
 * of feature-124 applies the same rule instead of a second copy of it.
 */
const ensureEligibleTrackGear = async ({
  gearId,
  userId,
  activityTypeId,
}: {
  gearId: string | null | undefined;
  userId: string;
  activityTypeId?: string | null;
}) => {
  const normalizedGearId = gearId?.trim() || null;

  if (!normalizedGearId) return null;

  const { default: prisma } = await import("@/lib/prisma");
  const gear: TrackGearRecord = await prisma.gear.findFirst({
    where: { id: normalizedGearId, userId },
    select: trackGearSelect,
  });

  if (!gear) throw new Error("Selected gear is not available");

  const fits = gearFitsActivityType(
    gear.activityTypes.map((link) => link.activityTypeId),
    activityTypeId,
  );

  if (!fits) throw new Error(`"${gear.name}" does not fit this activity type`);

  return gear;
};

const trackListSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  status: true,
  fileAssetId: true,
  activityTypeId: true,
  kind: true,
  metadata: true,
  recordingTimezone: true,
  recordingStartAt: true,
  recordingDurationSeconds: true,
  timeSource: true,
  updatedAt: true,
  createdAt: true,
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
} satisfies Prisma.TrackSelect;

export type TrackListItem = Prisma.TrackGetPayload<{
  select: typeof trackListSelect;
}> & {
  // feature-122: the attached gear item is part of the row only when the
  // caller asked for the projection — the administrative listing reads the
  // rows without it and stays free of gear names.
  gear?: { id: string; name: string } | null;
};

/**
 * feature-122: the attachment is projected only when a caller asks for it, so
 * the gear of an owner never rides along in a payload that has no business
 * carrying it — the administrative listing keeps calling the query without the
 * projection and stays free of gear names.
 */
const trackListSelectWithGear = {
  ...trackListSelect,
  gear: { select: { id: true, name: true } },
} satisfies Prisma.TrackSelect;

export type TrackListItemWithGear = Prisma.TrackGetPayload<{
  select: typeof trackListSelectWithGear;
}>;

const publicTrackSelect = {
  id: true,
  title: true,
  slug: true,
  description: true,
  recordingTimezone: true,
  recordingStartAt: true,
  recordingDurationSeconds: true,
  timeSource: true,
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
    recordingStartAt: track.recordingStartAt,
    recordingDurationSeconds: track.recordingDurationSeconds,
    timeSource: track.timeSource,
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

/**
 * The metadata a track row carries for a GPX file, parsed from the file's
 * content.
 *
 * A file that could not be read from storage leaves the row in the state the
 * owner can repair from the track form: the parse failed, and the reason says
 * why. The owner re-parses it there. Every other parse result is persisted as
 * it is.
 */
const buildTrackGpxMetadata = ({
  content,
  fileAssetId,
  fileKey,
}: {
  content: string;
  fileAssetId: string;
  fileKey: string;
}) => {
  const metadata = parseTrackGpxMetadata({
    content,
    sourceFileAssetId: fileAssetId,
    sourceFileKey: fileKey,
  });

  if (content.length > 0) return metadata;

  return {
    ...metadata,
    gpxParse: {
      ...metadata.gpxParse,
      errorMessage: "Unable to read GPX file from storage",
    },
  };
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

export const getAllTracks = async ({ includeGear = false }: { includeGear?: boolean } = {}): Promise<
  TrackListItem[]
> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  if (includeGear) {
    return prisma.track.findMany({
      where: { userId },
      select: trackListSelectWithGear,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
  }

  return prisma.track.findMany({
    where: { userId },
    select: trackListSelect,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
};

/**
 * feature-120: the owner's workouts — the tracks they marked as training
 * sessions. Owner-scoped like every other personal track query; the kind
 * filter narrows it in SQL rather than in the table.
 */
export const getOwnerWorkoutTracks = async ({ includeGear = false }: { includeGear?: boolean } = {}): Promise<
  TrackListItem[]
> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  if (includeGear) {
    return prisma.track.findMany({
      where: { userId, kind: "TRAINING" },
      select: trackListSelectWithGear,
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
  }

  return prisma.track.findMany({
    where: { userId, kind: "TRAINING" },
    select: trackListSelect,
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
    select: trackListSelect,
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
  const gear = await ensureEligibleTrackGear({ gearId: values.gearId, userId, activityTypeId: data.activityTypeId });

  const track = await createWithinVerifiedResourceQuota(user, "track", (tx) =>
    tx.track.create({
      data: {
        ...data,
        userId,
        // feature-122: the gear is written with the row, or left empty when
        // the owner did not pick one.
        gearId: gear?.id ?? null,
        // Every GPX-uploaded track is GPX-sourced. The post-commit
        // `parseTrackGpx` hook re-asserts this on every (re-)parse so the
        // write here is the create-time guarantee that `timeSource` is never
        // null between create and parse.
        timeSource: "GPX",
      },
      select: trackListSelect,
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
      gearId: true,
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
  // feature-122: the attachment that this update ends up with is the one the
  // caller names, or the one the track already carries when the caller says
  // nothing about it. Either way it is checked against the activity type
  // this very update writes — so a change of the activity type to one the
  // attached shoes do not fit is refused rather than silently kept.
  const effectiveGearId = values.gearId === undefined ? existingTrack.gearId : values.gearId;
  const gear = await ensureEligibleTrackGear({
    gearId: effectiveGearId,
    userId,
    activityTypeId: data.activityTypeId,
  });
  const staleMetadata =
    existingTrack.fileAssetId !== data.fileAssetId || existingTrack.fileAsset.fileKey !== fileAsset.fileKey
      ? markTrackGpxMetadataStale(existingTrack.metadata, fileAsset.id, fileAsset.fileKey)
      : null;

  const track = await prisma.track.update({
    where: { id: existingTrack.id },
    data: {
      ...data,
      // feature-120: the kind is written only when the caller sends one. An
      // update that does not know about the column must not demote a
      // workout back to a route, and `undefined` means "leave unchanged" in
      // a Prisma update.
      ...(values.kind ? { kind: data.kind } : { kind: undefined }),
      // feature-122: the same three states as in `createTrack` — `undefined`
      // keeps the attachment, `null` clears it, an id replaces it.
      ...(values.gearId !== undefined ? { gearId: gear?.id ?? null } : { gearId: undefined }),
      ...(staleMetadata ? { metadata: staleMetadata as Prisma.InputJsonValue } : {}),
    },
    select: trackListSelect,
  });

  revalidateTrackDetailPaths(track.slug);

  return track;
};

export const updateTrackRecordingTimezone = async ({
  id,
  recordingTimezone,
}: {
  id: string;
  recordingTimezone: string | null;
}) => {
  const userId = await getRequiredUserId();
  // feature-123: a cleared field means "no confirmed timezone" — the recording
  // goes back to the unconfirmed state rather than keeping a stale zone.
  const timezone = recordingTimezone === null ? null : requireTrackRecordingTimezone(recordingTimezone);
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
    select: trackListSelect,
  });

  revalidateTrackDetailPaths(track.slug);
  for (const association of existingTrack.hikes) {
    revalidatePath(`/hikes/${association.hike.slug}`);
  }

  return track;
};

export type UpdateTrackRecordingMetadataInput = {
  id: string;
  recordingStartAt: string | null;
  recordingDurationSeconds: number | null;
  recordingTimezone: string | null;
};

export type UpdateTrackRecordingMetadataResult =
  | { ok: true; track: TrackListItem }
  | { ok: false; code: "NOT_FOUND" | "WRONG_SOURCE" | "VALIDATION"; message: string };

/**
 * Update the four manual recording-metadata columns on a `Track` whose
 * `Track.timeSource === "MANUAL"`. The action enforces the same ownership
 * and trust gate the other track mutations already enforce, and rejects
 * GPX / NONE rows so the column values stay aligned with the
 * source-of-truth classification set at creation / parse time.
 *
 * Validation runs through `parseManualTrackStartAt` (when both
 * `recordingStartAt` and `recordingTimezone` are non-empty) and
 * `parseDurationSeconds` (when `recordingDurationSeconds` is non-null);
 * either may throw a `TrackStartAtParseError` or
 * `TrackDurationInputError`, which surface as `{ ok: false, code: "VALIDATION" }`.
 */
export const updateTrackRecordingMetadata = async (
  input: UpdateTrackRecordingMetadataInput,
): Promise<UpdateTrackRecordingMetadataResult> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const existingTrack = await prisma.track.findFirst({
    where: { id: input.id, userId },
    select: {
      id: true,
      slug: true,
      timeSource: true,
      hikes: {
        select: {
          hike: {
            select: { slug: true },
          },
        },
      },
    },
  });

  if (!existingTrack) {
    return { ok: false, code: "NOT_FOUND", message: "Track not found" };
  }

  if (existingTrack.timeSource !== "MANUAL") {
    return {
      ok: false,
      code: "WRONG_SOURCE",
      message: "Recording metadata can only be edited on manual tracks",
    };
  }

  const trimmedStart = input.recordingStartAt?.trim() ?? "";
  const trimmedTimezone = input.recordingTimezone?.trim() ?? "";
  const hasStart = trimmedStart.length > 0;
  const hasTimezone = trimmedTimezone.length > 0;
  const hasDuration = input.recordingDurationSeconds !== null && input.recordingDurationSeconds !== undefined;

  let normalizedRecordingStartAt: Date | null = null;
  let normalizedRecordingDurationSeconds: number | null = null;
  let normalizedRecordingTimezone: string | null = null;

  if (hasStart) {
    if (!hasTimezone) {
      return {
        ok: false,
        code: "VALIDATION",
        message: "Recording timezone is required when start time is set",
      };
    }
    try {
      normalizedRecordingStartAt = parseManualTrackStartAt({
        wallClock: trimmedStart,
        timezone: trimmedTimezone,
      });
      normalizedRecordingTimezone = requireTrackRecordingTimezone(trimmedTimezone);
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

  const track = await prisma.track.update({
    where: { id: existingTrack.id },
    data: {
      recordingStartAt: normalizedRecordingStartAt,
      recordingDurationSeconds: normalizedRecordingDurationSeconds,
      recordingTimezone: normalizedRecordingTimezone,
    },
    select: trackListSelect,
  });

  revalidateTrackDetailPaths(track.slug);
  for (const association of existingTrack.hikes) {
    revalidatePath(`/hikes/${association.hike.slug}`);
  }

  return { ok: true, track };
};

export type MarkTrackAsManualInput = {
  id: string;
};

export type MarkTrackAsManualResult =
  | { ok: true; track: TrackListItem }
  | { ok: false; code: "NOT_FOUND" | "ALREADY_MANUAL"; message: string };

/**
 * feature-116 follow-up: explicit transition for rows whose `timeSource` is
 * misclassified. Two cases trigger the click:
 *   1. a legacy row created through the `Place on map` flow that was
 *      re-asserted to `GPX` by an earlier `parseTrackGpx` call before the
 *      parse-time preserve fix landed (it has at least one recording column
 *      populated and an "owner has supplied timing" badge reads as `GPX`),
 *   2. a `GPX` row with no `<time>` elements (all three recording columns
 *      are `null`) — such a row is also misclassified, since the absence of
 *      any timed timeline is the same evidence the system uses to render the
 *      `No timed timeline` fallback. Reclassifying it to `MANUAL` lets the
 *      owner fill the columns in the edit form afterwards.
 *
 * The action does NOT require at least one populated recording column —
 * the call short-circuits to `ALREADY_MANUAL` when the row is already
 * `MANUAL` to keep the UX idempotent, and rejects with `NOT_FOUND` for
 * non-owned rows. `parseTrackGpx` never performs this transition on its own.
 */
export const markTrackAsManual = async (input: MarkTrackAsManualInput): Promise<MarkTrackAsManualResult> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const existingTrack = await prisma.track.findFirst({
    where: { id: input.id, userId },
    select: {
      id: true,
      slug: true,
      timeSource: true,
      hikes: { select: { hike: { select: { slug: true } } } },
    },
  });

  if (!existingTrack) {
    return { ok: false, code: "NOT_FOUND", message: "Track not found" };
  }

  if (existingTrack.timeSource === "MANUAL") {
    return { ok: false, code: "ALREADY_MANUAL", message: "Track is already manual" };
  }

  const track = await prisma.track.update({
    where: { id: existingTrack.id },
    data: { timeSource: "MANUAL" },
    select: trackListSelect,
  });

  revalidateTrackDetailPaths(track.slug);
  for (const association of existingTrack.hikes) {
    revalidatePath(`/hikes/${association.hike.slug}`);
  }

  return { ok: true, track };
};

export const parseTrackGpx = async (id: string) => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const track = await prisma.track.findFirst({
    where: { id, userId },
    select: {
      id: true,
      slug: true,
      timeSource: true,
      recordingTimezone: true,
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
  const metadataToPersist = buildTrackGpxMetadata({
    content,
    fileAssetId: track.fileAsset.id,
    fileKey: track.fileAsset.fileKey,
  });

  // Mirror the parsed summary into the new columns so every read path
  // (public track detail / list, admin track list, hike linked-track card)
  // can read `Track.recordingStartAt` / `Track.recordingDurationSeconds`
  // without special-casing GPX rows against `metadata.summary.time`. The
  // mirror is null when the parsed GPX had no usable `<time>` elements.
  const summaryTime = metadataToPersist.summary?.time ?? null;
  const parsedRecordingStartAt = summaryTime ? new Date(summaryTime.start) : null;
  const parsedRecordingDurationSeconds = summaryTime ? summaryTime.durationSeconds : null;

  // feature-123: a file that names its own UTC offset carries the recording's
  // wall-clock — a Moscow recording says `+03:00` in every `<time>`, and the
  // normalized instants kept only the UTC moment. The offset is a starting
  // point, not a decision: a timezone the owner has already confirmed wins,
  // and a manual row is never given one.
  const effectiveTimeSource = track.timeSource ?? "GPX";
  const fileRecordingTimezone =
    effectiveTimeSource === "GPX" ? toRecordingTimezoneFromUtcOffset(parseTrackGpxUtcOffsetMinutes(content)) : null;
  const confirmedRecordingTimezone = track.recordingTimezone?.trim() ? track.recordingTimezone : null;
  const parsedRecordingTimezone = confirmedRecordingTimezone ?? fileRecordingTimezone;

  await prisma.track.update({
    where: { id: track.id },
    data: {
      metadata: metadataToPersist as Prisma.InputJsonValue,
      // feature-116 follow-up: parse preserves the row's existing
      // `timeSource` rather than re-asserting `"GPX"`. A row that was
      // created through the `Place on map` flow keeps `MANUAL` (or `NONE`)
      // even after its synthetic GPX is parsed; conversely a legacy
      // `MANUAL`-misclassified row does not get auto-corrected by a
      // re-parse — the owner must use the explicit `markTrackAsManual`
      // action (or its inverse) to change the classification. The only
      // transition handled here is null → `"GPX"`, so a fresh row that
      // has never been classified becomes GPX-sourced on first parse.
      timeSource: track.timeSource ?? "GPX",
      recordingStartAt: parsedRecordingStartAt,
      recordingDurationSeconds: parsedRecordingDurationSeconds,
      recordingTimezone: parsedRecordingTimezone,
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
    // feature-120: same default-and-validate contract as the status — a
    // missing kind is a route, an unknown kind is a validation error.
    const normalizedKind = input.kind ?? DEFAULT_TRACK_KIND;
    if (!TRACK_KINDS.has(normalizedKind)) {
      return { ok: false, code: "VALIDATION", message: "Track kind is invalid" };
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

    // feature-122: the gear is optional and is checked against the owner and
    // against the activity type before anything is written — a refused gear
    // never reaches the upload or the row.
    let normalizedGearId: string | null = null;
    try {
      const gear = await ensureEligibleTrackGear({
        gearId: input.gearId,
        userId,
        activityTypeId: normalizedActivityTypeId,
      });
      normalizedGearId = gear?.id ?? null;
    } catch (error) {
      return {
        ok: false,
        code: "VALIDATION",
        message: error instanceof Error ? error.message : "Selected gear is not available",
      };
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
          gearId: normalizedGearId,
          kind: normalizedKind,
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

/**
 * feature-123: the slug the quick upload writes.
 *
 * The shared track form can refuse a slug conflict, because the owner can
 * retype the slug. The quick dialog has no slug field, so a refusal would be
 * a dead end. This takes the next free slug instead — `walking-2026-10-25-0830`,
 * then `-2`, `-3`, … — and lets the save succeed.
 */
const ensureUniqueTrackSlug = async (base: string) => {
  const { default: prisma } = await import("@/lib/prisma");
  const slugBase = createSlug(base);

  if (!slugBase) {
    throw new Error("Slug is required");
  }

  for (let attempt = 0; attempt < 50; attempt += 1) {
    const slug = attempt === 0 ? slugBase : `${slugBase}-${attempt + 1}`;
    const existingTrack = await prisma.track.findUnique({ where: { slug }, select: { id: true } });

    if (!existingTrack) return slug;
  }

  throw new Error("Could not find a free slug");
};

/**
 * feature-123: the one-click quick upload.
 *
 * The owner drops a GPX file into a small dialog, the browser suggests a
 * title from the file, and the save fills in everything else: the activity
 * type the button was bound to, the kind (`TRAINING`), the status (`DRAFT`),
 * a unique slug, the parsed metadata and the mirrored recording columns.
 *
 * The order of the checks is the order of the refusals:
 *
 *   1. The `track-upload` trust gate and the verified `track` quota.
 *   2. The title and the activity type.
 *   3. The file asset — it has to be the owner's own, GPX-shaped and unused.
 *   4. The gear — optional, the owner's own, and fitting the activity type.
 *   5. The slug — the browser proposed it, the server makes it unique.
 *   6. The parse — the file is read once, and the metadata is written with
 *      the row. A file that cannot be read still creates the track, in the
 *      same state the owner can repair from the track form.
 *
 * The answer carries the same codes as `createManualTrack`, so the dialog can
 * say *why* a save was refused instead of showing one generic failure.
 */
export const createQuickWorkout = async (input: CreateQuickWorkoutInput): Promise<CreateQuickWorkoutResult> => {
  try {
    const user = await requireTrustGatedAction("track-upload");
    const userId = user.id;

    const normalizedTitle = input.title?.trim() ?? "";
    if (!normalizedTitle) {
      return { ok: false, code: "VALIDATION", message: "Title is required" };
    }

    const normalizedActivityTypeId = input.activityTypeId?.trim() ?? "";
    if (!normalizedActivityTypeId) {
      return { ok: false, code: "VALIDATION", message: "Activity type is required" };
    }

    const activityType = await getTrackActivityTypeById(normalizedActivityTypeId);
    if (!activityType) {
      return { ok: false, code: "VALIDATION", message: "Activity type is unavailable" };
    }

    let fileAsset;
    try {
      fileAsset = await ensureEligibleTrackFileAsset({ fileAssetId: input.fileAssetId, userId });
    } catch (error) {
      return {
        ok: false,
        code: "VALIDATION",
        message: error instanceof Error ? error.message : "Selected GPX file is not eligible for tracks",
      };
    }

    // feature-122: the gear is optional and is checked against the owner and
    // against the activity type before anything is written.
    let gearId: string | null = null;
    try {
      const gear = await ensureEligibleTrackGear({
        gearId: input.gearId,
        userId,
        activityTypeId: normalizedActivityTypeId,
      });
      gearId = gear?.id ?? null;
    } catch (error) {
      return {
        ok: false,
        code: "VALIDATION",
        message: error instanceof Error ? error.message : "Selected gear is not available",
      };
    }

    const slug = await ensureUniqueTrackSlug(input.slug?.trim() || normalizedTitle);

    // The file is fetched once and parsed here — the stored metadata is the
    // server's parse of the same bytes the browser previewed.
    const content = await fetchTrackGpxContent(fileAsset.url).catch(() => "");
    const metadata = buildTrackGpxMetadata({
      content,
      fileAssetId: fileAsset.id,
      fileKey: fileAsset.fileKey,
    });
    const summaryTime = metadata.summary?.time ?? null;
    // feature-123: the file's own UTC offset — the only place the recording's
    // own wall-clock survives, because the stored instants are UTC. A Moscow
    // recording says `+03:00` and is stored as that offset, so every surface
    // shows the time the owner actually recorded. A file that names no offset
    // leaves naive wall-clock timestamps, and the device that wrote them is
    // then the only reference there is — so the device's timezone is the
    // fallback.
    const recordingTimezone = resolveQuickWorkoutRecordingTimezone(
      parseTrackGpxUtcOffsetMinutes(content),
      input.deviceTimezone,
    );

    // feature-124: the preference is written together with the attachment,
    // so a failure of either half leaves the other unwritten.
    const rememberGear = input.rememberGearAsPreferred === true && gearId !== null;

    const track = await createWithinVerifiedResourceQuota(user, "track", async (tx) => {
      const created = await tx.track.create({
        data: {
          title: normalizedTitle,
          slug,
          description: null,
          // The quick upload creates a draft: publishing stays an explicit act
          // in the track form.
          status: "DRAFT",
          // The button lives on "My workouts", and the kind is what that page
          // lists.
          kind: "TRAINING",
          fileAssetId: fileAsset.id,
          userId,
          activityTypeId: normalizedActivityTypeId,
          gearId,
          // Every GPX-uploaded track is GPX-sourced. The recording timezone is
          // the file's own offset when it names one — the owner confirms or
          // corrects it in the track form.
          timeSource: "GPX",
          recordingTimezone,
          recordingStartAt: summaryTime ? new Date(summaryTime.start) : null,
          recordingDurationSeconds: summaryTime ? summaryTime.durationSeconds : null,
          metadata: metadata as Prisma.InputJsonValue,
        },
        select: { id: true, slug: true },
      });

      // The gear was checked against the owner and against the activity type
      // above, so the row can only point at a record that fits this type.
      if (rememberGear && gearId) {
        await tx.gearPreference.upsert({
          where: { userId_activityTypeId: { userId, activityTypeId: normalizedActivityTypeId } },
          create: { userId, activityTypeId: normalizedActivityTypeId, gearId },
          update: { gearId },
        });
      }

      return created;
    });

    revalidateTrackPaths();
    revalidatePath("/my/workouts");
    if (rememberGear && gearId) revalidatePath("/my/gear");

    return { ok: true, trackId: track.id, trackSlug: track.slug };
  } catch (error) {
    if (error instanceof InsufficientTrustError) {
      return { ok: false, code: "TRUST", message: error.message };
    }
    if (error instanceof Error && error.message.toLowerCase().includes("limit reached")) {
      return { ok: false, code: "QUOTA", message: error.message };
    }
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not create workout",
    };
  }
};
