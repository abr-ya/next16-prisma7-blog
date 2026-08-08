"use server";

import type { ContentTag } from "@/generated/prisma/client";

export type ContentTagOption = Pick<ContentTag, "id" | "name" | "slug">;

export const getAllContentTags = async (): Promise<ContentTagOption[]> => {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    return prisma.contentTag.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getAllContentTags)");
  }
};
