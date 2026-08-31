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

type SelectedContentTagPostAssignment = {
  postId: string;
  post: {
    slug: string;
  };
};

const revalidateContentTagPaths = () => {
  revalidatePath("/admin/content-tags");
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
};

const revalidatePostPaths = (postSlugs: string[]) => {
  Array.from(new Set(postSlugs.filter(Boolean))).forEach((slug) => {
    revalidatePath(`/blog/${slug}`);
  });
};

const getContentTagPostSlugs = async (tagIds: string[]) => {
  const selectedTagIds = Array.from(new Set(tagIds.filter(Boolean)));

  if (selectedTagIds.length === 0) return [];

  const assignments = await prisma.postsToContentTags.findMany({
    where: { tagId: { in: selectedTagIds } },
    select: {
      post: {
        select: {
          slug: true,
        },
      },
    },
  });

  return assignments.map((assignment: { post: { slug: string } }) => assignment.post.slug);
};

const getSelectedContentTagPostAssignments = async (
  tagId: string,
  postIds: string[],
): Promise<SelectedContentTagPostAssignment[]> => {
  const selectedPostIds = Array.from(new Set(postIds.filter(Boolean)));

  if (selectedPostIds.length === 0) return [];

  return prisma.postsToContentTags.findMany({
    where: {
      tagId,
      postId: { in: selectedPostIds },
    },
    select: {
      postId: true,
      post: {
        select: {
          slug: true,
        },
      },
    },
  });
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

export const renameContentTag = async (tagId: string, nextName: string): Promise<ContentTagActionResult> => {
  await requireAdmin();

  const nextTag = normalizeTargetTag(nextName);

  if (!nextTag) {
    return {
      success: false,
      message: "A tag name is required.",
    };
  }

  const existing = await prisma.contentTag.findUnique({
    where: { slug: nextTag.slug },
    select: { id: true },
  });

  if (existing && existing.id !== tagId) {
    return {
      success: false,
      message: "Another tag already uses that slug. Use merge instead.",
    };
  }

  const postSlugs = await getContentTagPostSlugs([tagId]);

  await prisma.contentTag.update({
    where: { id: tagId },
    data: {
      name: nextTag.name,
      slug: nextTag.slug,
    },
  });

  revalidateContentTagPaths();
  revalidatePostPaths(postSlugs);

  return {
    success: true,
    message: "Tag renamed.",
  };
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

  const postSlugs = await getContentTagPostSlugs([tagId]);

  const result = await prisma.postsToContentTags.deleteMany({
    where: {
      tagId,
      postId: { in: selectedPostIds },
    },
  });

  revalidateContentTagPaths();
  revalidatePostPaths(postSlugs);

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

  if (!normalizeTargetTag(targetName)) {
    return {
      success: false,
      message: "A replacement tag name is required.",
    };
  }

  const target = await getOrCreateTargetTag(targetName);

  if (target.id === sourceTagId) {
    return {
      success: false,
      message: "Choose a different replacement tag.",
    };
  }

  const selectedAssignments = await getSelectedContentTagPostAssignments(sourceTagId, selectedPostIds);
  const selectedAssignmentPostIds = selectedAssignments.map((assignment) => assignment.postId);

  if (selectedAssignmentPostIds.length === 0) {
    return {
      success: false,
      message: "No matching assignments were found for that tag.",
    };
  }

  const postSlugs = [
    ...selectedAssignments.map((assignment) => assignment.post.slug),
    ...(await getContentTagPostSlugs([target.id])),
  ];

  await prisma.$transaction([
    prisma.postsToContentTags.createMany({
      data: selectedAssignmentPostIds.map((postId) => ({
        postId,
        tagId: target.id,
      })),
      skipDuplicates: true,
    }),
    prisma.postsToContentTags.deleteMany({
      where: {
        tagId: sourceTagId,
        postId: { in: selectedAssignmentPostIds },
      },
    }),
  ]);

  revalidateContentTagPaths();
  revalidatePostPaths(postSlugs);

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

  const postSlugs = await getContentTagPostSlugs([sourceTagId, target.id]);

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
  revalidatePostPaths(postSlugs);

  return {
    success: true,
    message: "Tag merged.",
  };
};

export const deleteUnusedContentTag = async (tagId: string): Promise<ContentTagActionResult> => {
  await requireAdmin();

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const tag = await tx.contentTag.findUnique({
      where: { id: tagId },
      select: {
        _count: {
          select: { posts: true },
        },
      },
    });

    if (!tag) {
      return {
        success: false,
        message: "Tag not found.",
      };
    }

    if (tag._count.posts > 0) {
      return {
        success: false,
        message: "Remove assignments or merge this tag before deleting it.",
      };
    }

    await tx.contentTag.delete({
      where: { id: tagId },
    });

    return {
      success: true,
      message: "Unused tag deleted.",
    };
  });

  revalidateContentTagPaths();

  return result;
};
