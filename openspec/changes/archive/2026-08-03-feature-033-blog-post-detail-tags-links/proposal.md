## Why

Public blog post detail pages should show the post metadata that already appears on blog cards, and they should avoid empty or misleading connected-link UI. This feature makes the detail page more complete by rendering existing post tags and only showing connected-link messaging when connected links actually exist.

## What Changes

- Render existing post tags on `/blog/{slug}` using the current `Post.tags` string-array data.
- Match the existing blog card tag behavior closely enough that detail tags feel consistent with listing cards.
- Hide the connected links section entirely when a post has no connected links.
- Keep the current authenticated connected-link behavior when links exist.
- Keep the current anonymous "Log in to see links" prompt only when links exist.

### Non-goals

- Do not migrate post tags to shared `ContentTag` records in this feature.
- Do not add tag filtering, tag landing pages, shared tag admin tools, or legacy tag cleanup in this feature.
- Do not change link ownership, short-link routing, click logging, or link connection management in this feature.
- Do not change the post detail data model or Prisma schema in this feature.

## Capabilities

### New Capabilities

- `blog-post-detail`: Defines public blog post detail page metadata display and connected-link visibility behavior.

### Modified Capabilities

None.

## Impact

- Affected route: `/blog/{slug}`.
- Affected data: existing `Post.tags` values and existing `LinksToPosts` relations already loaded by `getPostBySlug`.
- Affected UI: blog post detail page tag display and connected links section visibility.
- No schema, migration, dependency, auth, or route contract changes are expected.
