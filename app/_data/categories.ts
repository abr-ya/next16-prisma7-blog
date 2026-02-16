"use server";

import { ICategory } from "@/hooks/use-category-dialog";
import { authSession } from "@/lib/auth-utils";

export const getCategories = async () => {
  try {
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.category.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const createCategory = async (name: string) => {
  try {
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.category.create({
      data: {
        name,
        userId: session.user.id,
      },
    });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const updateCategory = async ({ id, name }: ICategory) => {
  try {
    const session = await authSession();

    if (!session) {
      throw new Error("Unauthorized: User Id not found");
    }

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.category.update({
      where: { id },
      data: { name },
    });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};
