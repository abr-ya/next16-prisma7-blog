export const SITE_CONTENT_WIDTH = {
  narrow: "max-w-3xl",
  wide: "max-w-7xl",
} as const;

export type SiteContentWidth = keyof typeof SITE_CONTENT_WIDTH;
