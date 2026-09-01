"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import type { FileAssetStatus, PhotoStatus } from "@/generated/prisma/enums";
import { requireAdmin } from "@/lib/auth-utils";
import { markPhotoExifMetadataStale, type PhotoExifSourceImage } from "@/lib/photo-exif-metadata";
import { parsePhotoExifMetadata } from "@/lib/photo-exif-parser";
import { normalizePhotoInput } from "@/lib/photos";

export type PhotoActionValues = {
  id?: string;
  title: string;
  description?: string | null;
  status?: PhotoStatus;
  fileAssetIds?: string[] | null;
};

const ACTIVE_FILE_STATUS: FileAssetStatus = "ACTIVE";

type EligiblePhotoFileAsset = {
  id: string;
  fileKey: string;
  photoImages: {
    photoId: string;
  }[];
};

const getRequiredAdminUserId = async () => {
  const session = await requireAdmin();

  return session.user.id;
};

const photoListInclude = {
  images: {
    include: {
      fileAsset: true,
    },
    orderBy: {
      sortOrder: "asc",
    },
  },
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
} satisfies Prisma.PhotoInclude;

export type PhotoListItem = Prisma.PhotoGetPayload<{
  include: typeof photoListInclude;
}>;

const revalidatePhotoPaths = () => {
  revalidatePath("/admin/photos");
  revalidatePath("/admin/files");
};

const ensureEligiblePhotoFileAssets = async ({
  fileAssetIds,
  userId,
  photoId,
}: {
  fileAssetIds: string[];
  userId: string;
  photoId?: string;
}) => {
  const { default: prisma } = await import("@/lib/prisma");
  const fileAssets: EligiblePhotoFileAsset[] = await prisma.fileAsset.findMany({
    where: {
      id: {
        in: fileAssetIds,
      },
      ownerUserId: userId,
      purpose: "OUTDOOR_PHOTO_IMAGE",
      status: ACTIVE_FILE_STATUS,
    },
    select: {
      id: true,
      fileKey: true,
      photoImages: {
        select: {
          photoId: true,
        },
      },
    },
  });
  const fileAssetsById = new Map(fileAssets.map((fileAsset) => [fileAsset.id, fileAsset]));
  const missingId = fileAssetIds.find((fileAssetId) => !fileAssetsById.has(fileAssetId));

  if (missingId) {
    throw new Error("Selected image file is not eligible for photos");
  }

  const alreadyBound = fileAssets.find((fileAsset) =>
    fileAsset.photoImages.some((photoImage) => photoImage.photoId !== photoId),
  );

  if (alreadyBound) {
    throw new Error("Selected image file is already linked to another photo");
  }

  return fileAssetIds.map((fileAssetId, index) => {
    const fileAsset = fileAssetsById.get(fileAssetId);

    if (!fileAsset) {
      throw new Error("Selected image file is not eligible for photos");
    }

    return {
      fileAssetId: fileAsset.id,
      fileKey: fileAsset.fileKey,
      sortOrder: index,
    } satisfies PhotoExifSourceImage;
  });
};

const getPhotoImageCreateData = (fileAssetIds: string[]) =>
  fileAssetIds.map((fileAssetId, index) => ({
    fileAssetId,
    sortOrder: index,
  }));

export const listPhotos = async (): Promise<PhotoListItem[]> => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.photo.findMany({
    include: photoListInclude,
    orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
  });
};

export const getPhotoById = async (id: string): Promise<PhotoListItem | null> => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");

  return prisma.photo.findUnique({
    where: { id },
    include: photoListInclude,
  });
};

export const createPhoto = async (values: PhotoActionValues) => {
  const userId = await getRequiredAdminUserId();
  const data = normalizePhotoInput(values);
  const { default: prisma } = await import("@/lib/prisma");

  await ensureEligiblePhotoFileAssets({ fileAssetIds: data.fileAssetIds, userId });

  const photo = await prisma.photo.create({
    data: {
      title: data.title,
      description: data.description,
      status: data.status,
      userId,
      images: {
        create: getPhotoImageCreateData(data.fileAssetIds),
      },
    },
    include: photoListInclude,
  });

  revalidatePhotoPaths();

  return photo;
};

export const updatePhoto = async (values: PhotoActionValues) => {
  if (!values.id) {
    throw new Error("Photo id is required");
  }

  const userId = await getRequiredAdminUserId();
  const data = normalizePhotoInput(values);
  const { default: prisma } = await import("@/lib/prisma");
  const existingPhoto = await prisma.photo.findUnique({
    where: { id: values.id },
    select: {
      id: true,
      metadata: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: {
          fileAssetId: true,
          sortOrder: true,
          fileAsset: {
            select: {
              fileKey: true,
            },
          },
        },
      },
    },
  });

  if (!existingPhoto) {
    throw new Error("Photo not found");
  }

  const nextSourceImages = await ensureEligiblePhotoFileAssets({
    fileAssetIds: data.fileAssetIds,
    userId,
    photoId: existingPhoto.id,
  });
  const staleMetadata = markPhotoExifMetadataStale(existingPhoto.metadata, nextSourceImages);

  const photo = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    await tx.photoImage.deleteMany({
      where: {
        photoId: existingPhoto.id,
      },
    });

    return tx.photo.update({
      where: { id: existingPhoto.id },
      data: {
        title: data.title,
        description: data.description,
        status: data.status,
        ...(staleMetadata ? { metadata: staleMetadata as Prisma.InputJsonValue } : {}),
        images: {
          create: getPhotoImageCreateData(data.fileAssetIds),
        },
      },
      include: photoListInclude,
    });
  });

  revalidatePhotoPaths();

  return photo;
};

type PhotoRefreshImage = {
  sortOrder: number;
  fileAsset: {
    id: string;
    fileKey: string;
    url: string;
    purpose: string;
    status: FileAssetStatus;
  };
};

export const refreshPhotoExifMetadata = async (id: string) => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const photo = (await prisma.photo.findUnique({
    where: { id },
    select: {
      id: true,
      images: {
        orderBy: { sortOrder: "asc" },
        select: {
          sortOrder: true,
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
      },
    },
  })) as { id: string; images: PhotoRefreshImage[] } | null;

  if (!photo) {
    throw new Error("Photo not found");
  }

  const ineligibleImage = photo.images.find(
    (image) => image.fileAsset.purpose !== "OUTDOOR_PHOTO_IMAGE" || image.fileAsset.status !== ACTIVE_FILE_STATUS,
  );

  if (ineligibleImage) {
    throw new Error("Selected image file is not eligible for photos");
  }

  const metadata = await parsePhotoExifMetadata({
    images: photo.images.map((image) => ({
      fileAssetId: image.fileAsset.id,
      fileKey: image.fileAsset.fileKey,
      sortOrder: image.sortOrder,
      url: image.fileAsset.url,
    })),
  });

  await prisma.photo.update({
    where: { id: photo.id },
    data: { metadata: metadata as Prisma.InputJsonValue },
  });

  revalidatePhotoPaths();

  return metadata;
};

export const deletePhoto = async (id: string) => {
  await getRequiredAdminUserId();
  const { default: prisma } = await import("@/lib/prisma");
  const existingPhoto = await prisma.photo.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existingPhoto) {
    return { success: false };
  }

  await prisma.photo.delete({
    where: { id: existingPhoto.id },
  });

  revalidatePhotoPaths();

  return { success: true };
};
