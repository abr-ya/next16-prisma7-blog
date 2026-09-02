"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import type { FileAssetStatus, FileAssetVisibility, HikeType, TrackStatus } from "@/generated/prisma/enums";
import { authSession } from "@/lib/auth-utils";
import { createSlug } from "@/lib/slug-generator";
import { parseTrackGpxMetadata } from "@/lib/track-gpx-parser";
import {
  getTrackGpxMetadataState,
  markTrackGpxMetadataStale,
  type TrackGpxCoordinate,
  type TrackGpxSummary,
} from "@/lib/track-gpx-metadata";

export type TrackActionValues = {
  id?: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  status?: TrackStatus;
  fileAssetId?: string | null;
};

type PublicTrackRecord = Prisma.TrackGetPayload<{
  select: {
    id: true;
    title: true;
    slug: true;
    description: true;
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
  map: {
    title: string;
    bounds: TrackGpxSummary["bounds"];
    geometry: TrackGpxCoordinate[];
  } | null;
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

const getTrackData = ({ title, slug, description, status, fileAssetId }: TrackActionValues) => {
  const normalizedTitle = normalizeRequiredText(title, "Title");
  const normalizedStatus = status ?? DEFAULT_TRACK_STATUS;
  const normalizedFileAssetId = normalizeRequiredText(fileAssetId ?? "", "GPX file");

  if (!TRACK_STATUSES.has(normalizedStatus)) {
    throw new Error("Track status is invalid");
  }

  return {
    title: normalizedTitle,
    slug: normalizeTrackSlug(normalizedTitle, slug),
    description: normalizeOptionalText(description),
    status: normalizedStatus,
    fileAssetId: normalizedFileAssetId,
  };
};

const ensureSlugAvailable = async ({ slug, id }: { slug: string; id?: string }) => {
  const { default: prisma } = await import("@/lib/prisma");
  const existingTrack = await prisma.track.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingTrack && existingTrack.id !== id) {
    throw new Error("A track with this slug already exists");
  }
};

const ensureEligibleTrackFileAsset = async ({
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
    map:
      includeMapGeometry && parsedState.status === "SUCCESS" && parsedState.mapGeometry.length > 0
        ? {
            title: track.title,
            bounds: parsedState.summary.bounds,
            geometry: parsedState.mapGeometry,
          }
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
  revalidatePath("/admin/files");
  revalidatePath("/tracks");
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
  const userId = await getRequiredUserId();
  const data = getTrackData(values);
  const { default: prisma } = await import("@/lib/prisma");

  await ensureSlugAvailable({ slug: data.slug });
  await ensureEligibleTrackFileAsset({ fileAssetId: data.fileAssetId, userId });

  const track = await prisma.track.create({
    data: {
      ...data,
      userId,
    },
    include: trackListInclude,
  });

  revalidateTrackPaths();

  return track;
};

export const updateTrack = async (values: TrackActionValues) => {
  if (!values.id) {
    throw new Error("Track id is required");
  }

  const userId = await getRequiredUserId();
  const data = getTrackData(values);
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
    data: { metadata: metadataToPersist as Prisma.InputJsonValue },
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
