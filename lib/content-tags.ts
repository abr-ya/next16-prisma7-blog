export type ContentTagInput = {
  label?: string | null;
  value?: string | null;
};

export type NormalizedContentTag = {
  name: string;
  slug: string;
};

export type PostContentTagAssignment = {
  tag: {
    name: string;
  };
};

export type PostWithDisplayTagSources = {
  tags?: string[] | null;
  contentTags?: PostContentTagAssignment[] | null;
};

const normalizeWhitespace = (value: string) => value.trim().replace(/\s+/g, " ");

export const createContentTagSlug = (value: string) =>
  normalizeWhitespace(value)
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

export const normalizeContentTagName = (value: string) => normalizeWhitespace(value);

export const normalizeContentTags = (tags: ContentTagInput[] = []): NormalizedContentTag[] => {
  const normalizedTags = new Map<string, NormalizedContentTag>();

  tags.forEach((tag) => {
    const name = normalizeContentTagName(tag.label || tag.value || "");
    const slug = createContentTagSlug(name);

    if (name && slug) {
      normalizedTags.set(slug, { name, slug });
    }
  });

  return Array.from(normalizedTags.values()).sort((first, second) => first.name.localeCompare(second.name));
};

/** Prefer shared content-tag assignment names; fall back to legacy `Post.tags`. */
export const resolvePostDisplayTags = (post: PostWithDisplayTagSources): string[] => {
  const assignments = post.contentTags ?? [];

  if (assignments.length > 0) {
    return assignments
      .map((assignment) => assignment.tag.name)
      .filter(Boolean)
      .sort((first, second) => first.localeCompare(second));
  }

  return [...(post.tags ?? [])];
};
