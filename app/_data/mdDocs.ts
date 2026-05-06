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
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.mdDoc.findUnique({ where: { id } });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const createMdDoc = async (params: MdDocFormValues) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = params;

    const res = await prisma.mdDoc.create({
      data: rest,
    });

    revalidatePublicMarkdownBlogCaches();

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (createMdDoc)");
  }
};

export const updateMdDoc = async (params: MdDocFormValues) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const { id, ...rest } = params;

    const res = await prisma.mdDoc.update({
      where: { id },
      data: rest,
    });

    revalidatePublicMarkdownBlogCaches();

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (updateMdDoc)");
  }
};

export const deleteMdDoc = async (id: string) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    await prisma.mdDoc.delete({
      where: { id },
    });

    revalidatePublicMarkdownBlogCaches();

    return { success: true };
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (deleteMdDoc)");
  }
};
