"use server";

import { revalidatePath } from "next/cache";

import { authSession } from "@/lib/auth-utils";

export type VideoActionValues = {
  id?: string;
  title: string;
  url: string;
  videoDate: Date | string;
};

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
};

const normalizeVideoDate = (videoDate: Date | string) => {
  const date = videoDate instanceof Date ? videoDate : new Date(videoDate);

  if (Number.isNaN(date.getTime())) {
    throw new Error("Invalid video date");
  }

  return date;
};

const revalidateVideoAdminPaths = (id?: string) => {
  revalidatePath("/videos");

  if (id) {
    revalidatePath(`/videos/${id}`);
  }
};

export const getAllVideos = async () => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.video.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getAllVideos)");
  }
};

export const getVideoById = async (id: string) => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.video.findFirst({
      where: { id, userId },
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getVideoById)");
  }
};

export const createVideo = async ({ title, url, videoDate }: VideoActionValues) => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const video = await prisma.video.create({
      data: {
        title,
        url,
        videoDate: normalizeVideoDate(videoDate),
        userId,
      },
    });

    revalidateVideoAdminPaths(video.id);

    return video;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (createVideo)");
  }
};

export const updateVideo = async ({ id, title, url, videoDate }: VideoActionValues) => {
  try {
    if (!id) throw new Error("Video id is required");

    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const existingVideo = await prisma.video.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existingVideo) throw new Error("Video not found");

    const video = await prisma.video.update({
      where: { id },
      data: {
        title,
        url,
        videoDate: normalizeVideoDate(videoDate),
      },
    });

    revalidateVideoAdminPaths(video.id);

    return video;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (updateVideo)");
  }
};

export const deleteVideo = async (id: string) => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const res = await prisma.video.deleteMany({
      where: { id, userId },
    });

    revalidateVideoAdminPaths(id);

    return { success: res.count > 0 };
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (deleteVideo)");
  }
};
