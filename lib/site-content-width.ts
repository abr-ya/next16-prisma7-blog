export const SITE_CONTENT_WIDTH = {
  narrow: "max-w-3xl",
  /** feature-158: public content pages — noticeably wider than narrow. */
  content: "max-w-5xl",
  wide: "max-w-7xl",
} as const;

export type SiteContentWidth = keyof typeof SITE_CONTENT_WIDTH;
