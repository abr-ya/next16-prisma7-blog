"use server";

import type { MdDocFormValues } from "@/components/index";
import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

function revalidatePublicMarkdownBlogCaches() {
  revalidatePath("/");
  revalidatePath("/docs", "layout");
}

export const getMdDocById = async (id: string) => {
  try {
    const { requireAdminControl } = await import("@/lib/auth-utils");
    await requireAdminControl();

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.mdDoc.findUnique({ where: { id } });

    return res;
  } catch (err) {
    if (err instanceof Error && err.name === "AuthorizationError") throw err;
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const createMdDoc = async (params: MdDocFormValues) => {
  try {
    const { requireAdminControl } = await import("@/lib/auth-utils");
    await requireAdminControl();

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, previewImageUrl, ...rest } = params;

    const res = await prisma.mdDoc.create({
      data: {
        ...rest,
        previewImageUrl: previewImageUrl?.trim() || null,
      },
    });

    revalidatePublicMarkdownBlogCaches();

    return res;
  } catch (err) {
    if (err instanceof Error && err.name === "AuthorizationError") throw err;
    console.error({ err });
    throw new Error("Something went wrong (createMdDoc)");
  }
};

export const updateMdDoc = async (params: MdDocFormValues) => {
  try {
    const { requireAdminControl } = await import("@/lib/auth-utils");
    await requireAdminControl();

    const { id, previewImageUrl, ...rest } = params;

    const res = await prisma.mdDoc.update({
      where: { id },
      data: {
        ...rest,
        previewImageUrl: previewImageUrl?.trim() || null,
      },
    });

    revalidatePublicMarkdownBlogCaches();

    return res;
  } catch (err) {
    if (err instanceof Error && err.name === "AuthorizationError") throw err;
    console.error({ err });
    throw new Error("Something went wrong (updateMdDoc)");
  }
};

export const deleteMdDoc = async (id: string) => {
  try {
    const { requireAdminControl } = await import("@/lib/auth-utils");
    await requireAdminControl();

    await prisma.mdDoc.delete({
      where: { id },
    });

    revalidatePublicMarkdownBlogCaches();

    return { success: true };
  } catch (err) {
    if (err instanceof Error && err.name === "AuthorizationError") throw err;
    console.error({ err });
    throw new Error("Something went wrong (deleteMdDoc)");
  }
};
