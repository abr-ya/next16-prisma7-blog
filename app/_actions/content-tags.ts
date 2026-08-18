"use server";

import { revalidatePath } from "next/cache";

import { ContentTagStatus, type Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth-utils";
import { createContentTagSlug, normalizeContentTagName, type NormalizedContentTag } from "@/lib/content-tags";
import prisma from "@/lib/prisma";

type ContentTagActionResult = {
  success: boolean;
  message: string;
};

const revalidateContentTagPaths = () => {
  revalidatePath("/admin/content-tags");
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
};

const normalizeTargetTag = (value: string): NormalizedContentTag | null => {
  const name = normalizeContentTagName(value);
  const slug = createContentTagSlug(name);

  if (!name || !slug) return null;

  return { name, slug };
};

const getOrCreateTargetTag = async (targetName: string) => {
  const target = normalizeTargetTag(targetName);

  if (!target) {
    throw new Error("A replacement tag name is required.");
  }

  return prisma.contentTag.upsert({
    where: { slug: target.slug },
    create: target,
    update: { name: target.name },
    select: { id: true, slug: true },
  });
};

export const markContentTagReviewed = async (tagId: string): Promise<ContentTagActionResult> => {
  await requireAdmin();

  await prisma.contentTag.update({
    where: { id: tagId },
    data: { status: ContentTagStatus.ACTIVE },
  });

  revalidateContentTagPaths();

  return {
    success: true,
    message: "Tag marked active.",
  };
};

export const markContentTagNeedsReview = async (tagId: string): Promise<ContentTagActionResult> => {
  await requireAdmin();

  await prisma.contentTag.update({
    where: { id: tagId },
    data: { status: ContentTagStatus.NEEDS_REVIEW },
  });

  revalidateContentTagPaths();

  return {
    success: true,
    message: "Tag marked needs review.",
  };
};

export const removeContentTagAssignments = async (
  tagId: string,
  postIds: string[],
): Promise<ContentTagActionResult> => {
  await requireAdmin();

  const selectedPostIds = Array.from(new Set(postIds.filter(Boolean)));

  if (selectedPostIds.length === 0) {
    return {
      success: false,
      message: "Select at least one post.",
    };
  }

  const result = await prisma.postsToContentTags.deleteMany({
    where: {
      tagId,
      postId: { in: selectedPostIds },
    },
  });

  revalidateContentTagPaths();

  return {
    success: true,
    message: `Removed ${result.count} assignment${result.count === 1 ? "" : "s"}.`,
  };
};

export const replaceContentTagAssignments = async (
  sourceTagId: string,
  postIds: string[],
  targetName: string,
): Promise<ContentTagActionResult> => {
  await requireAdmin();

  const selectedPostIds = Array.from(new Set(postIds.filter(Boolean)));

  if (selectedPostIds.length === 0) {
    return {
      success: false,
      message: "Select at least one post.",
    };
  }

  const target = await getOrCreateTargetTag(targetName);

  if (target.id === sourceTagId) {
    return {
      success: false,
      message: "Choose a different replacement tag.",
    };
  }

  await prisma.$transaction([
    prisma.postsToContentTags.createMany({
      data: selectedPostIds.map((postId) => ({
        postId,
        tagId: target.id,
      })),
      skipDuplicates: true,
    }),
    prisma.postsToContentTags.deleteMany({
      where: {
        tagId: sourceTagId,
        postId: { in: selectedPostIds },
      },
    }),
  ]);

  revalidateContentTagPaths();

  return {
    success: true,
    message: "Selected assignments replaced.",
  };
};

export const mergeContentTag = async (sourceTagId: string, targetName: string): Promise<ContentTagActionResult> => {
  await requireAdmin();

  const target = await getOrCreateTargetTag(targetName);

  if (target.id === sourceTagId) {
    return {
      success: false,
      message: "Choose a different target tag.",
    };
  }

  await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const sourceAssignments: { postId: string }[] = await tx.postsToContentTags.findMany({
      where: { tagId: sourceTagId },
      select: { postId: true },
    });

    await tx.postsToContentTags.createMany({
      data: sourceAssignments.map((assignment: { postId: string }) => ({
        postId: assignment.postId,
        tagId: target.id,
      })),
      skipDuplicates: true,
    });

    await tx.contentTag.delete({
      where: { id: sourceTagId },
    });
  });

  revalidateContentTagPaths();

  return {
    success: true,
    message: "Tag merged.",
  };
};
