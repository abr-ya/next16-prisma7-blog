"use server";

import { revalidatePath } from "next/cache";

import type { VideoChannel } from "@/generated/prisma/client";
import type { VideoChannelVisibility } from "@/generated/prisma/enums";
import { authSession } from "@/lib/auth-utils";

export type VideoChannelActionValues = {
  id?: string;
  name: string;
  url: string;
  imageUrl?: string | null;
  visibility?: VideoChannelVisibility;
};

export type PublicVideoChannelOption = Pick<VideoChannel, "id" | "name">;

const DEFAULT_VIDEO_CHANNEL_VISIBILITY: VideoChannelVisibility = "PUBLIC";

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
};

const normalizeRequiredUrl = (value: string, fieldName: string) => {
  const normalizedValue = value.trim();

  try {
    const url = new URL(normalizedValue);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error(`${fieldName} must use http or https`);
    }

    return url.toString();
  } catch {
    throw new Error(`${fieldName} must be a valid URL`);
  }
};

const normalizeOptionalUrl = (value: string | null | undefined, fieldName: string) => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) return null;

  return normalizeRequiredUrl(normalizedValue, fieldName);
};

const normalizeVideoChannelName = (name: string) => {
  const normalizedName = name.trim();

  if (!normalizedName) {
    throw new Error("Channel name is required");
  }

  return normalizedName;
};

const revalidateVideoChannelPaths = (id?: string) => {
  revalidatePath("/admin/video-channels");
  revalidatePath("/admin/videos");
  revalidatePath("/videos");

  if (id) {
    revalidatePath(`/admin/video-channels/${id}`);
  }
};

export const getAllVideoChannels = async (): Promise<VideoChannel[]> => {
  try {
    await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.videoChannel.findMany({
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getAllVideoChannels)");
  }
};

export const getVideoChannelById = async (id: string): Promise<VideoChannel | null> => {
  try {
    await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.videoChannel.findUnique({
      where: { id },
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getVideoChannelById)");
  }
};

export const getPublicVideoChannelOptions = async (): Promise<PublicVideoChannelOption[]> => {
  try {
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.videoChannel.findMany({
      where: {
        visibility: "PUBLIC",
        videos: {
          some: {
            visibility: "PUBLIC",
          },
        },
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: [{ name: "asc" }, { createdAt: "desc" }],
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getPublicVideoChannelOptions)");
  }
};

export const createVideoChannel = async ({
  name,
  url,
  imageUrl,
  visibility = DEFAULT_VIDEO_CHANNEL_VISIBILITY,
}: VideoChannelActionValues) => {
  try {
    await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const channel = await prisma.videoChannel.create({
      data: {
        name: normalizeVideoChannelName(name),
        url: normalizeRequiredUrl(url, "Channel URL"),
        imageUrl: normalizeOptionalUrl(imageUrl, "Channel image URL"),
        visibility,
      },
    });

    revalidateVideoChannelPaths(channel.id);

    return channel;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (createVideoChannel)");
  }
};

export const updateVideoChannel = async ({
  id,
  name,
  url,
  imageUrl,
  visibility = DEFAULT_VIDEO_CHANNEL_VISIBILITY,
}: VideoChannelActionValues) => {
  try {
    if (!id) throw new Error("Video channel id is required");

    await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const channel = await prisma.videoChannel.update({
      where: { id },
      data: {
        name: normalizeVideoChannelName(name),
        url: normalizeRequiredUrl(url, "Channel URL"),
        imageUrl: normalizeOptionalUrl(imageUrl, "Channel image URL"),
        visibility,
      },
    });

    revalidateVideoChannelPaths(channel.id);

    return channel;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (updateVideoChannel)");
  }
};

export const deleteVideoChannel = async (id: string) => {
  try {
    await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    await prisma.videoChannel.delete({
      where: { id },
    });

    revalidateVideoChannelPaths(id);

    return { success: true };
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (deleteVideoChannel)");
  }
};
