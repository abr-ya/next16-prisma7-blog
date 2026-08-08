import { createContentTagSlug, normalizeContentTagName, type NormalizedContentTag } from "@/lib/content-tags";

export type LegacyPostTagMigrationPolicy = {
  /** Raw values or normalized slugs to exclude from migration. */
  drop?: string[];
  /** Map source slug → target display name (and optional target slug). */
  renameBySlug?: Record<string, { name: string; slug?: string }>;
};

export type LegacyPostTagInventoryRow = {
  rawValue: string;
  count: number;
  suggestedSlug: string;
  samplePostSlugs: string[];
};

export type LegacyPostTagMigrationSummary = {
  mode: "dry-run" | "apply";
  eligiblePosts: number;
  postsProcessed: number;
  postsSkippedEmptyAfterPolicy: number;
  uniqueRawValues: number;
  plannedAssignments: number;
  tagsToCreate: number;
  tagsToReuse: number;
  valuesDropped: number;
  postsMigrated?: number;
};

export type LegacyOnlyPostSnapshot = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
};

const SAMPLE_POST_LIMIT = 5;

export const normalizeDropKeys = (drop: string[] = []) => {
  const keys = new Set<string>();
  drop.forEach((value) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    keys.add(trimmed);
    const slug = createContentTagSlug(trimmed);
    if (slug) keys.add(slug);
  });
  return keys;
};

/** Plan final shared tags for one post from legacy string values + optional policy. */
export const planLegacyPostTags = (
  rawTags: string[] = [],
  policy: LegacyPostTagMigrationPolicy = {},
): { planned: NormalizedContentTag[]; droppedCount: number } => {
  const dropKeys = normalizeDropKeys(policy.drop);
  const renameBySlug = policy.renameBySlug ?? {};
  const planned = new Map<string, NormalizedContentTag>();
  let droppedCount = 0;

  rawTags.forEach((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) return;

    let name = normalizeContentTagName(trimmed);
    let slug = createContentTagSlug(name);

    if (!name || !slug) {
      droppedCount += 1;
      return;
    }

    if (dropKeys.has(trimmed) || dropKeys.has(slug)) {
      droppedCount += 1;
      return;
    }

    const rename = renameBySlug[slug];
    if (rename?.name) {
      name = normalizeContentTagName(rename.name);
      slug = createContentTagSlug(rename.slug || rename.name);
      if (!name || !slug) {
        droppedCount += 1;
        return;
      }
    }

    if (!planned.has(slug)) {
      planned.set(slug, { name, slug });
    }
  });

  return {
    planned: Array.from(planned.values()).sort((a, b) => a.name.localeCompare(b.name)),
    droppedCount,
  };
};

export const buildLegacyTagInventory = (
  posts: LegacyOnlyPostSnapshot[],
): {
  eligiblePosts: number;
  uniqueRawValues: number;
  rows: LegacyPostTagInventoryRow[];
} => {
  const frequency = new Map<string, { count: number; suggestedSlug: string; samplePostSlugs: string[] }>();

  posts.forEach((post) => {
    post.tags.forEach((raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const existing = frequency.get(trimmed);
      if (existing) {
        existing.count += 1;
        if (existing.samplePostSlugs.length < SAMPLE_POST_LIMIT && !existing.samplePostSlugs.includes(post.slug)) {
          existing.samplePostSlugs.push(post.slug);
        }
        return;
      }

      frequency.set(trimmed, {
        count: 1,
        suggestedSlug: createContentTagSlug(trimmed),
        samplePostSlugs: [post.slug],
      });
    });
  });

  const rows = Array.from(frequency.entries())
    .map(([rawValue, info]) => ({
      rawValue,
      count: info.count,
      suggestedSlug: info.suggestedSlug,
      samplePostSlugs: info.samplePostSlugs,
    }))
    .sort((a, b) => b.count - a.count || a.rawValue.localeCompare(b.rawValue));

  return {
    eligiblePosts: posts.length,
    uniqueRawValues: rows.length,
    rows,
  };
};

export const summarizeLegacyMigrationPlan = (
  posts: LegacyOnlyPostSnapshot[],
  policy: LegacyPostTagMigrationPolicy,
  existingSlugs: Set<string>,
  mode: "dry-run" | "apply",
): LegacyPostTagMigrationSummary => {
  let plannedAssignments = 0;
  let valuesDropped = 0;
  let postsSkippedEmptyAfterPolicy = 0;
  const planCreateSlugs = new Set<string>();
  let tagsToReuseHits = 0;

  posts.forEach((post) => {
    const { planned, droppedCount } = planLegacyPostTags(post.tags, policy);
    valuesDropped += droppedCount;

    if (planned.length === 0) {
      postsSkippedEmptyAfterPolicy += 1;
      return;
    }

    plannedAssignments += planned.length;
    planned.forEach((tag) => {
      if (existingSlugs.has(tag.slug)) {
        tagsToReuseHits += 1;
      } else {
        planCreateSlugs.add(tag.slug);
      }
    });
  });

  return {
    mode,
    eligiblePosts: posts.length,
    postsProcessed: posts.length,
    postsSkippedEmptyAfterPolicy,
    uniqueRawValues: buildLegacyTagInventory(posts).uniqueRawValues,
    plannedAssignments,
    tagsToCreate: planCreateSlugs.size,
    tagsToReuse: tagsToReuseHits,
    valuesDropped,
  };
};
