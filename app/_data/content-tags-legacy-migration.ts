"use server";

import { revalidatePath } from "next/cache";

import { createLogEvent } from "@/app/_data/log";
import { ContentTagStatus, type Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth-utils";
import {
  buildEligiblePostRows,
  buildLegacyTagInventory,
  planLegacyPostTags,
  summarizeLegacyMigrationPlan,
  summarizeSelectedLegacyMigrationPlan,
  type LegacyEligiblePostRow,
  type LegacyPostTagInventoryRow,
  type LegacyPostTagMigrationSummary,
  type LegacyOnlyPostSnapshot,
} from "@/lib/content-tags-legacy-migration";
import prisma from "@/lib/prisma";

export type LegacyPostTagInventoryResult = {
  eligiblePosts: number;
  uniqueRawValues: number;
  rows: LegacyPostTagInventoryRow[];
  eligiblePostRows: LegacyEligiblePostRow[];
};

export type LegacyPostTagMigrationResult = {
  summary: LegacyPostTagMigrationSummary;
};

const revalidateLegacyMigrationPaths = () => {
  revalidatePath("/admin/content-tags");
  revalidatePath("/admin/posts");
  revalidatePath("/blog");
};

const loadLegacyOnlyPosts = async (): Promise<LegacyOnlyPostSnapshot[]> => {
  const posts = await prisma.post.findMany({
    where: {
      contentTags: { none: {} },
    },
    select: {
      id: true,
      slug: true,
      title: true,
      tags: true,
    },
    orderBy: { slug: "asc" },
  });

  return posts.filter((post: LegacyOnlyPostSnapshot) => post.tags.some((tag: string) => tag.trim().length > 0));
};

const loadExistingContentTagSlugs = async (): Promise<Set<string>> => {
  const tags = await prisma.contentTag.findMany({ select: { slug: true } });
  return new Set(tags.map((tag: { slug: string }) => tag.slug));
};

export const getLegacyPostTagInventory = async (): Promise<LegacyPostTagInventoryResult> => {
  await requireAdmin();

  const posts = await loadLegacyOnlyPosts();
  const inventory = buildLegacyTagInventory(posts);

  return {
    ...inventory,
    eligiblePostRows: buildEligiblePostRows(posts),
  };
};

export const dryRunLegacyPostTagMigration = async (): Promise<LegacyPostTagMigrationResult> => {
  await requireAdmin();

  const posts = await loadLegacyOnlyPosts();
  const existingSlugs = await loadExistingContentTagSlugs();
  const summary = summarizeLegacyMigrationPlan(posts, existingSlugs, "dry-run");

  await createLogEvent(
    "legacyPostTagDryRun",
    `eligible=${summary.eligiblePosts}; assignments=${summary.plannedAssignments}; create=${summary.tagsToCreate}; reuse=${summary.tagsToReuse}; skipped=${summary.valuesSkipped}; noValidTags=${summary.postsSkippedNoValidTags}`,
  );

  return { summary };
};

export const dryRunSelectedLegacyPostTagMigration = async (
  postIds: string[],
): Promise<LegacyPostTagMigrationResult> => {
  await requireAdmin();

  const posts = await loadLegacyOnlyPosts();
  const existingSlugs = await loadExistingContentTagSlugs();
  const summary = summarizeSelectedLegacyMigrationPlan(posts, existingSlugs, postIds, "dry-run");

  await createLogEvent(
    "legacyPostTagSelectedDryRun",
    `selected=${summary.selectedPosts}; eligible=${summary.eligiblePosts}; skippedIneligible=${summary.postsSkippedIneligible}; assignments=${summary.plannedAssignments}; create=${summary.tagsToCreate}; reuse=${summary.tagsToReuse}; skipped=${summary.valuesSkipped}; noValidTags=${summary.postsSkippedNoValidTags}`,
  );

  return { summary };
};

export const applyLegacyPostTagMigration = async (): Promise<LegacyPostTagMigrationResult> => {
  await requireAdmin();

  const posts = await loadLegacyOnlyPosts();
  const existingSlugs = await loadExistingContentTagSlugs();
  const summary = summarizeLegacyMigrationPlan(posts, existingSlugs, "apply");

  let postsMigrated = 0;

  for (const post of posts) {
    const { planned } = planLegacyPostTags(post.tags);

    if (planned.length === 0) {
      continue;
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const persisted = await Promise.all(
        planned.map((tag) =>
          tx.contentTag.upsert({
            where: { slug: tag.slug },
            create: {
              name: tag.name,
              slug: tag.slug,
              status: ContentTagStatus.NEEDS_REVIEW,
            },
            update: {
              name: tag.name,
              status: ContentTagStatus.NEEDS_REVIEW,
            },
            select: { id: true },
          }),
        ),
      );

      await tx.postsToContentTags.createMany({
        data: persisted.map((tag) => ({
          postId: post.id,
          tagId: tag.id,
        })),
        skipDuplicates: true,
      });
    });

    postsMigrated += 1;
  }

  const finalSummary: LegacyPostTagMigrationSummary = {
    ...summary,
    postsMigrated,
  };

  await createLogEvent(
    "legacyPostTagMigrate",
    `migrated=${postsMigrated}; eligible=${summary.eligiblePosts}; assignments=${summary.plannedAssignments}; create=${summary.tagsToCreate}; reuse=${summary.tagsToReuse}; skipped=${summary.valuesSkipped}`,
  );

  revalidateLegacyMigrationPaths();

  return { summary: finalSummary };
};
