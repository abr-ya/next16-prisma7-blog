"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import type { VideoVisibility } from "@/generated/prisma/enums";
import { authSession } from "@/lib/auth-utils";
import { normalizeVideoTags, type VideoTagInput } from "@/lib/video-tags";
import { normalizeVideoThumbnailUrl } from "@/lib/video-thumbnail-url";
import { extractVideoProviderMetadata } from "@/lib/video-providers";
import { getYouTubeThumbnailUrl } from "@/lib/video-providers/youtube";

export type VideoActionValues = {
  id?: string;
  title: string;
  url: string;
  thumbnailUrl?: string | null;
  channelId?: string | null;
  tags?: VideoTagInput[];
  videoDate: Date | string;
  visibility?: VideoVisibility;
};

export type VideoWithChannel = Prisma.VideoGetPayload<{
  include: { channel: true; tags: { include: { tag: true } } };
}>;

export type PublicVideoSort = "createdAt-desc" | "videoDate-desc" | "title-asc";

const DEFAULT_VIDEO_VISIBILITY: VideoVisibility = "PRIVATE";
const DEFAULT_PUBLIC_VIDEO_SORT: PublicVideoSort = "videoDate-desc";
const DEFAULT_PUBLIC_VIDEO_PAGE = 1;
const DEFAULT_PUBLIC_VIDEO_PAGE_SIZE = 12;

const publicVideoOrderBy: Record<PublicVideoSort, Prisma.VideoOrderByWithRelationInput[]> = {
  "createdAt-desc": [{ createdAt: "desc" }, { videoDate: "desc" }],
  "videoDate-desc": [{ videoDate: "desc" }, { createdAt: "desc" }],
  "title-asc": [{ title: "asc" }, { videoDate: "desc" }],
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

const getVideoMetadataData = ({
  url,
  thumbnailUrl,
  allowProviderThumbnail,
}: {
  url: string;
  thumbnailUrl?: string | null;
  allowProviderThumbnail: boolean;
}) => {
  const metadata = extractVideoProviderMetadata(url);
  const normalizedThumbnailUrl = normalizeVideoThumbnailUrl(thumbnailUrl);
  const providerThumbnailUrl = allowProviderThumbnail ? normalizeVideoThumbnailUrl(metadata.thumbnailUrl) : null;

  return {
    thumbnailUrl: normalizedThumbnailUrl ?? providerThumbnailUrl,
    provider: metadata.provider,
    providerVideoId: metadata.providerVideoId,
    embedUrl: metadata.embedUrl,
    durationSeconds: metadata.durationSeconds,
  };
};

const videoWithMetadataInclude = {
  channel: true,
  tags: {
    include: {
      tag: true,
    },
  },
} satisfies Prisma.VideoInclude;

const getVideoTagAssignmentData = async (tags: VideoTagInput[] = []) => {
  const normalizedTags = normalizeVideoTags(tags);
  const { default: prisma } = await import("@/lib/prisma");

  console.log("[video-tags-debug] getVideoTagAssignmentData", {
    inputTags: tags,
    normalizedTags,
  });

  const persistedTags = await Promise.all(
    normalizedTags.map((tag) =>
      prisma.videoTag.upsert({
        where: { slug: tag.slug },
        create: tag,
        update: { name: tag.name },
        select: { id: true },
      }),
    ),
  );

  console.log("[video-tags-debug] persisted video tags", {
    persistedTags,
  });

  return persistedTags.map((tag) => ({
    tagId: tag.id,
  }));
};

const revalidateVideoAdminPaths = (id?: string) => {
  revalidatePath("/admin/videos");
  revalidatePath("/videos");

  if (id) {
    revalidatePath(`/admin/videos/${id}`);
    revalidatePath(`/videos/${id}`);
  }
};

export type VideoListQuery = {
  channelId?: string | null;
};

export const getAllVideos = async ({ channelId }: VideoListQuery = {}) => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.video.findMany({
      where: { userId, ...(channelId ? { channelId } : {}) },
      include: videoWithMetadataInclude,
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
      include: videoWithMetadataInclude,
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getVideoById)");
  }
};

export const getPublicVideos = async ({
  sort = DEFAULT_PUBLIC_VIDEO_SORT,
  page = DEFAULT_PUBLIC_VIDEO_PAGE,
  pageSize = DEFAULT_PUBLIC_VIDEO_PAGE_SIZE,
  channelId,
}: {
  sort?: PublicVideoSort;
  page?: number;
  pageSize?: number;
  channelId?: string | null;
} = {}): Promise<{
  videos: VideoWithChannel[];
  totalCount: number;
  page: number;
  pageCount: number;
  pageSize: number;
}> => {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const where = {
      visibility: "PUBLIC",
      ...(channelId ? { channelId } : {}),
    } satisfies Prisma.VideoWhereInput;
    const normalizedPageSize = Math.max(1, pageSize);
    const totalCount = await prisma.video.count({ where });
    const pageCount = Math.max(1, Math.ceil(totalCount / normalizedPageSize));
    const normalizedPage = Math.min(Math.max(1, page), pageCount);

    const videos = await prisma.video.findMany({
      where,
      include: videoWithMetadataInclude,
      orderBy: publicVideoOrderBy[sort],
      skip: (normalizedPage - 1) * normalizedPageSize,
      take: normalizedPageSize,
    });

    return {
      videos,
      totalCount,
      page: normalizedPage,
      pageCount,
      pageSize: normalizedPageSize,
    };
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
      include: videoWithMetadataInclude,
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
  tags,
  videoDate,
  visibility = DEFAULT_VIDEO_VISIBILITY,
}: VideoActionValues) => {
  try {
    console.log("[video-tags-debug] createVideo received tags", { tags });

    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");
    const tagAssignments = await getVideoTagAssignmentData(tags);

    console.log("[video-tags-debug] createVideo tagAssignments", { tagAssignments });

    const video = await prisma.video.create({
      data: {
        title,
        url,
        ...getVideoMetadataData({ url, thumbnailUrl, allowProviderThumbnail: true }),
        channelId: channelId || null,
        tags: {
          create: tagAssignments,
        },
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
  tags,
  videoDate,
  visibility = DEFAULT_VIDEO_VISIBILITY,
}: VideoActionValues) => {
  try {
    if (!id) throw new Error("Video id is required");

    console.log("[video-tags-debug] updateVideo received tags", { id, tags });

    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");

    const existingVideo = await prisma.video.findFirst({
      where: { id, userId },
      select: { id: true, thumbnailUrl: true },
    });

    if (!existingVideo) throw new Error("Video not found");

    const tagAssignments = await getVideoTagAssignmentData(tags);

    console.log("[video-tags-debug] updateVideo tagAssignments", { id, tagAssignments });

    const video = await prisma.video.update({
      where: { id },
      data: {
        title,
        url,
        ...getVideoMetadataData({
          url,
          thumbnailUrl,
          allowProviderThumbnail: !thumbnailUrl && !existingVideo.thumbnailUrl,
        }),
        channelId: channelId || null,
        tags: {
          deleteMany: {},
          create: tagAssignments,
        },
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
      data: { ...extractVideoProviderMetadata(existingVideo.url), thumbnailUrl },
    });

    revalidateVideoAdminPaths(existingVideo.id);

    return { success: true, thumbnailUrl };
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (resolveAndSaveVideoThumbnail)");
  }
};
