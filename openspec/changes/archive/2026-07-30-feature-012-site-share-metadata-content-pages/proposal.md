## Why

Public blog and remaining public content pages should produce consistent link previews using the reusable metadata foundation already proven on videos and docs. This closes the current metadata coverage gap without adding new admin fields or content-management flows.

## What Changes

- Add share metadata to the public blog listing page.
- Add dynamic share metadata to public blog post detail pages using the post title, content-derived description, and existing post image.
- Add stable collection metadata to the public home page and comments placeholder page.
- Preserve fallback site metadata for missing or unavailable blog posts.
- Keep metadata generation on the server and reuse the existing shared metadata builder.

## Non-goals

- Do not add new database fields, migrations, or admin editing controls.
- Do not add generated preview images, image cropping, or upload workflows.
- Do not change blog rendering, pagination, visibility rules, or comments behavior.
- Do not apply share metadata to admin or authentication routes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `site-share-metadata`: Extend the existing reusable share metadata behavior to blog posts and remaining public content listing pages.

## Impact

- Affected public routes: `/`, `/blog`, `/blog/[slug]`, and `/comments`.
- Affected helpers: existing post data access and `lib/site-metadata.ts` usage.
- Affected data models: none.
- Affected admin surface: none.
- Dependencies: none.
