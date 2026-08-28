import { createContentTagSlug, normalizeContentTagName, type NormalizedContentTag } from "@/lib/content-tags";

export const EMPTY_LEGACY_POST_SELECTION_MESSAGE = "Select at least one post";

export type LegacyPostTagInventorySample = {
  id: string;
  slug: string;
  title: string;
};

export type LegacyPostTagInventoryRow = {
  rawValue: string;
  count: number;
  suggestedSlug: string;
  samplePosts: LegacyPostTagInventorySample[];
};

export type LegacyEligiblePostRow = {
  id: string;
  slug: string;
  title: string;
  rawValues: string[];
  plannedTags: NormalizedContentTag[];
  skippedValues: string[];
};

export type LegacyPostTagMigrationSummary = {
  mode: "dry-run" | "apply";
  eligiblePosts: number;
  postsProcessed: number;
  postsSkippedNoValidTags: number;
  uniqueRawValues: number;
  plannedAssignments: number;
  tagsToCreate: number;
  tagsToReuse: number;
  valuesSkipped: number;
  selectedPosts?: number;
  postsSkippedIneligible?: number;
  postsMigrated?: number;
};

export type LegacyOnlyPostSnapshot = {
  id: string;
  slug: string;
  title: string;
  tags: string[];
};

const SAMPLE_POST_LIMIT = 5;

export const normalizeSelectedPostIds = (postIds: string[] = []): string[] =>
  Array.from(new Set(postIds.map((id) => id.trim()).filter((id) => id.length > 0)));

export const selectEligibleLegacyPosts = (
  posts: LegacyOnlyPostSnapshot[],
  postIds: string[],
): {
  selectedPostIds: string[];
  eligiblePosts: LegacyOnlyPostSnapshot[];
  postsSkippedIneligible: number;
} => {
  const selectedPostIds = normalizeSelectedPostIds(postIds);

  if (selectedPostIds.length === 0) {
    throw new Error(EMPTY_LEGACY_POST_SELECTION_MESSAGE);
  }

  const eligibleById = new Map(posts.map((post) => [post.id, post]));
  const eligiblePosts = selectedPostIds.flatMap((id) => {
    const post = eligibleById.get(id);
    return post ? [post] : [];
  });

  return {
    selectedPostIds,
    eligiblePosts,
    postsSkippedIneligible: selectedPostIds.length - eligiblePosts.length,
  };
};

export const planLegacyPostTags = (
  rawTags: string[] = [],
): { planned: NormalizedContentTag[]; skippedCount: number; skippedValues: string[] } => {
  const planned = new Map<string, NormalizedContentTag>();
  const skippedValues: string[] = [];
  let skippedCount = 0;

  rawTags.forEach((raw) => {
    const name = normalizeContentTagName(raw);
    const slug = createContentTagSlug(name);

    if (!name || !slug) {
      skippedCount += 1;
      const skipped = name || raw.trim() || raw;
      if (skipped && !skippedValues.includes(skipped)) {
        skippedValues.push(skipped);
      }
      return;
    }

    if (!planned.has(slug)) {
      planned.set(slug, { name, slug });
    }
  });

  return {
    planned: Array.from(planned.values()).sort((first, second) => first.name.localeCompare(second.name)),
    skippedCount,
    skippedValues,
  };
};

export const buildEligiblePostRows = (posts: LegacyOnlyPostSnapshot[]): LegacyEligiblePostRow[] =>
  posts.map((post) => {
    const { planned, skippedValues } = planLegacyPostTags(post.tags);

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      rawValues: post.tags.map((tag) => tag.trim()).filter((tag) => tag.length > 0),
      plannedTags: planned,
      skippedValues,
    };
  });

export const buildLegacyTagInventory = (
  posts: LegacyOnlyPostSnapshot[],
): {
  eligiblePosts: number;
  uniqueRawValues: number;
  rows: LegacyPostTagInventoryRow[];
} => {
  const frequency = new Map<
    string,
    {
      count: number;
      suggestedSlug: string;
      samplePosts: LegacyPostTagInventorySample[];
    }
  >();

  posts.forEach((post) => {
    post.tags.forEach((raw) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      const existing = frequency.get(trimmed);
      if (existing) {
        existing.count += 1;
        if (
          existing.samplePosts.length < SAMPLE_POST_LIMIT &&
          !existing.samplePosts.some((sample) => sample.id === post.id)
        ) {
          existing.samplePosts.push({ id: post.id, slug: post.slug, title: post.title });
        }
        return;
      }

      frequency.set(trimmed, {
        count: 1,
        suggestedSlug: createContentTagSlug(trimmed),
        samplePosts: [{ id: post.id, slug: post.slug, title: post.title }],
      });
    });
  });

  const rows = Array.from(frequency.entries())
    .map(([rawValue, info]) => ({
      rawValue,
      count: info.count,
      suggestedSlug: info.suggestedSlug,
      samplePosts: info.samplePosts,
    }))
    .sort((first, second) => second.count - first.count || first.rawValue.localeCompare(second.rawValue));

  return {
    eligiblePosts: posts.length,
    uniqueRawValues: rows.length,
    rows,
  };
};

export const summarizeLegacyMigrationPlan = (
  posts: LegacyOnlyPostSnapshot[],
  existingSlugs: Set<string>,
  mode: "dry-run" | "apply",
): LegacyPostTagMigrationSummary => {
  let plannedAssignments = 0;
  let valuesSkipped = 0;
  let postsSkippedNoValidTags = 0;
  const tagsToCreate = new Set<string>();
  const tagsToReuse = new Set<string>();

  posts.forEach((post) => {
    const { planned, skippedCount } = planLegacyPostTags(post.tags);
    valuesSkipped += skippedCount;

    if (planned.length === 0) {
      postsSkippedNoValidTags += 1;
      return;
    }

    plannedAssignments += planned.length;
    planned.forEach((tag) => {
      if (existingSlugs.has(tag.slug)) {
        tagsToReuse.add(tag.slug);
      } else {
        tagsToCreate.add(tag.slug);
      }
    });
  });

  return {
    mode,
    eligiblePosts: posts.length,
    postsProcessed: posts.length,
    postsSkippedNoValidTags,
    uniqueRawValues: buildLegacyTagInventory(posts).uniqueRawValues,
    plannedAssignments,
    tagsToCreate: tagsToCreate.size,
    tagsToReuse: tagsToReuse.size,
    valuesSkipped,
  };
};

export const summarizeSelectedLegacyMigrationPlan = (
  posts: LegacyOnlyPostSnapshot[],
  existingSlugs: Set<string>,
  postIds: string[],
  mode: "dry-run" | "apply",
): LegacyPostTagMigrationSummary => {
  const { selectedPostIds, eligiblePosts, postsSkippedIneligible } = selectEligibleLegacyPosts(posts, postIds);

  return {
    ...summarizeLegacyMigrationPlan(eligiblePosts, existingSlugs, mode),
    selectedPosts: selectedPostIds.length,
    postsSkippedIneligible,
  };
};
