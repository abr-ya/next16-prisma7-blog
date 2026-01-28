"use server";

import { nanoid } from "nanoid";
import { authSession } from "@/lib/auth-utils";

export const createLink = async (name: string, description: string, url: string) => {
  try {
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.link.create({
      data: {
        name,
        description,
        shortCode: nanoid(8),
        url,
        userId: session.user.id,
      },
    });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const getLinks = async () => {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.link.findMany({
      orderBy: { createdAt: "desc" },
    });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};
