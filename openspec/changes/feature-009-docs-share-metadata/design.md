## Context

The site already has a reusable metadata helper in `lib/site-metadata.ts` and applies it to public video pages. Public docs routes currently render content without route-level metadata, which leaves crawlers and link previews dependent on generic app defaults.

The docs surface is public and read-only under `/docs` and `/docs/[slug]`. Docs are loaded through `app/_data/getMdDocs.ts`; admin create/update/delete flows are outside this feature.

## Goals / Non-Goals

**Goals:**

- Add stable metadata to `/docs`.
- Add dynamic metadata to `/docs/[slug]` using public doc content.
- Keep metadata generation aligned with the existing reusable site helper.
- Preserve missing-doc behavior without exposing content-specific metadata.

**Non-Goals:**

- No Prisma schema or migration changes.
- No admin metadata editing workflow.
- No blog post metadata or remaining listing-page metadata in this slice.
- No visual changes to docs rendering.

## Decisions

- Reuse `buildPageMetadata` for docs routes. This keeps canonical URL, Open Graph, Twitter card, site title formatting, and fallback image behavior consistent with the video implementation. The alternative was hand-authored metadata objects in each route, but that would duplicate the recently added pattern.
- Use a lightweight text normalizer for doc body descriptions when a doc has no dedicated description field. The first meaningful text from `post.content` is enough for previews and avoids changing the `MdDoc` model. The alternative was adding a description column, which is unnecessary for a narrow metadata slice.
- Use neutral fallback metadata for missing docs in `generateMetadata`. The page render still calls `notFound()`, and metadata generation must not leak or invent content-specific values for unavailable slugs.

## Risks / Trade-offs

- Markdown content can include syntax that is not ideal as preview text -> mitigate by stripping common markdown markers, collapsing whitespace, and capping description length.
- Dynamic metadata performs the same doc lookup as the page render -> acceptable for this small slice, and it matches Next.js route metadata patterns without changing the data layer.
- The fallback share image is generic rather than docs-specific -> acceptable because this feature proves metadata coverage before investing in content-specific images.

## Migration Plan

No database migration is required. Deploy as a normal application change; rollback is removing route metadata exports and any docs description helper.

## Open Questions

- None.
