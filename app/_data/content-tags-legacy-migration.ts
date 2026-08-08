"use server";

import { createLogEvent } from "@/app/_data/log";
import type { Prisma } from "@/generated/prisma/client";
import { requireAdmin } from "@/lib/auth-utils";
import {
  buildLegacyTagInventory,
  planLegacyPostTags,
  summarizeLegacyMigrationPlan,
  type LegacyPostTagInventoryRow,
  type LegacyPostTagMigrationPolicy,
  type LegacyPostTagMigrationSummary,
  type LegacyOnlyPostSnapshot,
} from "@/lib/content-tags-legacy-migration";
import prisma from "@/lib/prisma";

export type LegacyPostTagInventoryResult = {
  eligiblePosts: number;
  uniqueRawValues: number;
  rows: LegacyPostTagInventoryRow[];
};

export type LegacyPostTagMigrationResult = {
  summary: LegacyPostTagMigrationSummary;
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

  return posts.filter((post: { tags: string[] }) => post.tags.some((tag: string) => tag.trim().length > 0));
};

const loadExistingContentTagSlugs = async (): Promise<Set<string>> => {
  const tags = await prisma.contentTag.findMany({ select: { slug: true } });
  return new Set(tags.map((tag: { slug: string }) => tag.slug));
};

export const getLegacyPostTagInventory = async (): Promise<LegacyPostTagInventoryResult> => {
  await requireAdmin();
  const posts = await loadLegacyOnlyPosts();
  return buildLegacyTagInventory(posts);
};

export const dryRunLegacyPostTagMigration = async (
  policy: LegacyPostTagMigrationPolicy = {},
): Promise<LegacyPostTagMigrationResult> => {
  await requireAdmin();

  const posts = await loadLegacyOnlyPosts();
  const existingSlugs = await loadExistingContentTagSlugs();
  const summary = summarizeLegacyMigrationPlan(posts, policy, existingSlugs, "dry-run");

  await createLogEvent(
    "legacyPostTagDryRun",
    `eligible=${summary.eligiblePosts}; assignments=${summary.plannedAssignments}; create=${summary.tagsToCreate}; reuse=${summary.tagsToReuse}; dropped=${summary.valuesDropped}; emptyAfterPolicy=${summary.postsSkippedEmptyAfterPolicy}`,
  );

  return { summary };
};

export const applyLegacyPostTagMigration = async (
  policy: LegacyPostTagMigrationPolicy = {},
): Promise<LegacyPostTagMigrationResult> => {
  await requireAdmin();

  const posts = await loadLegacyOnlyPosts();
  const existingSlugs = await loadExistingContentTagSlugs();
  const summary = summarizeLegacyMigrationPlan(posts, policy, existingSlugs, "apply");

  let postsMigrated = 0;

  for (const post of posts) {
    const { planned } = planLegacyPostTags(post.tags, policy);

    if (planned.length === 0) {
      // Still dual-write empty tags if policy dropped everything?
      // Spec: dual-write planned display names; empty set clears legacy junk.
      await prisma.post.update({
        where: { id: post.id },
        data: { tags: [] },
      });
      postsMigrated += 1;
      continue;
    }

    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const persisted = await Promise.all(
        planned.map((tag) =>
          tx.contentTag.upsert({
            where: { slug: tag.slug },
            create: { name: tag.name, slug: tag.slug },
            update: { name: tag.name },
            select: { id: true },
          }),
        ),
      );

      await tx.postsToContentTags.createMany({
        data: persisted.map((tag: { id: string }) => ({
          postId: post.id,
          tagId: tag.id,
        })),
        skipDuplicates: true,
      });

      await tx.post.update({
        where: { id: post.id },
        data: {
          tags: planned.map((tag) => tag.name),
        },
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
    `migrated=${postsMigrated}; eligible=${summary.eligiblePosts}; assignments=${summary.plannedAssignments}; create=${summary.tagsToCreate}; dropped=${summary.valuesDropped}`,
  );

  return { summary: finalSummary };
};
