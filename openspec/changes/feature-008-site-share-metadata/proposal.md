## Why

Shared video links should show useful previews instead of only the site default metadata. This first slice adds the reusable metadata foundation and proves it on public video pages before extending the pattern to blog, docs, and listing pages.

## What Changes

- Add a shared metadata helper for consistent Next.js `Metadata`, Open Graph, and Twitter card output.
- Add site-level default metadata and a fallback preview image for pages without their own image.
- Add dynamic `generateMetadata()` for public video detail pages, using the video title and thumbnail when present.
- Add useful static metadata for the public `/videos` listing page.
- Keep metadata generation scoped to public pages; admin and auth routes can continue to use defaults unless later feature work requires more.
- Defer blog post, docs, and broader listing-page metadata to `feature-009-site-share-metadata-content-pages`.
- Non-goals: blog/docs metadata in this slice, metadata editing UI, per-page SEO dashboards, sitemap work, JSON-LD, image generation services, or schema changes.

## Capabilities

### New Capabilities

- `site-share-metadata`: Public video pages expose share-preview metadata with dynamic title, optional description, and preview image fallback behavior through a reusable foundation.

### Modified Capabilities

None.

## Impact

- Affected routes: `app/layout.tsx`, `app/videos/page.tsx`, and `app/videos/[id]/page.tsx`.
- Affected helpers: new shared metadata helper under `lib`.
- Affected assets: add a stable fallback preview image under a public asset path or equivalent local app asset.
- Affected data models: none expected.
- Public surface: link previews in messengers/social platforms should show page-specific metadata for public video pages.
- Admin impact: none.
- Validation: `npm run tsc`, `npm run lint`, local `npm run build`, and manual inspection of rendered metadata for the video listing and a public video detail page.
