"use server";

import type { PostFormValues } from "@/components/index";
import type { Post, PostStatus, Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { normalizeContentTags, type ContentTagInput, type NormalizedContentTag } from "@/lib/content-tags";

/** Image info extracted from post HTML (img src + optional data-filekey). */
function extractImagesFromContent(html: string): { url: string; fileKey: string | null }[] {
  const seen = new Set<string>();
  const result: { url: string; fileKey: string | null }[] = [];
  const tagRegex = /<img[^>]+\/?>/gi;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRegex.exec(html)) !== null) {
    const tag = tagMatch[0];
    const srcMatch = /src=["']([^"']+)["']/i.exec(tag);
    const fileKeyMatch = /data-filekey=["']([^"']*)["']/i.exec(tag);
    const url = srcMatch?.[1]?.trim();
    const fileKey = fileKeyMatch?.[1]?.trim() || null;
    if (url && !seen.has(url)) {
      seen.add(url);
      result.push({ url, fileKey });
    }
  }
  return result;
}

/** Sync PostImage records for a post from its HTML content. */
async function syncPostImages(postId: string, content: string, userId: string | null) {
  const images = extractImagesFromContent(content);
  await prisma.postImage.deleteMany({ where: { postId } });
  if (images.length > 0) {
    await prisma.postImage.createMany({
      data: images.map(({ url, fileKey }) => ({ postId, url, userId, fileKey })),
    });
  }
}

const postContentTagsInclude = {
  contentTags: {
    include: {
      tag: true,
    },
    orderBy: {
      tag: {
        name: "asc",
      },
    },
  },
} satisfies Prisma.PostInclude;

const getContentTagAssignmentData = async (tags: ContentTagInput[] = []) => {
  const normalizedTags = normalizeContentTags(tags);
  const { default: prisma } = await import("@/lib/prisma");

  const persistedTags = await Promise.all(
    normalizedTags.map((tag: NormalizedContentTag) =>
      prisma.contentTag.upsert({
        where: { slug: tag.slug },
        create: tag,
        update: { name: tag.name },
        select: { id: true },
      }),
    ),
  );

  return {
    normalizedTags,
    assignments: persistedTags.map((tag) => ({ tagId: tag.id })),
  };
};

export const getPostById = async (id: string) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.post.findUnique({
      where: { id },
      include: postContentTagsInclude,
    });

    return res as Post & {
      contentTags: { tag: { name: string; slug: string } }[];
    };
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const createPost = async (params: PostFormValues) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { categories, tags, id, ...rest } = params;
    const { normalizedTags, assignments } = await getContentTagAssignmentData(tags);
    const data = {
      ...rest,
      tags: normalizedTags.map((tag) => tag.name),
    };

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.post.create({
      data: {
        ...data,
        status: data.status as PostStatus,
        userId: session.user.id,
        contentTags: {
          create: assignments,
        },
      },
    });

    await syncPostImages(res.id, data.content, session.user.id);
    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const updatePost = async (params: PostFormValues) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    console.log("updated", params.id, params.title);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { categories, tags, id, ...rest } = params;
    const { normalizedTags, assignments } = await getContentTagAssignmentData(tags);
    const data = {
      ...rest,
      tags: normalizedTags.map((tag) => tag.name),
    };

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.post.update({
      where: { id },
      data: {
        ...data,
        userId: session.user.id,
        status: data.status as PostStatus,
        contentTags: {
          deleteMany: {},
          create: assignments,
        },
      },
    });

    await syncPostImages(res.id, data.content, session.user.id);
    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (updatePost action)");
  }
};

// todo: implement pagination
export const getAllPosts = async () => {
  try {
    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        user: { select: { name: true, image: true, id: true } },
        ...postContentTagsInclude,
      },
    });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

// todo: this is only user's posts - for admin dashboard
export const getAllUserPosts = async () => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.post.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        category: true,
        ...postContentTagsInclude,
      },
    });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const getPostBySlug = async (slug: string) => {
  try {
    const post = await prisma.post.findUnique({
      where: { slug },
      include: {
        category: true,
        links: { include: { link: true } },
        user: { select: { name: true, image: true, id: true } },
        ...postContentTagsInclude,
      },
    });

    return post;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const updatePostViews = async (id: string) => {
  try {
    const post = await prisma.post.update({
      where: { id },
      data: { views: { increment: 1 } },
    });

    return post;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const connectLinkToPost = async (postId: string, linkId: string) => {
  try {
    const post = await prisma.post.update({
      where: { id: postId },
      data: {
        links: {
          connectOrCreate: {
            where: { postId_linkId: { postId, linkId } },
            create: { link: { connect: { id: linkId } } },
          },
        },
      },
    });

    return post;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};
