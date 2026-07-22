"use server";

import type { VideoTag } from "@/generated/prisma/client";
import { authSession } from "@/lib/auth-utils";

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
};

export type VideoTagOption = Pick<VideoTag, "id" | "name" | "slug">;

export const getAllVideoTags = async (): Promise<VideoTagOption[]> => {
  try {
    await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.videoTag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
      },
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getAllVideoTags)");
  }
};
