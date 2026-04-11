"use server";

import type { BlogPostFormValues } from "@/components/index";
import prisma from "@/lib/prisma";

export const getBlogPostById = async (id: string) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const { default: prisma } = await import("@/lib/prisma");
    const res = await prisma.blogPost.findUnique({ where: { id } });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong");
  }
};

export const createBlogPost = async (params: BlogPostFormValues) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, ...rest } = params;

    const res = await prisma.blogPost.create({
      data: rest,
    });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (createBlogPost)");
  }
};

export const updateBlogPost = async (params: BlogPostFormValues) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    const { id, ...rest } = params;

    const res = await prisma.blogPost.update({
      where: { id },
      data: rest,
    });

    return res;
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (updateBlogPost)");
  }
};

export const deleteBlogPost = async (id: string) => {
  try {
    const { authSession } = await import("@/lib/auth-utils");
    const session = await authSession();

    if (!session) throw new Error("Unauthorized: User Id not found");

    await prisma.blogPost.delete({
      where: { id },
    });

    return { success: true };
  } catch (err) {
    console.error({ err });
    throw new Error("Something went wrong (deleteBlogPost)");
  }
};
