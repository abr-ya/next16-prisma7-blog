## Why

Shared links should show useful previews instead of only the site default metadata. Public pages need dynamic titles, descriptions when available, and preview images when a content-specific image exists.

## What Changes

- Add a shared metadata helper for consistent Next.js `Metadata`, Open Graph, and Twitter card output.
- Add site-level default metadata and a fallback preview image for pages without their own image.
- Add dynamic `generateMetadata()` for public content detail pages:
  - blog posts use the post title, a derived description, and `imageUrl`.
  - docs use the doc title and optional description.
  - videos use the video title and thumbnail when present.
- Add useful static metadata for public listing pages such as `/blog`, `/docs`, and `/videos`.
- Keep metadata generation scoped to public pages; admin and auth routes can continue to use defaults unless later feature work requires more.
- Non-goals: metadata editing UI, per-page SEO dashboards, sitemap work, JSON-LD, image generation services, or schema changes.

## Capabilities

### New Capabilities

- `site-share-metadata`: Public pages expose share-preview metadata with dynamic title, optional description, and preview image fallback behavior.

### Modified Capabilities

None.

## Impact

- Affected routes: `app/layout.tsx`, public listing pages, `app/blog/[slug]/page.tsx`, `app/docs/[slug]/page.tsx`, and `app/videos/[id]/page.tsx`.
- Affected helpers: new shared metadata helper under `lib`.
- Affected assets: add a stable fallback preview image under a public asset path or equivalent local app asset.
- Affected data models: none expected.
- Public surface: link previews in messengers/social platforms should show page-specific metadata for public pages.
- Admin impact: none.
- Validation: `npm run tsc`, `npm run lint`, local `npm run build`, and manual inspection of rendered metadata for representative pages.
