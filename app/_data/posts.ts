"use server";

import type { PostFormValues } from "@/components/index";
import type { Post, PostStatus } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

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

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (updatePost action)");
  }
};

// todo: implement pagination == this is only user's posts - for admin dashboard
export const getAllPosts = async () => {
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
        user: { select: { name: true, image: true, id: true } },
        category: true,
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
