"use server";

import { PostFormValues } from "@/components/index";
import { authSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { Post, PostStatus } from "@/generated/prisma/client";

export const getPostById = async (id: string) => {
  try {
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const res = (await prisma.post.findUnique({ where: { id } })) as Post;

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const createPost = async (params: PostFormValues) => {
  try {
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { categories, tags, id, ...rest } = params;
    const data = { ...rest, tags: tags.map((tag) => tag.value) };

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
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    console.log("UpdatePost", params);
    const res = null;

    return res; // todo: implement update logic
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const getAllPosts = async () => {
  try {
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

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
