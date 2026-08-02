## Context

The public blog post detail route at `/blog/{slug}` already loads `Post.tags` and connected `LinksToPosts` records through `getPostBySlug`. The listing card renders post tags as badges, but the detail page currently has a `todo: tags` placeholder. The detail page also shows connected-link UI based on authentication state, which can leave unnecessary UI states when a post has no connected links.

## Goals / Non-Goals

**Goals:**

- Render the existing legacy post tags on public blog post detail pages.
- Keep tag display passive and compatible with the current `Post.tags String[]` field.
- Show connected-link UI only when `post.links.length > 0`.
- Preserve the current authenticated link actions and anonymous sign-in prompt for posts that actually have connected links.

**Non-Goals:**

- No Prisma schema changes or migrations.
- No shared `ContentTag` adoption for posts.
- No tag filtering, tag landing routes, or tag search.
- No changes to link click logging, link detail pages, or admin link connection flows.

## Decisions

### Use Existing Post Tag Data

The implementation should render `post.tags` directly on `/blog/{slug}`. This keeps the slice small and avoids pulling in the later shared content-tag adoption work.

Alternative considered: wait for shared post tags before rendering detail tags. That would keep the future model cleaner, but it leaves an obvious placeholder on the public detail page even though current post tags already exist.

### Match Blog Card Tag Semantics

Detail tags should use the same passive badge/link style as blog cards where practical. If the existing `/blog/tag/{tag}` route is not fully implemented, this feature should not expand into tag page work; detail tags may still use the current link convention or stay passive if implementation context requires it.

Alternative considered: introduce new detail-specific tag UI. That adds inconsistency and makes the later shared tag migration more awkward.

### Guard Connected Links Before Auth State

The page should first check whether the post has connected links. If none exist, it should render no connected-link section and no sign-in prompt. If links exist, authenticated users keep the current link list and anonymous users see the existing sign-in prompt.

Alternative considered: show an empty connected-link section for authenticated users. That is less useful and creates visual noise on posts without links.

## Risks / Trade-offs

- `/blog/tag/{tag}` may not exist or may be incomplete -> Mitigation: keep this feature scoped to detail display and do not implement tag filtering or landing pages here.
- Legacy tag casing or raw values may be inconsistent -> Mitigation: render existing values as-is until `feature-030-content-tags-legacy-post-migration` reviews old tags.
- Hiding the connected-link section could hide useful diagnostics for admins -> Mitigation: this is a public detail route, and admin link management remains under existing admin flows.

## Migration Plan

No data migration is required. Rollback is limited to restoring the old detail page rendering.
