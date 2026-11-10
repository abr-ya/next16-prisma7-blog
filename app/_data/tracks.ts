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
import { createWithinVerifiedResourceQuota } from "@/lib/auth-trust-quotas.server";
import { gearFitsActivityType } from "@/lib/gear";
import { createSlug } from "@/lib/slug-generator";
import { buildTrackGpxMetadata, fetchTrackGpxContent } from "@/lib/track-gpx-file";
import { resolveTrackGeometry } from "@/lib/track-geometry";
import { revalidateTrackPaths } from "@/lib/track-revalidation";
import {
  parseDurationSeconds,
  parseManualTrackStartAt,
  TrackDurationInputError,
  TrackStartAtParseError,
} from "@/lib/track-duration-input";
import { parseTrackGpxUtcOffsetMinutes } from "@/lib/track-gpx-parser";
import {
  normalizeTrackRecordingTimezone,
  requireTrackRecordingTimezone,
  resolveQuickWorkoutRecordingTimezone,
  toRecordingTimezoneFromUtcOffset,
} from "@/lib/track-recording-timezone";
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
  // feature-141: owner-only note. `undefined` leaves it unchanged on update;
  // `null` or an empty string clears it.
  privateNote?: string | null;
};

export type CreateManualTrackResult =
  | { ok: true; trackId: string; trackSlug: string }
  | { ok: false; code: "TRUST" | "QUOTA" | "SLUG" | "VALIDATION" | "INTERNAL"; message: string };

/**
 * feature-127: a track created from a route carries no geometry of its own —
 * the route owns the file and the metadata. The recording data is entered by
 * the owner and is required before the save.
 */
export type CreateTrackFromRouteInput = {
  routeId: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  status?: TrackStatus;
  activityTypeId?: string | null;
  kind?: TrackKind;
  gearId?: string | null;
  recordingStartAt: string;
  recordingDurationSeconds: number;
  recordingTimezone?: string | null;
};

export type CreateTrackFromRouteResult = CreateManualTrackResult;

/**
 * feature-141: a draft workout is captured before any geometry exists. The
 * client proposes the title and slug base from the recording's daypart; the
 * server validates the values and makes the slug unique.
 */
export type CreateDraftWorkoutInput = {
  title: string;
  slug?: string | null;
  /** ISO instant computed by the browser from the entered wall-clock. */
  recordingStartAt: string;
  /** Device timezone; an unsupported value is stored as null. */
  recordingTimezone?: string | null;
  /** Fractional minutes are allowed; the server stores whole seconds. */
  durationMinutes: number;
  privateNote?: string | null;
  gearId?: string | null;
};

export type CreateDraftWorkoutResult = CreateManualTrackResult;

export type AttachRouteToTrackResult = { ok: true } | { ok: false; code: "VALIDATION" | "INTERNAL"; message: string };

export type UpdateDraftWorkoutInput = {
  id: string;
  recordingStartAt: string;
  recordingTimezone?: string | null;
  durationMinutes: number;
  privateNote?: string | null;
  gearId?: string | null;
};

export type UpdateDraftWorkoutResult =
  | { ok: true }
  | { ok: false; code: "NOT_FOUND" | "VALIDATION" | "INTERNAL"; message: string };

export type CompleteDraftWithFileResult =
  | { ok: true }
  | { ok: false; code: "VALIDATION" | "INTERNAL"; message: string };

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

/** The quick upload answers with the same vocabulary as `createTrackFromRoute`. */
export type CreateQuickWorkoutResult = CreateManualTrackResult;

/**
 * feature-146: the quick route workout — a published walk whose geometry is a
 * route the owner already owns.
 *
 * The dialog sends the route, the entered wall-clock and its duration; the
 * title and the slug base are proposed by the browser the same way the quick
 * upload proposes them.
 */
export type CreateQuickRouteWorkoutInput = {
  /** The route the workout's geometry comes from. */
  routeId: string;
  /** The activity type the button was bound to. */
  activityTypeId: string;
  title: string;
  /** The slug base the browser proposed; the server makes it unique. */
  slug?: string | null;
  /** The owner's own gear for the activity type; optional. */
  gearId?: string | null;
  /** The entered wall clock, without an offset: `YYYY-MM-DDTHH:MM`. */
  recordingStartAt: string;
  /** Fractional minutes are allowed; the server stores whole seconds. */
  durationMinutes: number;
  /**
   * The timezone of the device the walk was recorded on. It is the zone the
   * entered wall clock is read in, and it is validated the way any other
   * recording timezone is.
   */
  deviceTimezone?: string | null;
};

export type CreateQuickRouteWorkoutResult = CreateManualTrackResult;

