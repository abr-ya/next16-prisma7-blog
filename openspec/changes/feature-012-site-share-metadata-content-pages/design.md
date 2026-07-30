## Context

The reusable metadata foundation is implemented in `lib/site-metadata.ts` and already serves public video and docs routes. The remaining public content routes still rely on default metadata or no route-specific metadata, which leaves shared links for blog posts and public collection pages less descriptive than the content shown on the page.

This change is metadata-only. It does not introduce new database fields, migrations, upload flows, or admin behavior.

## Goals / Non-Goals

**Goals:**

- Add route-specific share metadata for `/`, `/blog`, `/blog/[slug]`, and `/comments`.
- Derive blog post detail metadata from existing post fields.
- Keep missing post metadata generic so unavailable content does not leak stale or misleading details.
- Reuse the existing metadata builder for canonical URLs, Open Graph, Twitter card metadata, and fallback preview images.

**Non-Goals:**

- Add or change post visibility rules.
- Add blog preview-image management beyond the existing `Post.imageUrl`.
- Change blog page rendering, comments behavior, pagination, or admin workflows.
- Add metadata to admin or authentication routes.

## Decisions

- Reuse `buildPageMetadata` for every route in scope.
  - Rationale: videos and docs already use this helper, so this keeps title formatting, canonical URL behavior, Open Graph, Twitter card, and fallback image behavior consistent.
  - Alternative considered: define route-local metadata objects manually. This was rejected because it would duplicate defaults and increase drift risk.

- Add static metadata exports for public collection pages.
  - Rationale: `/`, `/blog`, and `/comments` can use stable title, description, path, and fallback image values without data loading.
  - Alternative considered: dynamically count content for collection descriptions. This was rejected because it would expand the feature beyond share metadata coverage.

- Add `generateMetadata` to `/blog/[slug]`.
  - Rationale: post detail metadata depends on the requested slug and existing post data.
  - Alternative considered: use only default site metadata for posts. This would leave the highest-value share target without content-specific previews.

- Use existing post fields for detail metadata.
  - Rationale: `Post.title`, `Post.content`, and `Post.imageUrl` already support a descriptive share title, content-derived description, and content-specific preview image.
  - Alternative considered: add a dedicated post excerpt or preview image field. This is intentionally deferred because it would require admin/data-model scope.

## Risks / Trade-offs

- Blog detail metadata may incrementally duplicate a post fetch if the page also loads the post. -> Keep the first implementation simple; consolidate with a read helper later only if profiling shows meaningful overhead.
- HTML-rich post content may produce noisy descriptions. -> Reuse or lightly extend the existing markdown/text description helper rather than adding a separate parsing dependency.
- Missing posts currently render `null` after fetch. -> Metadata generation should still return generic fallback metadata for the slug so unavailable content is not represented as a real post.
- `updatePostViews` is page behavior, not metadata behavior. -> Metadata generation must avoid side effects and only read post data.

## Migration Plan

No database migration is required. Deployment is a normal code-only rollout.

Rollback is removing the route-level metadata exports/generator and the delta spec for this change.

## Open Questions

- None for the planning slice.
