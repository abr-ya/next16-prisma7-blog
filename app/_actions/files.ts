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