type PublicTrackRecord = Prisma.TrackGetPayload<{
  select: {
    id: true;
    title: true;
    slug: true;
    userId: true;
    routeId: true;
    description: true;
    privateNote: true;
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
        purpose: true;
        uploadedAt: true;
        updatedAt: true;
      };
    };
    route: {
      select: {
        metadata: true;
        fileAsset: {
          select: {
            id: true;
            name: true;
            fileKey: true;
            sizeBytes: true;
            status: true;
            visibility: true;
            purpose: true;
            uploadedAt: true;
            updatedAt: true;
          };
        };
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
  /** feature-141: owner-only note; null for every non-owner viewer. */
  privateNote: string | null;
  recordingTimezone: string | null;
  recordingStartAt: Date | null;
  recordingDurationSeconds: number | null;
  timeSource: TrackTimeSource | null;
  updatedAt: Date;
  createdAt: Date;
  /** feature-138: the viewer owns this track and may clean up its GPX points. */
  canCleanPoints: boolean;
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

/**
 * feature-127: replace the row's own file and metadata with the resolved
 * geometry source, so every consumer keeps reading `track.fileAsset` and
 * `track.metadata` without knowing about routes.
 */
const withResolvedGeometry = <
  TTrack extends {
    fileAsset: { id: string } | null;
    metadata: Prisma.JsonValue | null;
    route?: { fileAsset: { id: string } | null; metadata: Prisma.JsonValue | null } | null;
  },
>(
  track: TTrack,
): TTrack => {
  const geometry = resolveTrackGeometry(track);

  return geometry ? { ...track, fileAsset: geometry.fileAsset, metadata: geometry.metadata } : track;
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

const normalizePrivateNote = (value?: string | null) => {
  const note = normalizeOptionalText(value);

  if (note && note.length > 2000) {
    throw new Error("Private note must be 2000 characters or fewer");
  }

  return note;
};

const normalizeTrackSlug = (title: string, value?: string | null) => {
  const slug = createSlug(value?.trim() || title);

  if (!slug) {
    throw new Error("Slug is required");
  }

  return slug;
};

export const getTrackData = async (
  { title, slug, description, status, fileAssetId, activityTypeId, kind }: TrackActionValues,
  { requireFileAsset = true }: { requireFileAsset?: boolean } = {},
) => {
  const normalizedTitle = normalizeRequiredText(title, "Title");
  const normalizedStatus = status ?? DEFAULT_TRACK_STATUS;
  // feature-127: a route-based track owns no file of its own, so an update
  // must be able to normalize the presentation fields without demanding one.
  const normalizedFileAssetId = requireFileAsset
    ? normalizeRequiredText(fileAssetId ?? "", "GPX file")
    : fileAssetId?.trim() || null;

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
  // feature-141: the readiness state drives the draft indicator and the public
  // filter. It is not sensitive, so it stays in the shared projection.
  geometryState: true,
  updatedAt: true,
  createdAt: true,
  activityType: true,
  fileAsset: true,
  route: {
    select: {
      metadata: true,
      fileAsset: true,
    },
  },
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
  // feature-141: the private note is projected only to the owner's surfaces.
  // The administrative and public rows never select it, so it stays undefined
  // there instead of leaking into a shared payload.
  privateNote?: string | null;
};

/**
 * feature-141: the owner-only projection. `privateNote` is added on top of the
 * shared list select so the administrative listing, which uses the shared
 * select, can never carry the note.
 */
const ownerTrackListSelect = {
  ...trackListSelect,
  privateNote: true,
} satisfies Prisma.TrackSelect;

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

/**
 * feature-141: the owner-only projection with the gear attachment. The
 * administrative panel never asks for gear, so this select is used only by the
 * owner's pages.
 */
const ownerTrackListSelectWithGear = {
  ...ownerTrackListSelect,
  gear: { select: { id: true, name: true } },
} satisfies Prisma.TrackSelect;

export type TrackListItemWithGear = Prisma.TrackGetPayload<{
  select: typeof trackListSelectWithGear;
}>;

const publicTrackSelect = {
  id: true,
  title: true,
  slug: true,
  userId: true,
  routeId: true,
  description: true,
  privateNote: true,
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
      purpose: true,
      uploadedAt: true,
      updatedAt: true,
    },
  },
  route: {
    select: {
      metadata: true,
      fileAsset: {
        select: {
          id: true,
          name: true,
          fileKey: true,
          sizeBytes: true,
          status: true,
          visibility: true,
          purpose: true,
          uploadedAt: true,
          updatedAt: true,
        },
      },
    },
  },
} satisfies Prisma.TrackSelect;

const toPublicTrack = (
  track: PublicTrackRecord,
  { includeMapGeometry, viewerId }: { includeMapGeometry: boolean; viewerId?: string | null },
): PublicTrack | null => {
  const geometry = resolveTrackGeometry(track);

  if (!geometry) return null;

  const { fileAsset, metadata } = geometry;
  const downloadAvailable =
    fileAsset.status === ACTIVE_FILE_STATUS && PUBLIC_DOWNLOAD_VISIBILITIES.has(fileAsset.visibility);
  // feature-138: cleanup is offered only for the owner's own file; a
  // route-based track borrows geometry it cannot rewrite here.
  const canCleanPoints = Boolean(
    viewerId &&
    track.userId === viewerId &&
    !track.routeId &&
    fileAsset.purpose === "TRACK_GPX" &&
    fileAsset.status === ACTIVE_FILE_STATUS,
  );
  const parsedState = getTrackGpxMetadataState(metadata, {
    fileAssetId: fileAsset.id,
    fileKey: fileAsset.fileKey,
  });

  return {
    id: track.id,
    title: track.title,
    slug: track.slug,
    description: track.description,
    // feature-141: the note is owner-only, so the public detail payload carries
    // it only when the viewer is the owner. The public list never passes a
    // viewer id and therefore never carries it.
    privateNote: viewerId && viewerId === track.userId ? track.privateNote : null,
    recordingTimezone: track.recordingTimezone,
    recordingStartAt: track.recordingStartAt,
    recordingDurationSeconds: track.recordingDurationSeconds,
    timeSource: track.timeSource,
    updatedAt: track.updatedAt,
    createdAt: track.createdAt,
    canCleanPoints,
    file: {
      id: fileAsset.id,
      name: fileAsset.name,
      sizeBytes: fileAsset.sizeBytes,
      uploadedAt: fileAsset.uploadedAt,
      updatedAt: fileAsset.updatedAt,
      downloadUrl: downloadAvailable ? `/files/${fileAsset.id}/download` : null,
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
      ? toTrackMapViewModel(track.title, metadata, {
          fileAssetId: fileAsset.id,
          fileKey: fileAsset.fileKey,
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

const revalidateTrackDetailPaths = (slug?: string | null) => {
  revalidateTrackPaths();

  if (slug) revalidatePath(`/tracks/${slug}`);
};

export const getAllTracks = async ({
  includeGear = false,
  includePrivateNote = false,
}: {
  includeGear?: boolean;
  includePrivateNote?: boolean;
} = {}): Promise<TrackListItem[]> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  // feature-141: the owner's pages opt in to the private note; the admin page
  // calls this without the flag and keeps the shared projection.
  const select = includePrivateNote
    ? includeGear
      ? ownerTrackListSelectWithGear
      : ownerTrackListSelect
    : includeGear
      ? trackListSelectWithGear
      : trackListSelect;

  const tracks = (await prisma.track.findMany({
    where: { userId },
    select,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  })) as TrackListItem[];

  return tracks.map((track) => withResolvedGeometry(track));
};

/**
 * feature-120: the owner's workouts — the tracks they marked as training
 * sessions. Owner-scoped like every other personal track query; the kind
 * filter narrows it in SQL rather than in the table.
 */
export const getOwnerWorkoutTracks = async ({
  includeGear = false,
  includePrivateNote = false,
}: {
  includeGear?: boolean;
  includePrivateNote?: boolean;
} = {}): Promise<TrackListItem[]> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  const select = includePrivateNote
    ? includeGear
      ? ownerTrackListSelectWithGear
      : ownerTrackListSelect
    : includeGear
      ? trackListSelectWithGear
      : trackListSelect;

  const tracks = (await prisma.track.findMany({
    where: { userId, kind: "TRAINING" },
    select,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  })) as TrackListItem[];

  return tracks.map((track) => withResolvedGeometry(track));
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

  const track = await prisma.track.findFirst({
    where: { id, userId },
    // feature-141: the owner's edit surface reads the private note; the
    // administrative and public paths never use this helper.
    select: ownerTrackListSelect,
  });

  return track ? withResolvedGeometry(track) : null;
};

export const getPublicTracks = async (): Promise<PublicTrack[]> => {
  const { default: prisma } = await import("@/lib/prisma");
  const tracks = (await prisma.track.findMany({
    // feature-141: a pending draft is never public, even if its status was
    // changed outside the application.
    where: { status: "PUBLISHED", geometryState: "READY" },
    select: publicTrackSelect,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  })) as PublicTrackRecord[];

  return tracks
    .map((track) => toPublicTrack(track, { includeMapGeometry: false }))
    .filter((track): track is PublicTrack => track !== null);
};

export const getPublicTrackBySlug = async (slug: string, viewerId?: string | null): Promise<PublicTrack | null> => {
  const { default: prisma } = await import("@/lib/prisma");
  const track = (await prisma.track.findFirst({
    where: { slug, status: "PUBLISHED", geometryState: "READY" },
    select: publicTrackSelect,
  })) as PublicTrackRecord | null;

  return track ? toPublicTrack(track, { includeMapGeometry: true, viewerId }) : null;
};

export const createTrack = async (values: TrackActionValues) => {
  const user = await requireTrustGatedAction("track-upload");
  const userId = user.id;
  const data = await getTrackData(values);
  await ensureSlugAvailable({ slug: data.slug });
  await ensureEligibleTrackFileAsset({ fileAssetId: data.fileAssetId ?? "", userId });
  const gear = await ensureEligibleTrackGear({ gearId: values.gearId, userId, activityTypeId: data.activityTypeId });

  const track = await createWithinVerifiedResourceQuota(user, "track", (tx) =>
    tx.track.create({
      data: {
        ...data,
        userId,
        // feature-141: the owner-only note is written with the row when the
        // owner surface supplies it; the administrative form leaves it alone.
        privateNote: normalizePrivateNote(values.privateNote),
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

  return withResolvedGeometry(track);
};

export const updateTrack = async (values: TrackActionValues) => {
  if (!values.id) {
    throw new Error("Track id is required");
  }

  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const existingTrack = await prisma.track.findFirst({
    where: { id: values.id, userId },
    select: {
      id: true,
      metadata: true,
      fileAssetId: true,
      routeId: true,
      gearId: true,
      geometryState: true,
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

  // feature-127: a route-based track has no file of its own. Its presentation
  // and training fields are still editable; only the geometry belongs to the
  // route.
  const isRouteBased = Boolean(existingTrack.routeId);
  const data = await getTrackData(values, { requireFileAsset: !isRouteBased });

  // feature-141: a pending draft is completed first and published in a later
  // edit. Attaching a file in the same request is not enough to publish it.
  if (existingTrack.geometryState === "PENDING" && data.status === "PUBLISHED") {
    throw new Error("Complete the draft before publishing it");
  }

  await ensureSlugAvailable({ slug: data.slug, id: existingTrack.id });
  const fileAsset = isRouteBased
    ? null
    : await ensureEligibleTrackFileAsset({
        fileAssetId: data.fileAssetId ?? "",
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
    !isRouteBased &&
    fileAsset &&
    existingTrack.fileAsset &&
    (existingTrack.fileAssetId !== data.fileAssetId || existingTrack.fileAsset.fileKey !== fileAsset.fileKey)
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
      // feature-141: `undefined` keeps the owner's note; the admin form never
      // sends the field, so an administrative edit cannot clear it.
      ...(values.privateNote !== undefined ? { privateNote: normalizePrivateNote(values.privateNote) } : {}),
      ...(staleMetadata ? { metadata: staleMetadata as Prisma.InputJsonValue } : {}),
      // feature-141: attaching a file to a pending draft completes its
      // geometry. The publish guard in the database still rejects a pending
      // row, so this transition has to happen in the same write.
      ...(existingTrack.geometryState === "PENDING" && data.fileAssetId ? { geometryState: "READY" as const } : {}),
    },
    select: trackListSelect,
  });

  revalidateTrackDetailPaths(track.slug);

  return withResolvedGeometry(track);
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

  return { ok: true, track: withResolvedGeometry(track) };
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

  return { ok: true, track: withResolvedGeometry(track) };
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

  if (!track.fileAsset) {
    throw new Error("A route-based track has no GPX file of its own to reparse");
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
    select: { id: true, fileAssetId: true, routeId: true },
  });

  if (!existingTrack) {
    return { success: false };
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.track.delete({
      where: { id: existingTrack.id },
    });

    // fix-013: a self-owned GPX has no owner after the track is gone. Retire
    // it with the same status the route deletion and point cleanup use, while
    // a route-based track leaves the route's file untouched.
    if (existingTrack.fileAssetId && !existingTrack.routeId) {
      await tx.fileAsset.updateMany({
        where: { id: existingTrack.fileAssetId, status: ACTIVE_FILE_STATUS },
        data: { status: "PENDING_DELETE", deletedAt: new Date() },
      });
    }
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
 * feature-127: create a track from a route the owner already owns.
 *
 * The route owns the geometry (file + parsed metadata), so the new row stores
 * only `routeId` and leaves `fileAssetId` and `metadata` `NULL` — the
 * `Track_geometry_source_check` constraint enforces the same rule. The
 * recording start and duration are required: a manual track is a training on
 * a known shape, and without them it would be indistinguishable from a
 * half-filled row.
 *
 * The checks and their order mirror the shared track creation path: trust gate, route
 * ownership, activity type, gear, slug, quota, then the write.
 */
export const createTrackFromRoute = async (input: CreateTrackFromRouteInput): Promise<CreateTrackFromRouteResult> => {
  try {
    const user = await requireTrustGatedAction("track-upload");
    const userId = user.id;
    const { default: prisma } = await import("@/lib/prisma");

    const normalizedTitle = normalizeRequiredText(input.title, "Title");
    const normalizedStatus = input.status ?? DEFAULT_TRACK_STATUS;
    if (!TRACK_STATUSES.has(normalizedStatus)) {
      return { ok: false, code: "VALIDATION", message: "Track status is invalid" };
    }
    const normalizedKind = input.kind ?? DEFAULT_TRACK_KIND;
    if (!TRACK_KINDS.has(normalizedKind)) {
      return { ok: false, code: "VALIDATION", message: "Track kind is invalid" };
    }
    const normalizedSlug = normalizeTrackSlug(normalizedTitle, input.slug ?? null);
    const normalizedDescription = normalizeOptionalText(input.description);

    const routeId = input.routeId?.trim();
    if (!routeId) {
      return { ok: false, code: "VALIDATION", message: "Choose a route or place a new one" };
    }

    const route = await prisma.route.findFirst({
      where: { id: routeId, userId },
      select: { id: true },
    });

    if (!route) {
      return { ok: false, code: "VALIDATION", message: "Selected route is not available" };
    }

    const normalizedActivityTypeId = input.activityTypeId?.trim() || null;
    if (normalizedActivityTypeId) {
      const activityType = await getTrackActivityTypeById(normalizedActivityTypeId);
      if (!activityType) {
        return { ok: false, code: "VALIDATION", message: "Activity type is unavailable" };
      }
    }

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

    const trimmedStart = input.recordingStartAt?.trim() ?? "";
    if (!trimmedStart) {
      return { ok: false, code: "VALIDATION", message: "Recording start is required" };
    }
    if (!input.recordingTimezone?.trim()) {
      return {
        ok: false,
        code: "VALIDATION",
        message: "Recording timezone is required when start time is set",
      };
    }

    let normalizedRecordingStartAt: Date;
    let normalizedRecordingTimezone: string;
    try {
      normalizedRecordingStartAt = parseManualTrackStartAt({
        wallClock: trimmedStart,
        timezone: input.recordingTimezone,
      });
      normalizedRecordingTimezone = requireTrackRecordingTimezone(input.recordingTimezone);
    } catch (error) {
      if (error instanceof TrackStartAtParseError) {
        return { ok: false, code: "VALIDATION", message: error.message };
      }
      throw error;
    }

    if (typeof input.recordingDurationSeconds !== "number") {
      return { ok: false, code: "VALIDATION", message: "Recording duration is required" };
    }

    let normalizedRecordingDurationSeconds: number;
    try {
      normalizedRecordingDurationSeconds = parseDurationSeconds(input.recordingDurationSeconds);
    } catch (error) {
      if (error instanceof TrackDurationInputError) {
        return { ok: false, code: "VALIDATION", message: error.message };
      }
      throw error;
    }

    try {
      await ensureSlugAvailable({ slug: normalizedSlug });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Slug is unavailable";
      if (message.toLowerCase().includes("slug")) {
        throw new ManualTrackSlugConflictError(message);
      }
      throw new ManualTrackValidationError(message);
    }

    const track = await createWithinVerifiedResourceQuota(user, "track", (tx) =>
      tx.track.create({
        data: {
          title: normalizedTitle,
          slug: normalizedSlug,
          description: normalizedDescription,
          status: normalizedStatus,
          routeId: route.id,
          userId,
          activityTypeId: normalizedActivityTypeId,
          gearId: normalizedGearId,
          kind: normalizedKind,
          recordingStartAt: normalizedRecordingStartAt,
          recordingDurationSeconds: normalizedRecordingDurationSeconds,
          recordingTimezone: normalizedRecordingTimezone,
          timeSource: "MANUAL",
        },
        select: trackListSelect,
      }),
    );

    revalidateTrackPaths();
    revalidatePath("/my/routes");

    return { ok: true, trackId: track.id, trackSlug: track.slug };
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
    if (error instanceof Error && error.message.toLowerCase().includes("limit reached")) {
      return { ok: false, code: "QUOTA", message: error.message };
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
 * type the button was bound to, the kind (`TRAINING`), the status (`PUBLISHED`),
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
 * The answer carries the same codes as `createTrackFromRoute`, so the dialog can
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
          // feature-125: the quick upload publishes. The recording is already
          // made and the title is already suggested from the file, so the
          // workout joins the public site without a second step — the owner
          // unpublishes it from the track form if it was a mistake.
          status: "PUBLISHED",
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

/**
 * feature-146: the one-click route walk.
 *
 * The owner already has a route — a GPX file with parsed metadata — and wants
 * the walk to be recorded against it. The action creates the same published
 * training workout the quick upload creates, but its geometry comes from the
 * route instead of a fresh file: the row stores `routeId` and leaves
 * `fileAssetId` and `metadata` `NULL`, exactly as `createTrackFromRoute` does.
 *
 * The order of the checks is the order of the refusals:
 *
 *   1. The `track-upload` trust gate and the verified `track` quota.
 *   2. The title and the activity type — walking, the only type the quick
 *      buttons are bound to.
 *   3. The route — it has to be the owner's own and to carry parsed metadata,
 *      because a route without it has no points to draw.
 *   4. The gear — optional, the owner's own, and fitting the activity type.
 *   5. The start and the duration — the entered wall clock, read in the
 *      device's own timezone.
 *   6. The slug — the browser proposed it, the server makes it unique. The
 *      quick dialog has no slug field, so a second walk in the same minute
 *      takes a numeric suffix instead of failing the save.
 */
export const createQuickRouteWorkout = async (
  input: CreateQuickRouteWorkoutInput,
): Promise<CreateQuickRouteWorkoutResult> => {
  try {
    const user = await requireTrustGatedAction("track-upload");
    const userId = user.id;
    const { default: prisma } = await import("@/lib/prisma");

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

    // feature-146: the first slice is walking-only. The client offers the
    // action only for that type, but the server remains the authority.
    if (activityType.key !== "walking") {
      return { ok: false, code: "VALIDATION", message: "Activity type is unavailable" };
    }

    const routeId = input.routeId?.trim() ?? "";
    if (!routeId) {
      return { ok: false, code: "VALIDATION", message: "Choose a route" };
    }

    const route = await prisma.route.findFirst({
      where: { id: routeId, userId },
      select: { id: true, metadata: true },
    });

    if (!route) {
      return { ok: false, code: "VALIDATION", message: "Selected route is not available" };
    }

    // A route without parsed metadata carries no points, so it cannot become
    // a workout's geometry — the map would be empty.
    if (!route.metadata) {
      return { ok: false, code: "VALIDATION", message: "Selected route has no parsed metadata" };
    }

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

    const wallClock = input.recordingStartAt?.trim() ?? "";
    if (!wallClock) {
      return { ok: false, code: "VALIDATION", message: "Recording start is required" };
    }

    const timezone = input.deviceTimezone?.trim() ?? "";
    if (!timezone) {
      return { ok: false, code: "VALIDATION", message: "Recording timezone is required" };
    }

    // The entered value is a wall clock with no offset: it is read in the
    // device's own zone, the way the owner sees it.
    let normalizedRecordingStartAt: Date;
    let normalizedRecordingTimezone: string;
    try {
      normalizedRecordingTimezone = requireTrackRecordingTimezone(timezone);
      normalizedRecordingStartAt = parseManualTrackStartAt({
        wallClock,
        timezone: normalizedRecordingTimezone,
      });
    } catch (error) {
      if (error instanceof TrackStartAtParseError) {
        return { ok: false, code: "VALIDATION", message: error.message };
      }
      throw error;
    }

    const minutes = Number(input.durationMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return { ok: false, code: "VALIDATION", message: "Recording duration is required" };
    }

    let normalizedRecordingDurationSeconds: number;
    try {
      normalizedRecordingDurationSeconds = parseDurationSeconds(Math.round(minutes * 60));
    } catch (error) {
      if (error instanceof TrackDurationInputError) {
        return { ok: false, code: "VALIDATION", message: error.message };
      }
      throw error;
    }

    const slug = await ensureUniqueTrackSlug(input.slug?.trim() || normalizedTitle);

    const track = await createWithinVerifiedResourceQuota(user, "track", (tx) =>
      tx.track.create({
        data: {
          title: normalizedTitle,
          slug,
          description: null,
          // feature-125: the quick upload publishes, and the route walk is
          // the same one-click path — the recording is already made and the
          // title is already suggested from the daypart.
          status: "PUBLISHED",
          kind: "TRAINING",
          // The route owns the geometry, so the row carries no file of its
          // own and no metadata: the track reads the route's.
          routeId: route.id,
          userId,
          activityTypeId: normalizedActivityTypeId,
          gearId: normalizedGearId,
          timeSource: "MANUAL",
          recordingStartAt: normalizedRecordingStartAt,
          recordingDurationSeconds: normalizedRecordingDurationSeconds,
          recordingTimezone: normalizedRecordingTimezone,
        },
        select: { id: true, slug: true },
      }),
    );

    revalidateTrackPaths();
    revalidatePath("/my/workouts");

    return { ok: true, trackId: track.id, trackSlug: track.slug };
  } catch (error) {
    if (error instanceof InsufficientTrustError) {
      return { ok: false, code: "TRUST", message: error.message };
    }
    if (error instanceof Error && error.message.toLowerCase().includes("limit reached")) {
      return { ok: false, code: "QUOTA", message: error.message };
    }
    if (error instanceof Error && error.message.toLowerCase().includes("slug")) {
      return { ok: false, code: "SLUG", message: error.message };
    }
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not create workout",
    };
  }
};

/**
 * feature-141: create a draft workout before its geometry exists.
 *
 * The draft is a real `Track` with `geometryState = PENDING`: it appears in the
 * owner's workouts list and period filters, but it carries no file, route, or
 * metadata until the owner completes it. The title and slug are proposed by the
 * browser from the recording's daypart, the same way the quick upload does;
 * the server validates them and makes the slug unique.
 */
export const createDraftWorkout = async (input: CreateDraftWorkoutInput): Promise<CreateDraftWorkoutResult> => {
  try {
    const user = await requireTrustGatedAction("track-upload");
    const userId = user.id;
    const { default: prisma } = await import("@/lib/prisma");

    const normalizedTitle = normalizeRequiredText(input.title, "Title");

    const startAt = new Date(input.recordingStartAt);
    if (!input.recordingStartAt?.trim() || Number.isNaN(startAt.getTime())) {
      return { ok: false, code: "VALIDATION", message: "Recording start is required" };
    }

    const minutes = Number(input.durationMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return { ok: false, code: "VALIDATION", message: "Recording duration is required" };
    }

    let durationSeconds: number;
    try {
      durationSeconds = parseDurationSeconds(Math.round(minutes * 60));
    } catch (error) {
      return {
        ok: false,
        code: "VALIDATION",
        message: error instanceof Error ? error.message : "Recording duration is invalid",
      };
    }

    const privateNote = normalizeOptionalText(input.privateNote);
    if (privateNote && privateNote.length > 2000) {
      return { ok: false, code: "VALIDATION", message: "Private note must be 2000 characters or fewer" };
    }

    // The first slice is walking-only. The client only offers the action when
    // this type is active and worded, but the server remains the authority.
    const walkingType = await prisma.trackActivityType.findFirst({
      where: { key: "walking", isActive: true },
      select: { id: true },
    });
    if (!walkingType) {
      return { ok: false, code: "VALIDATION", message: "Walking activity type is unavailable" };
    }

    let gearId: string | null = null;
    try {
      const gear = await ensureEligibleTrackGear({
        gearId: input.gearId,
        userId,
        activityTypeId: walkingType.id,
      });
      gearId = gear?.id ?? null;
    } catch (error) {
      return {
        ok: false,
        code: "VALIDATION",
        message: error instanceof Error ? error.message : "Selected gear is not available",
      };
    }

    // The device zone is a default, not a requirement: an unsupported value is
    // stored as null and the instant still comes from the browser.
    const recordingTimezone = normalizeTrackRecordingTimezone(input.recordingTimezone);

    const slug = await ensureUniqueTrackSlug(input.slug?.trim() || normalizedTitle);

    const track = await createWithinVerifiedResourceQuota(user, "track", (tx) =>
      tx.track.create({
        data: {
          title: normalizedTitle,
          slug,
          description: null,
          status: "DRAFT",
          kind: "TRAINING",
          geometryState: "PENDING",
          timeSource: null,
          userId,
          activityTypeId: walkingType.id,
          gearId,
          recordingStartAt: startAt,
          recordingDurationSeconds: durationSeconds,
          recordingTimezone,
          privateNote,
        },
        select: { id: true, slug: true },
      }),
    );

    revalidateTrackPaths();
    revalidatePath("/my/workouts");

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
      message: error instanceof Error ? error.message : "Could not create draft workout",
    };
  }
};

/**
 * feature-141: complete a pending draft with a route. A route always becomes
 * the primary geometry; this slice has no secondary geometry to demote.
 */
export const attachRouteToTrack = async (trackId: string, routeId: string): Promise<AttachRouteToTrackResult> => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const normalizedTrackId = trackId?.trim();
    const normalizedRouteId = routeId?.trim();

    if (!normalizedTrackId || !normalizedRouteId) {
      return { ok: false, code: "VALIDATION", message: "Track and route are required" };
    }

    const track = await prisma.track.findFirst({
      where: { id: normalizedTrackId, userId },
      select: { id: true, geometryState: true },
    });

    if (!track) {
      return { ok: false, code: "VALIDATION", message: "Track not found" };
    }

    if (track.geometryState !== "PENDING") {
      return { ok: false, code: "VALIDATION", message: "Only a pending draft can attach a route" };
    }

    const route = await prisma.route.findFirst({
      where: { id: normalizedRouteId, userId },
      select: { id: true },
    });

    if (!route) {
      return { ok: false, code: "VALIDATION", message: "Selected route is not available" };
    }

    await prisma.track.update({
      where: { id: track.id },
      data: {
        routeId: route.id,
        fileAssetId: null,
        metadata: null,
        geometryState: "READY",
        // The recording values were entered by the owner, so the completed
        // track is a manual-recording track even though its geometry is a route.
        timeSource: "MANUAL",
      },
    });

    revalidateTrackPaths();
    revalidatePath("/my/workouts");
    revalidatePath("/my/routes");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not attach the route",
    };
  }
};

/**
 * feature-141: edit the fields a pending draft owns. Geometry is completed
 * through `attachRouteToTrack` or the existing upload path, not here.
 */
export const updateDraftWorkout = async (input: UpdateDraftWorkoutInput): Promise<UpdateDraftWorkoutResult> => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const existingTrack = await prisma.track.findFirst({
      where: { id: input.id, userId },
      select: { id: true, slug: true, geometryState: true, activityTypeId: true },
    });

    if (!existingTrack) {
      return { ok: false, code: "NOT_FOUND", message: "Track not found" };
    }

    if (existingTrack.geometryState !== "PENDING") {
      return { ok: false, code: "VALIDATION", message: "Only a pending draft can be edited here" };
    }

    const startAt = new Date(input.recordingStartAt);
    if (!input.recordingStartAt?.trim() || Number.isNaN(startAt.getTime())) {
      return { ok: false, code: "VALIDATION", message: "Recording start is required" };
    }

    const minutes = Number(input.durationMinutes);
    if (!Number.isFinite(minutes) || minutes <= 0) {
      return { ok: false, code: "VALIDATION", message: "Recording duration is required" };
    }

    let durationSeconds: number;
    try {
      durationSeconds = parseDurationSeconds(Math.round(minutes * 60));
    } catch (error) {
      return {
        ok: false,
        code: "VALIDATION",
        message: error instanceof Error ? error.message : "Recording duration is invalid",
      };
    }

    const privateNote = normalizeOptionalText(input.privateNote);
    if (privateNote && privateNote.length > 2000) {
      return { ok: false, code: "VALIDATION", message: "Private note must be 2000 characters or fewer" };
    }

    let gearId: string | null = null;
    try {
      const gear = await ensureEligibleTrackGear({
        gearId: input.gearId,
        userId,
        activityTypeId: existingTrack.activityTypeId,
      });
      gearId = gear?.id ?? null;
    } catch (error) {
      return {
        ok: false,
        code: "VALIDATION",
        message: error instanceof Error ? error.message : "Selected gear is not available",
      };
    }

    const recordingTimezone = normalizeTrackRecordingTimezone(input.recordingTimezone);

    await prisma.track.update({
      where: { id: existingTrack.id },
      data: {
        recordingStartAt: startAt,
        recordingDurationSeconds: durationSeconds,
        recordingTimezone,
        privateNote,
        gearId,
      },
    });

    revalidateTrackPaths();
    revalidatePath("/my/workouts");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not update the draft",
    };
  }
};

/**
 * feature-141: complete a pending draft with an uploaded GPX file. The file
 * becomes the primary geometry and the existing parse fills the summary and
 * recording values. A parse failure leaves the track ready but unparsed; the
 * owner can retry the parse from the track table.
 */
export const completeDraftWithFile = async (
  trackId: string,
  fileAssetId: string,
): Promise<CompleteDraftWithFileResult> => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const track = await prisma.track.findFirst({
      where: { id: trackId, userId },
      select: {
        id: true,
        geometryState: true,
        recordingStartAt: true,
        recordingDurationSeconds: true,
        recordingTimezone: true,
      },
    });

    if (!track) {
      return { ok: false, code: "VALIDATION", message: "Track not found" };
    }

    if (track.geometryState !== "PENDING") {
      return { ok: false, code: "VALIDATION", message: "Only a pending draft can be completed" };
    }

    const fileAsset = await ensureEligibleTrackFileAsset({ fileAssetId, userId, trackId: track.id });

    await prisma.track.update({
      where: { id: track.id },
      data: {
        fileAssetId: fileAsset.id,
        routeId: null,
        metadata: null,
        geometryState: "READY",
        // The parse below sets GPX when the file is readable. Keeping this null
        // lets the parse own the transition instead of preserving a MANUAL
        // classification the draft never really had.
        timeSource: null,
      },
    });

    let parsedHasTime = false;

    try {
      const metadata = await parseTrackGpx(track.id);
      parsedHasTime = Boolean(metadata.summary?.time);
    } catch {
      // The geometry is attached; the owner can retry the parse from the track
      // table when the file turns out to be unreadable.
    }

    // feature-141: a file without usable `<time>` values must not erase the
    // start and duration the owner entered when the draft was the only record
    // of them. The file still supplies the geometry and distance; the
    // recording data stays manual.
    if (!parsedHasTime && track.recordingStartAt) {
      await prisma.track.update({
        where: { id: track.id },
        data: {
          recordingStartAt: track.recordingStartAt,
          recordingDurationSeconds: track.recordingDurationSeconds,
          recordingTimezone: track.recordingTimezone,
          timeSource: "MANUAL",
        },
      });
    }

    revalidateTrackPaths();
    revalidatePath("/my/workouts");

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      code: "INTERNAL",
      message: error instanceof Error ? error.message : "Could not complete the draft",
    };
  }
};
