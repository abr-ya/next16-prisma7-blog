"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { authSession } from "@/lib/auth-utils";

const MAX_BOOKMARK_LABEL_LENGTH = 80;
const MAX_BOOKMARK_NOTE_LENGTH = 500;

export type VideoBookmarkActionValues = {
  id?: string;
  videoId: string;
  timestampSeconds: number | string;
  label?: string | null;
  note?: string | null;
};

type SelectedVideoBookmark = Prisma.VideoBookmarkGetPayload<{
  select: {
    id: true;
    videoId: true;
    userId: true;
    user: {
      select: {
        name: true;
      };
    };
    timestampSeconds: true;
    label: true;
    note: true;
    createdAt: true;
    updatedAt: true;
  };
}>;

export type PublicVideoBookmark = {
  id: string;
  videoId: string;
  ownerUserId: string;
  ownerName: string;
  isOwnedByCurrentUser: boolean;
  timestampSeconds: number;
  label: string | null;
  note: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const videoBookmarkSelect = {
  id: true,
  videoId: true,
  userId: true,
  user: {
    select: {
      name: true,
    },
  },
  timestampSeconds: true,
  label: true,
  note: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.VideoBookmarkSelect;

const getRequiredUserId = async () => {
  const session = await authSession();

  if (!session) throw new Error("Unauthorized: User Id not found");

  return session.user.id;
};

const normalizeBookmarkTimestamp = (value: number | string) => {
  if (typeof value === "string" && !value.trim()) {
    throw new Error("Bookmark timestamp is required");
  }

  const normalizedValue = typeof value === "string" ? Number(value.trim()) : value;

  if (!Number.isInteger(normalizedValue) || normalizedValue < 0) {
    throw new Error("Bookmark timestamp must be a non-negative whole number of seconds");
  }

  return normalizedValue;
};

const normalizeOptionalText = (value: string | null | undefined, maxLength: number, fieldName: string) => {
  const normalizedValue = value?.trim();

  if (!normalizedValue) return null;

  if (normalizedValue.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer`);
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

const getBookmarkMutationData = ({ timestampSeconds, label, note }: VideoBookmarkActionValues) => ({
  timestampSeconds: normalizeBookmarkTimestamp(timestampSeconds),
  label: normalizeOptionalText(label, MAX_BOOKMARK_LABEL_LENGTH, "Bookmark label"),
  note: normalizeOptionalText(note, MAX_BOOKMARK_NOTE_LENGTH, "Bookmark note"),
});

const toPublicVideoBookmark = (bookmark: SelectedVideoBookmark, currentUserId: string): PublicVideoBookmark => ({
  id: bookmark.id,
  videoId: bookmark.videoId,
  ownerUserId: bookmark.userId,
  ownerName: bookmark.user.name,
  isOwnedByCurrentUser: bookmark.userId === currentUserId,
  timestampSeconds: bookmark.timestampSeconds,
  label: bookmark.label,
  note: bookmark.note,
  createdAt: bookmark.createdAt,
  updatedAt: bookmark.updatedAt,
});

export const getCurrentUserVideoBookmarks = async (videoId: string): Promise<PublicVideoBookmark[]> => {
  try {
    const session = await authSession();

    if (!session) return [];

    const { default: prisma } = await import("@/lib/prisma");

    const bookmarks = await prisma.videoBookmark.findMany({
      where: {
        userId: session.user.id,
        videoId,
        video: {
          visibility: "PUBLIC",
        },
      },
      select: videoBookmarkSelect,
      orderBy: [{ timestampSeconds: "asc" }, { createdAt: "asc" }],
    });

    return bookmarks.map((bookmark) => toPublicVideoBookmark(bookmark, session.user.id));
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getCurrentUserVideoBookmarks)");
  }
};

export const getAllPublicVideoBookmarks = async (videoId: string): Promise<PublicVideoBookmark[]> => {
  try {
    const session = await authSession();

    if (!session) return [];

    const { default: prisma } = await import("@/lib/prisma");

    const bookmarks = await prisma.videoBookmark.findMany({
      where: {
        videoId,
        video: {
          visibility: "PUBLIC",
        },
      },
      select: videoBookmarkSelect,
      orderBy: [{ timestampSeconds: "asc" }, { createdAt: "asc" }],
    });

    return bookmarks.map((bookmark) => toPublicVideoBookmark(bookmark, session.user.id));
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getAllPublicVideoBookmarks)");
  }
};

export const createVideoBookmark = async (values: VideoBookmarkActionValues) => {
  try {
    const userId = await getRequiredUserId();
    const video = await getPublicVideoOrThrow(values.videoId);
    const { default: prisma } = await import("@/lib/prisma");

    const bookmark = await prisma.videoBookmark.create({
      data: {
        videoId: video.id,
        userId,
        ...getBookmarkMutationData(values),
      },
      select: videoBookmarkSelect,
    });

    revalidatePath(`/videos/${video.id}`);

    return toPublicVideoBookmark(bookmark, userId);
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (createVideoBookmark)");
  }
};

export const updateVideoBookmark = async (values: VideoBookmarkActionValues) => {
  try {
    if (!values.id) throw new Error("Bookmark id is required");

    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");
    const existingBookmark = await prisma.videoBookmark.findFirst({
      where: {
        id: values.id,
        userId,
        video: {
          visibility: "PUBLIC",
        },
      },
      select: { id: true, videoId: true },
    });

    if (!existingBookmark) throw new Error("Bookmark not found");

    const bookmark = await prisma.videoBookmark.update({
      where: { id: existingBookmark.id },
      data: getBookmarkMutationData(values),
      select: videoBookmarkSelect,
    });

    revalidatePath(`/videos/${existingBookmark.videoId}`);

    return toPublicVideoBookmark(bookmark, userId);
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (updateVideoBookmark)");
  }
};

export const deleteVideoBookmark = async (id: string) => {
  try {
    const userId = await getRequiredUserId();
    const { default: prisma } = await import("@/lib/prisma");
    const existingBookmark = await prisma.videoBookmark.findFirst({
      where: {
        id,
        userId,
        video: {
          visibility: "PUBLIC",
        },
      },
      select: { id: true, videoId: true },
    });

    if (!existingBookmark) return { success: false };

    await prisma.videoBookmark.delete({
      where: { id: existingBookmark.id },
    });

    revalidatePath(`/videos/${existingBookmark.videoId}`);

    return { success: true };
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (deleteVideoBookmark)");
  }
};
