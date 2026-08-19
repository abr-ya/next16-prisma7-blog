"use server";

import type { ContentTag, ContentTagStatus, PostStatus } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth-utils";

export type ContentTagOption = Pick<ContentTag, "id" | "name" | "slug" | "status">;

export type ContentTagPostUsage = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  updatedAt: Date;
};

export type ContentTagReviewItem = ContentTagOption & {
  postCount: number;
  posts: ContentTagPostUsage[];
};

export type ContentTagUsageGroups = {
  posts: ContentTagPostUsage[];
};

export type ContentTagManagementItem = ContentTagOption & {
  totalUsageCount: number;
  usage: ContentTagUsageGroups;
};

type ContentTagReviewRecord = ContentTagOption & {
  _count: { posts: number };
  posts: { post: ContentTagPostUsage }[];
};

export const getAllContentTags = async (): Promise<ContentTagOption[]> => {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    return prisma.contentTag.findMany({
      select: { id: true, name: true, slug: true, status: true },
      orderBy: { name: "asc" },
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getAllContentTags)");
  }
};

export const getAdminContentTagsByStatus = async (status: ContentTagStatus): Promise<ContentTagReviewItem[]> => {
  try {
    await requireAdmin();

    const { default: prisma } = await import("@/lib/prisma");
    const tags: ContentTagReviewRecord[] = await prisma.contentTag.findMany({
      where: { status },
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        _count: {
          select: { posts: true },
        },
        posts: {
          select: {
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                updatedAt: true,
              },
            },
          },
          orderBy: {
            post: {
              updatedAt: "desc",
            },
          },
        },
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    });

    return tags.map((tag: ContentTagReviewRecord) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      status: tag.status,
      postCount: tag._count.posts,
      posts: tag.posts.map((assignment: { post: ContentTagPostUsage }) => assignment.post),
    }));
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getAdminContentTagsByStatus)");
  }
};

export const getAdminContentTagManagementItems = async (): Promise<ContentTagManagementItem[]> => {
  try {
    await requireAdmin();

    const { default: prisma } = await import("@/lib/prisma");
    const tags: ContentTagReviewRecord[] = await prisma.contentTag.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        _count: {
          select: { posts: true },
        },
        posts: {
          select: {
            post: {
              select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                updatedAt: true,
              },
            },
          },
          orderBy: {
            post: {
              updatedAt: "desc",
            },
          },
        },
      },
      orderBy: [{ status: "desc" }, { name: "asc" }],
    });

    return tags.map((tag: ContentTagReviewRecord) => {
      const posts = tag.posts.map((assignment: { post: ContentTagPostUsage }) => assignment.post);

      return {
        id: tag.id,
        name: tag.name,
        slug: tag.slug,
        status: tag.status,
        totalUsageCount: tag._count.posts,
        usage: {
          posts,
        },
      };
    });
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (getAdminContentTagManagementItems)");
  }
};
