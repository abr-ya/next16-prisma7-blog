"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import type { VideoVisibility } from "@/generated/prisma/enums";
import { authSession } from "@/lib/auth-utils";
import { normalizeVideoThumbnailUrl } from "@/lib/video-thumbnail-url";
import { getYouTubeThumbnailUrl } from "@/lib/video-providers/youtube";

export type VideoActionValues = {
  id?: string;
  title: string;
  url: string;
  thumbnailUrl?: string | null;
  channelId?: string | null;
  videoDate: Date | string;
  visibility?: VideoVisibility;
};

export type VideoWithChannel = Prisma.VideoGetPayload<{
  include: { channel: true };
}>;

const DEFAULT_VIDEO_VISIBILITY: VideoVisibility = "PRIVATE";

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
  revalidatePath("/admin/videos");
  revalidatePath("/videos");

  if (id) {
    revalidatePath(`/admin/videos/${id}`);
    revalidatePath(`/videos/${id}`);
  }
};

export const getAllVideos = async () => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.video.findMany({
      where: { userId },
      include: { channel: true },
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
      include: { channel: true },
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getVideoById)");
  }
};

export const getPublicVideos = async (): Promise<VideoWithChannel[]> => {
  try {
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.video.findMany({
      where: { visibility: "PUBLIC" },
      include: { channel: true },
      orderBy: { videoDate: "desc" },
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getPublicVideos)");
  }
};

export const getPublicVideoById = async (id: string): Promise<VideoWithChannel | null> => {
  try {
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.video.findFirst({
      where: { id, visibility: "PUBLIC" },
      include: { channel: true },
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getPublicVideoById)");
  }
};

export const createVideo = async ({
  title,
  url,
  thumbnailUrl,
  channelId,
  videoDate,
  visibility = DEFAULT_VIDEO_VISIBILITY,
}: VideoActionValues) => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const video = await prisma.video.create({
      data: {
        title,
        url,
        thumbnailUrl: normalizeVideoThumbnailUrl(thumbnailUrl),
        channelId: channelId || null,
        videoDate: normalizeVideoDate(videoDate),
        visibility,
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

export const updateVideo = async ({
  id,
  title,
  url,
  thumbnailUrl,
  channelId,
  videoDate,
  visibility = DEFAULT_VIDEO_VISIBILITY,
}: VideoActionValues) => {
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
        thumbnailUrl: normalizeVideoThumbnailUrl(thumbnailUrl),
        channelId: channelId || null,
        videoDate: normalizeVideoDate(videoDate),
        visibility,
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

export const resolveAndSaveVideoThumbnail = async (id: string) => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const existingVideo = await prisma.video.findFirst({
      where: { id, userId },
      select: { id: true, url: true },
    });

    if (!existingVideo) {
      return { success: false, message: "Video not found" };
    }

    const thumbnailUrl = getYouTubeThumbnailUrl(existingVideo.url);

    if (!thumbnailUrl) {
      return { success: false, message: "Thumbnail fetch supports YouTube watch, youtu.be, shorts, and embed URLs" };
    }

    await prisma.video.update({
      where: { id: existingVideo.id },
      data: { thumbnailUrl },
    });

    revalidateVideoAdminPaths(existingVideo.id);

    return { success: true, thumbnailUrl };
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (resolveAndSaveVideoThumbnail)");
  }
};
