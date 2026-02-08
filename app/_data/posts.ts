"use server";

import type { PostFormValues } from "@/components/index";
import type { Post, PostStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

/** Extract unique image URLs from post HTML content (img src attributes). */
function extractImageUrlsFromContent(html: string): string[] {
  const urls: string[] = [];
  const srcRegex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match: RegExpExecArray | null;
  while ((match = srcRegex.exec(html)) !== null) {
    const url = match[1]?.trim();
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}

/** Sync PostImage records for a post from its HTML content. */
async function syncPostImages(postId: string, content: string) {
  const urls = extractImageUrlsFromContent(content);
  await prisma.postImage.deleteMany({ where: { postId } });
  if (urls.length > 0) {
    await prisma.postImage.createMany({
      data: urls.map((url) => ({ postId, url })),
    });
  }
}

export const getPostById = async (id: string) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const { default: prisma } = await import("@/lib/prisma");
    const res = (await prisma.post.findUnique({ where: { id } })) as Post;

    return res;
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
    const data = { ...rest, tags: tags.map((tag) => tag.value) };

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.post.create({
      data: {
        ...data,
        status: data.status as PostStatus,
        userId: session.user.id,
      },
    });

    await syncPostImages(res.id, data.content);
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
    const data = { ...rest, tags: tags.map((tag) => tag.value) };

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.post.update({
      where: { id },
      data: {
        ...data,
        userId: session.user.id,
        status: data.status as PostStatus,
      },
    });

    await syncPostImages(res.id, data.content);
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
      include: { category: true, user: { select: { name: true, image: true, id: true } } },
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
      include: { category: true },
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
