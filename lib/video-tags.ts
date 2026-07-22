export type VideoTagInput = {
  label?: string | null;
  value?: string | null;
};

export type NormalizedVideoTag = {
  name: string;
  slug: string;
};

const normalizeWhitespace = (value: string) => value.trim().replace(/\s+/g, " ");

export const createVideoTagSlug = (value: string) =>
  normalizeWhitespace(value)
    .toLocaleLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "");

export const normalizeVideoTagName = (value: string) => normalizeWhitespace(value);

export const normalizeVideoTags = (tags: VideoTagInput[] = []): NormalizedVideoTag[] => {
  const normalizedTags = new Map<string, NormalizedVideoTag>();

  tags.forEach((tag) => {
    const name = normalizeVideoTagName(tag.label || tag.value || "");
    const slug = createVideoTagSlug(name);

    if (name && slug) {
      normalizedTags.set(slug, { name, slug });
    }
  });

  return Array.from(normalizedTags.values()).sort((first, second) => first.name.localeCompare(second.name));
};
