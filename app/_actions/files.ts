"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";

export const markFileAssetPendingDelete = async (fileId: string) => {
  await requireAdmin();

  const result = await prisma.fileAsset.updateMany({
    where: {
      id: fileId,
      status: "ACTIVE",
    },
    data: {
      status: "PENDING_DELETE",
      deletedAt: new Date(),
    },
  });

  if (result.count === 0) {
    return {
      success: false,
      message: "File is no longer active.",
    };
  }

  revalidatePath("/admin/files");

  return {
    success: true,
    message: "File marked pending delete.",
  };
};

export const markDiscardedTrackGpxFileAssetsPendingDelete = async (fileIds: string[]) => {
  await requireAdmin();

  const uniqueFileIds = Array.from(new Set(fileIds.map((fileId) => fileId.trim()).filter(Boolean)));

  if (uniqueFileIds.length === 0) {
    return {
      success: true,
      message: "No uploaded GPX files to discard.",
    };
  }

  const safeFiles = await prisma.fileAsset.findMany({
    where: {
      id: {
        in: uniqueFileIds,
      },
      status: "ACTIVE",
      purpose: "TRACK_GPX",
      track: null,
    },
    select: {
      id: true,
    },
  });
  const safeFileIds = new Set(safeFiles.map((file: { id: string }) => file.id));
  const unsafeFileId = uniqueFileIds.find((fileId) => !safeFileIds.has(fileId));

  if (unsafeFileId) {
    return {
      success: false,
      message: "An uploaded GPX file is no longer safe to discard.",
    };
  }

  await prisma.fileAsset.updateMany({
    where: {
      id: {
        in: uniqueFileIds,
      },
      status: "ACTIVE",
      purpose: "TRACK_GPX",
      track: null,
    },
    data: {
      status: "PENDING_DELETE",
      deletedAt: new Date(),
    },
  });

  revalidatePath("/admin/files");
  revalidatePath("/admin/tracks");

  return {
    success: true,
    message: "Uploaded GPX file discarded.",
  };
};
