"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import type { FileAssetStatus, HikeStatus, HikeType, PhotoStatus, TrackStatus } from "@/generated/prisma/enums";
import { authSession, requireAdmin } from "@/lib/auth-utils";
import { createSlug } from "@/lib/slug-generator";
import { toTrackMapViewModel, type TrackMapViewModel } from "@/lib/track-gpx-metadata";

export type HikeActionValues = {
  id?: string;
  title: string;
  slug?: string | null;
  description?: string | null;
  startDate: Date | string;
  endDate: Date | string;
  type: HikeType;
  status?: HikeStatus;
};

export type HikeTrackOption = {
  id: string;
  title: string;
  slug: string;
  status: TrackStatus;
};

export type HikePhotoOption = {
  id: string;
  title: string;
  status: PhotoStatus;
  previewImage: {
    id: string;
    name: string;
    url: string;
  } | null;
};

type HikePhotoOptionRecord = HikePhotoOption & {
  images: {
    fileAsset: NonNullable<HikePhotoOption["previewImage"]>;
  }[];
};

type HikePhotoIdAssociation = {
  photoId: string;
};

const DEFAULT_HIKE_STATUS: HikeStatus = "DRAFT";
const HIKE_TYPES = new Set<HikeType>(["HIKING", "MOUNTAIN", "WATER", "SKI", "BIKE", "OTHER"]);
const HIKE_STATUSES = new Set<HikeStatus>(["DRAFT", "PUBLISHED"]);
const ACTIVE_FILE_STATUS: FileAssetStatus = "ACTIVE";

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
};

const getRequiredAdminUserId = async () => {
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

const getHikeData = ({ title, slug, description, startDate, endDate, type, status }: HikeActionValues) => {
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

const ensureSlugAvailable = async ({ slug, id }: { slug: string; id?: string }) => {
  const { default: prisma } = await import("@/lib/prisma");
  const existingHike = await prisma.hike.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (existingHike && existingHike.id !== id) {
    throw new Error("A hike with this slug already exists");
  }
};

const hikeListInclude = {
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  tracks: {
    orderBy: {
      assignedAt: "desc",
    },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          slug: true,
          status: true,
        },
      },
    },
  },
  photos: {
    orderBy: [{ position: "asc" }, { assignedAt: "desc" }],
    include: {
      photo: {
        select: {
          id: true,
          title: true,
          status: true,
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
                  url: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.HikeInclude;

const publicHikeInclude = {
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  tracks: {
    where: {
      track: {
        status: "PUBLISHED",
      },
    },
    orderBy: {
      assignedAt: "desc",
    },
    include: {
      track: {
        select: {
          id: true,
          title: true,
          slug: true,
          description: true,
          status: true,
          updatedAt: true,
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
      photo: {
        status: "PUBLISHED",
      },
    },
    orderBy: [{ position: "asc" }, { assignedAt: "desc" }],
    include: {
      photo: {
        select: {
          id: true,
          title: true,
          description: true,
          status: true,
          images: {
            where: {
              fileAsset: {
                status: ACTIVE_FILE_STATUS,
              },
            },
            orderBy: {
              sortOrder: "asc",
            },
            select: {
              sortOrder: true,
              fileAsset: {
                select: {
                  id: true,
                  name: true,
                  mimeType: true,
                  sizeBytes: true,
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.HikeInclude;

export type HikeListItem = Prisma.HikeGetPayload<{
  include: typeof hikeListInclude;
}>;

type PublicHikeRecord = Prisma.HikeGetPayload<{
  include: typeof publicHikeInclude;
}>;

export type PublicHike = Omit<PublicHikeRecord, "tracks"> & {
  tracks: {
    hikeId: string;
    trackId: string;
    assignedAt: Date;
    track: {
      id: string;
      title: string;
      slug: string;
      description: string | null;
      status: TrackStatus;
      updatedAt: Date;
      map: TrackMapViewModel | null;
    };
  }[];
};

const toPublicHike = (hike: PublicHikeRecord): PublicHike => ({
  ...hike,
  tracks: hike.tracks.map((association) => {
    const { metadata, fileAsset, ...track } = association.track;

    return {
      ...association,
      track: {
        ...track,
        map: toTrackMapViewModel(track.title, metadata, {
          fileAssetId: fileAsset.id,
          fileKey: fileAsset.fileKey,
        }),
      },
    };
  }),
});

const revalidateHikePaths = (slug?: string | null) => {
  revalidatePath("/admin/hikes");
  revalidatePath("/hikes");

  if (slug) {
    revalidatePath(`/hikes/${slug}`);
  }
};

const revalidateHikeTrackAssociationPaths = ({
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

const revalidateHikePhotoAssociationPaths = (hikeSlug?: string | null) => {
  revalidateHikePaths(hikeSlug);
  revalidatePath("/admin/photos");
};

const normalizeHikePhotoPositions = async (
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

export const getAllHikes = async (): Promise<HikeListItem[]> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.hike.findMany({
    where: { userId },
    include: hikeListInclude,
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });
};

export const getHikePhotoOptions = async (): Promise<HikePhotoOption[]> => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const photos = (await prisma.photo.findMany({
    select: {
      id: true,
      title: true,
      status: true,
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
              url: true,
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
    previewImage: photo.images.at(0)?.fileAsset ?? null,
  }));
};

export const getHikeById = async (id: string): Promise<HikeListItem | null> => {
  const userId = await getRequiredUserId();
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.hike.findFirst({
    where: { id, userId },
    include: hikeListInclude,
  });
};

export const getPublicHikes = async (): Promise<HikeListItem[]> => {
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.hike.findMany({
    where: { status: "PUBLISHED" },
    include: hikeListInclude,
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
  });
};

export const getPublicHikeBySlug = async (slug: string): Promise<PublicHike | null> => {
  const { default: prisma } = await import("@/lib/prisma");

  const hike = await prisma.hike.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: publicHikeInclude,
  });

  return hike ? toPublicHike(hike) : null;
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

export const createHike = async (values: HikeActionValues) => {
  const userId = await getRequiredUserId();
  const data = getHikeData(values);
  const { default: prisma } = await import("@/lib/prisma");

  await ensureSlugAvailable({ slug: data.slug });

  const hike = await prisma.hike.create({
    data: {
      ...data,
      userId,
    },
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
