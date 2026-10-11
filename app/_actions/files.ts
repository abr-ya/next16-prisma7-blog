"use server";

import { revalidatePath } from "next/cache";

import { hasAdminRole } from "@/lib/auth-roles";
import { requireActionUser, requireAdmin } from "@/lib/auth-utils";
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
  const actor = await requireActionUser();

  const uniqueFileIds = Array.from(new Set(fileIds.map((fileId) => fileId.trim()).filter(Boolean)));

  if (uniqueFileIds.length === 0) {
    return {
      success: true,
      message: "No uploaded GPX files to discard.",
    };
  }

  // Resolve the actor's admin status once so the ownership filter below can
  // short-circuit for the admin path.
  const actorRecord = await prisma.user.findUnique({
    where: { id: actor.id },
    select: { role: true },
  });
  const isAdmin = hasAdminRole(actorRecord?.role);

  const safeFiles = await prisma.fileAsset.findMany({
    where: {
      id: {
        in: uniqueFileIds,
      },
      status: "ACTIVE",
      purpose: "TRACK_GPX",
      track: null,
      // Non-admin actors can only discard uploads they own. Administrators
      // can discard any qualifying file from the admin workspace.
      ...(isAdmin ? {} : { ownerUserId: actor.id }),
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
      message: isAdmin
        ? "An uploaded GPX file is no longer safe to discard."
        : "You can only discard GPX files you uploaded.",
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
      ...(isAdmin ? {} : { ownerUserId: actor.id }),
    },
    data: {
      status: "PENDING_DELETE",
      deletedAt: new Date(),
    },
  });

  revalidatePath("/admin/files");
  revalidatePath("/admin/tracks");
  revalidatePath("/my/tracks");

  return {
    success: true,
    message: "Uploaded GPX file discarded.",
  };
};
