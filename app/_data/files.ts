import "server-only";

import { revalidatePath } from "next/cache";

import type { FileAsset } from "@/generated/prisma/client";
import type { FileAssetPurpose, FileAssetStatus, FileAssetVisibility } from "@/generated/prisma/enums";
import { authSession } from "@/lib/auth-utils";
import { GENERAL_FILE_USER_STORAGE_LIMIT_BYTES } from "@/lib/file-upload-limits";
import prisma from "@/lib/prisma";

const ACTIVE_FILE_STATUS: FileAssetStatus = "ACTIVE";

export type UserFileStats = {
  count: number;
  storageUsedBytes: number;
  storageLimitBytes: number;
  storageRemainingBytes: number;
};

export type UploadThingUsagePoint = {
  label: string;
  route: string;
  surface: string;
  status: "tracked" | "legacy";
  notes: string;
};

export type UploadThingFileAssetInput = {
  userId: string;
  fileKey: string;
  customId?: string | null;
  url: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  purpose?: FileAssetPurpose;
  visibility?: FileAssetVisibility;
};

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
};

export const getUserFileStats = async (userId: string): Promise<UserFileStats> => {
  const [count, aggregate] = await Promise.all([
    prisma.fileAsset.count({
      where: {
        ownerUserId: userId,
        status: ACTIVE_FILE_STATUS,
      },
    }),
    prisma.fileAsset.aggregate({
      where: {
        ownerUserId: userId,
        status: ACTIVE_FILE_STATUS,
      },
      _sum: {
        sizeBytes: true,
      },
    }),
  ]);
  const storageUsedBytes = aggregate._sum.sizeBytes ?? 0;

  return {
    count,
    storageUsedBytes,
    storageLimitBytes: GENERAL_FILE_USER_STORAGE_LIMIT_BYTES,
    storageRemainingBytes: Math.max(0, GENERAL_FILE_USER_STORAGE_LIMIT_BYTES - storageUsedBytes),
  };
};

export const getCurrentUserFileStats = async () => {
  const userId = await getRequiredUserId();

  return getUserFileStats(userId);
};

export const listCurrentUserFileAssets = async (): Promise<FileAsset[]> => {
  const userId = await getRequiredUserId();

  return prisma.fileAsset.findMany({
    where: {
      ownerUserId: userId,
      status: ACTIVE_FILE_STATUS,
    },
    orderBy: {
      uploadedAt: "desc",
    },
  });
};

export const listTrackedFileAssets = async (): Promise<FileAsset[]> => {
  await getRequiredUserId();

  return prisma.fileAsset.findMany({
    where: {
      status: ACTIVE_FILE_STATUS,
    },
    orderBy: {
      uploadedAt: "desc",
    },
    take: 50,
  });
};

export const getUploadThingUsagePoints = (): UploadThingUsagePoint[] => [
  {
    label: "General files",
    route: "fileUploader",
    surface: "/admin/files",
    status: "tracked",
    notes: "New first-party FileAsset flow for admin uploads.",
  },
  {
    label: "Rich-text post images",
    route: "imageUploader",
    surface: "components/common/rich-text-editor.tsx",
    status: "legacy",
    notes: "Stored in post HTML and synced to PostImage when posts are saved.",
  },
  {
    label: "Admin image uploader",
    route: "imageUploader",
    surface: "components/admin-pages/image-uploader.tsx",
    status: "legacy",
    notes: "Used by admin forms as URL-only media controls.",
  },
  {
    label: "Markdown doc preview image",
    route: "imageUploader",
    surface: "components/admin-pages/md-doc-form.tsx",
    status: "legacy",
    notes: "Stored as MdDoc.previewImageUrl and not migrated to FileAsset in this slice.",
  },
  {
    label: "Blog post image",
    route: "imageUploader",
    surface: "components/admin-pages/post-form.tsx",
    status: "legacy",
    notes: "Stored as Post.imageUrl and not migrated to FileAsset in this slice.",
  },
];

export const canUserUploadGeneralFiles = async (userId: string, incomingBytes = 0) => {
  const stats = await getUserFileStats(userId);

  return stats.storageUsedBytes + incomingBytes <= stats.storageLimitBytes;
};

export const recordUploadThingFileAsset = async ({
  userId,
  fileKey,
  customId,
  url,
  name,
  mimeType,
  sizeBytes,
  purpose = "ADMIN_UPLOAD",
  visibility = "PRIVATE",
}: UploadThingFileAssetInput) => {
  const fileAsset = await prisma.fileAsset.upsert({
    where: {
      fileKey,
    },
    create: {
      provider: "UPLOADTHING",
      fileKey,
      customId,
      url,
      name,
      mimeType,
      sizeBytes,
      purpose,
      visibility,
      status: ACTIVE_FILE_STATUS,
      ownerUserId: userId,
    },
    update: {
      customId,
      url,
      name,
      mimeType,
      sizeBytes,
      purpose,
      visibility,
      status: ACTIVE_FILE_STATUS,
      ownerUserId: userId,
      deletedAt: null,
    },
  });

  revalidatePath("/admin/files");

  return fileAsset;
};

export const getFileAssetForDownload = async (fileId: string, userId?: string) => {
  const fileAsset = await prisma.fileAsset.findUnique({
    where: {
      id: fileId,
    },
  });

  if (!fileAsset || fileAsset.status !== ACTIVE_FILE_STATUS) {
    throw new Error("File not found");
  }

  // Check access based on visibility
  if (fileAsset.visibility === "PRIVATE") {
    if (!userId) {
      throw new Error("Authentication required");
    }

    // Allow owner or admin
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true },
    });

    const isOwner = fileAsset.ownerUserId === userId;
    const isAdmin = user?.role === "admin";

    if (!isOwner && !isAdmin) {
      throw new Error("Access denied");
    }
  }

  // PUBLIC and UNLISTED files are accessible to anyone with the link

  return fileAsset;
};

export const logFileDownload = async (fileId: string, userId?: string, ipAddress?: string) => {
  try {
    await prisma.log.create({
      data: {
        action: "downloadFile",
        userId: userId ?? "anonymous",
        details: JSON.stringify({
          fileId,
          ipAddress,
          timestamp: new Date().toISOString(),
        }),
      },
    });
  } catch (err) {
    console.error("Failed to log file download:", err);
  }
};
