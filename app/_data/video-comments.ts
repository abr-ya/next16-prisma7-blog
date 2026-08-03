"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { authSession } from "@/lib/auth-utils";
import type { CommentListItem } from "@/lib/comments";

const MAX_COMMENT_CONTENT_LENGTH = 2000;

export type VideoCommentActionValues = {
  id?: string;
  videoId: string;
  content: string;
};

export type PublicVideoComment = Prisma.CommentGetPayload<{
  select: {
    id: true;
    videoId: true;
    content: true;
    createdAt: true;
    userId: true;
    user: {
      select: {
        id: true;
        name: true;
        image: true;
      };
    };
    video: {
      select: {
        id: true;
        title: true;
        thumbnailUrl: true;
      };
    };
  };
}>;

const videoCommentSelect = {
  id: true,
  videoId: true,
  content: true,
  createdAt: true,
  userId: true,
  user: {
    select: {
      id: true,
      name: true,
      image: true,
    },
  },
  video: {
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
    },
  },
} satisfies Prisma.CommentSelect;

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
};

const normalizeCommentContent = (value: string) => {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error("Comment content is required");
  }

  if (normalizedValue.length > MAX_COMMENT_CONTENT_LENGTH) {
    throw new Error(`Comment content must be ${MAX_COMMENT_CONTENT_LENGTH} characters or fewer`);
  }

  return normalizedValue;
};

const getPublicVideoOrThrow = async (videoId: string) => {
  const { default: prisma } = await import("@/lib/prisma");
  const video = await prisma.video.findFirst({
    where: { id: videoId, visibility: "PUBLIC" },
    select: { id: true },
  });

  if (!video) throw new Error("Public video not found");

  return video;
};

export const getPublicVideoComments = async (videoId: string): Promise<PublicVideoComment[]> => {
  try {
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.comment.findMany({
      where: {
        videoId,
        video: {
          visibility: "PUBLIC",
        },
      },
      select: videoCommentSelect,
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getPublicVideoComments)");
  }
};

const toVideoCommentListItem = (comment: PublicVideoComment): CommentListItem => {
  const videoId = comment.video?.id ?? comment.videoId ?? "";

  return {
    id: comment.id,
    content: comment.content,
    createdAt: comment.createdAt.toISOString(),
    author: {
      id: comment.user.id,
      displayName: comment.user.name,
      image: comment.user.image,
    },
    target: {
      type: "video",
      title: comment.video?.title ?? "Video",
      href: `/videos/${videoId}`,
      previewImageUrl: comment.video?.thumbnailUrl ?? null,
    },
  };
};

export const getPublicVideoCommentListItems = async (videoId: string): Promise<CommentListItem[]> => {
  const comments = await getPublicVideoComments(videoId);

  return comments.map(toVideoCommentListItem);
};

export const createVideoComment = async (values: VideoCommentActionValues) => {
  try {
    const userId = await getRequiredUserId();
    const video = await getPublicVideoOrThrow(values.videoId);
    const { default: prisma } = await import("@/lib/prisma");

    const comment = await prisma.comment.create({
      data: {
        videoId: video.id,
        userId,
        content: normalizeCommentContent(values.content),
      },
      select: videoCommentSelect,
    });

    revalidatePath(`/videos/${video.id}`);

    return comment;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (createVideoComment)");
  }
};

export const updateVideoComment = async (values: VideoCommentActionValues) => {
  try {
    if (!values.id) throw new Error("Comment id is required");

    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");
    const existingComment = await prisma.comment.findFirst({
      where: {
        id: values.id,
        userId,
        videoId: values.videoId,
        video: {
          visibility: "PUBLIC",
        },
      },
      select: { id: true, videoId: true },
    });

    if (!existingComment) throw new Error("Comment not found");

    const comment = await prisma.comment.update({
      where: { id: existingComment.id },
      data: {
        content: normalizeCommentContent(values.content),
      },
      select: videoCommentSelect,
    });

    revalidatePath(`/videos/${existingComment.videoId}`);

    return comment;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (updateVideoComment)");
  }
};

export const deleteVideoComment = async (id: string) => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");
    const existingComment = await prisma.comment.findFirst({
      where: {
        id,
        userId,
        video: {
          visibility: "PUBLIC",
        },
      },
      select: { id: true, videoId: true },
    });

    if (!existingComment) return { success: false };

    await prisma.comment.delete({
      where: { id: existingComment.id },
    });

    revalidatePath(`/videos/${existingComment.videoId}`);

    return { success: true };
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (deleteVideoComment)");
  }
};
