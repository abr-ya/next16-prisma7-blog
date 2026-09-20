"use server";

import { revalidatePath } from "next/cache";

import type { Prisma } from "@/generated/prisma/client";
import { AuthorizationError, requireActionUser } from "@/lib/auth-utils";
import type { CommentListItem } from "@/lib/comments";

const MAX_COMMENT_CONTENT_LENGTH = 2000;

export type PhotoCommentActionValues = {
  id?: string;
  photoId: string;
  content: string;
};

export type PhotoCommentTargetContext = {
  photoId: string;
  tripSlug: string;
  photoTitle: string;
  previewImageUrl: string | null;
};

export type PhotoCommentListRecord = Prisma.CommentGetPayload<{
  select: {
    id: true;
    photoId: true;
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
    photo: {
      select: {
        id: true;
        title: true;
        images: {
          select: {
            sortOrder: true;
            fileAsset: {
              select: {
                url: true;
              };
            };
          };
          orderBy: { sortOrder: "asc" };
          take: 1;
        };
      };
    };
  };
}>;

const photoCommentSelect = {
  id: true,
  photoId: true,
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
  photo: {
    select: {
      id: true,
      title: true,
      images: {
        select: {
          sortOrder: true,
          fileAsset: {
            select: {
              url: true,
            },
          },
        },
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
    },
  },
} satisfies Prisma.CommentSelect;

const revalidatePhotoTripPaths = (tripSlug: string) => {
  revalidatePath(`/trips/${tripSlug}`);
  revalidatePath(`/hikes/${tripSlug}`);
};

const revalidateFromTargetContext = (target: PhotoCommentTargetContext) => {
  revalidatePhotoTripPaths(target.tripSlug);
};

/**
 * Resolve the photo + its first published linked trip for comment helpers.
 *
 * Ordering is deterministic: the most recently linked published trip wins,
 * with `hikeId` desc as a tiebreaker (part of the composite PK since
 * `HikesToPhotos` has no scalar `id`). Returns `null` when no published
 * trip exists so read helpers can short-circuit silently.
 */
export const getPhotoCommentTargetContext = async (photoId: string): Promise<PhotoCommentTargetContext | null> => {
  const { default: prisma } = await import("@/lib/prisma");

  const link = await prisma.hikesToPhotos.findFirst({
    where: {
      photoId,
      hike: {
        status: "PUBLISHED",
      },
    },
    orderBy: [{ assignedAt: "desc" }, { hikeId: "desc" }],
    select: {
      hike: {
        select: {
          slug: true,
        },
      },
      photo: {
        select: {
          id: true,
          title: true,
          images: {
            select: {
              sortOrder: true,
              fileAsset: {
                select: {
                  url: true,
                },
              },
            },
            orderBy: { sortOrder: "asc" },
            take: 1,
          },
        },
      },
    },
  });

  if (!link) return null;

  const previewImageUrl = link.photo.images[0]?.fileAsset.url ?? null;

  return {
    photoId: link.photo.id,
    tripSlug: link.hike.slug,
    photoTitle: link.photo.title,
    previewImageUrl,
  };
};

/**
 * Resolve the photo + its first published linked trip, throwing when no
 * published trip exists. Used by every mutation helper.
 */
export const getPhotoWithPublishedTripOrThrow = async (photoId: string): Promise<PhotoCommentTargetContext> => {
  const target = await getPhotoCommentTargetContext(photoId);

  if (!target) {
    throw new AuthorizationError("Comments are only available on photos linked to a published trip");
  }

  return target;
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

export const getPhotoComments = async (photoId: string): Promise<PhotoCommentListRecord[]> => {
  try {
    const { default: prisma } = await import("@/lib/prisma");

    return prisma.comment.findMany({
      where: {
        photoId,
        photo: {
          hikes: {
            some: {
              hike: {
                status: "PUBLISHED",
              },
            },
          },
        },
      },
      select: photoCommentSelect,
      orderBy: { createdAt: "asc" },
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getPhotoComments)");
  }
};

const toPhotoCommentListItem = (
  comment: PhotoCommentListRecord,
  target: PhotoCommentTargetContext,
): CommentListItem => {
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
      type: "photo",
      title: target.photoTitle,
      href: `/trips/${target.tripSlug}`,
      previewImageUrl: target.previewImageUrl,
    },
  };
};

export const getPhotoCommentListItems = async (photoId: string): Promise<CommentListItem[]> => {
  const target = await getPhotoCommentTargetContext(photoId);

  if (!target) return [];

  const comments = await getPhotoComments(photoId);

  return comments.map((comment) => toPhotoCommentListItem(comment, target));
};

export const createPhotoComment = async (values: PhotoCommentActionValues) => {
  try {
    const user = await requireActionUser();
    const target = await getPhotoWithPublishedTripOrThrow(values.photoId);
    const { default: prisma } = await import("@/lib/prisma");

    const comment = await prisma.comment.create({
      data: {
        photoId: target.photoId,
        userId: user.id,
        content: normalizeCommentContent(values.content),
      },
      select: photoCommentSelect,
    });

    revalidateFromTargetContext(target);

    return comment;
  } catch (err) {
    if (err instanceof AuthorizationError) throw err;
    console.error({ err });
    throw new Error("Something went wrong (createPhotoComment)");
  }
};

export const updatePhotoComment = async (values: PhotoCommentActionValues) => {
  try {
    if (!values.id) throw new Error("Comment id is required");

    const user = await requireActionUser();
    const target = await getPhotoWithPublishedTripOrThrow(values.photoId);
    const { default: prisma } = await import("@/lib/prisma");

    const existingComment = await prisma.comment.findFirst({
      where: {
        id: values.id,
        userId: user.id,
        photoId: target.photoId,
        photo: {
          hikes: {
            some: {
              hike: {
                status: "PUBLISHED",
              },
            },
          },
        },
      },
      select: { id: true, photoId: true },
    });

    if (!existingComment) throw new Error("Comment not found");

    const comment = await prisma.comment.update({
      where: { id: existingComment.id },
      data: {
        content: normalizeCommentContent(values.content),
      },
      select: photoCommentSelect,
    });

    revalidateFromTargetContext(target);

    return comment;
  } catch (err) {
    if (err instanceof AuthorizationError) throw err;
    console.error({ err });
    throw new Error("Something went wrong (updatePhotoComment)");
  }
};

export const deletePhotoComment = async (id: string) => {
  try {
    const user = await requireActionUser();
    const { default: prisma } = await import("@/lib/prisma");

    const existingComment = await prisma.comment.findFirst({
      where: {
        id,
        userId: user.id,
        photo: {
          hikes: {
            some: {
              hike: {
                status: "PUBLISHED",
              },
            },
          },
        },
      },
      select: { id: true, photoId: true },
    });

    if (!existingComment) return { success: false };

    await prisma.comment.delete({
      where: { id: existingComment.id },
    });

    const target = await getPhotoCommentTargetContext(existingComment.photoId);

    if (target) {
      revalidateFromTargetContext(target);
    }

    return { success: true };
  } catch (err) {
    if (err instanceof AuthorizationError) throw err;
    console.error({ err });
    throw new Error("Something went wrong (deletePhotoComment)");
  }
};
