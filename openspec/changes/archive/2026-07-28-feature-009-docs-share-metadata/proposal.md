## Why

Public docs pages should produce useful link previews with stable titles, descriptions, canonical URLs, and preview images. The reusable share metadata foundation is already proven on video pages, so the next narrow step is to apply it to docs before expanding to the rest of the site.

## What Changes

- Add collection metadata for the public `/docs` listing page.
- Add dynamic metadata for public `/docs/[slug]` pages using the markdown doc title and content-derived description when available.
- Keep missing docs from exposing content-specific metadata.
- Reuse the existing site metadata helper and fallback preview image.

## Non-goals

- Do not add share metadata to blog posts or non-doc public listing pages in this slice.
- Do not change the `MdDoc` data model or add admin metadata fields.
- Do not change the docs rendering UI or markdown content behavior.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `site-share-metadata`: Extend the existing share metadata behavior from video pages to public docs pages.

## Impact

- Affected public routes: `/docs` and `/docs/[slug]`.
- Affected helpers: existing site metadata builder in `lib/site-metadata.ts` if docs-specific description normalization needs a small reusable helper.
- Data models: none.
- Admin surfaces: none.
- Dependencies: none.
