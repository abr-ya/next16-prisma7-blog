## Why

Admins should be able to migrate legacy post tags in controlled batches by choosing the exact posts to import, instead of running the current all-or-nothing legacy import. This keeps the migration safe while avoiding partial-per-post states where only some tags are moved into shared content tags and the remaining legacy tags disappear from display.

## What Changes

- Add a selectable eligible-posts workflow to the existing **Legacy Post Tags** panel on `/admin/content-tags`.
- Show legacy-only posts that still rely on `Post.tags`, including post identity, current legacy values, planned normalized shared tag names/slugs, and skipped invalid values.
- Support dry-running the selected posts before import.
- Support importing the selected posts, moving all valid legacy tags for each selected post into shared `ContentTag` records and `PostsToContentTags` assignments.
- Keep the existing raw-value inventory summary available for broad cleanup context.
- Keep migration post-scoped: selected posts are migrated as whole posts, not one raw tag value at a time.
- Preserve public behavior: once a post has shared tag assignments, existing display logic continues to prefer shared tags over legacy `Post.tags`.
- Non-goals: clearing or deleting legacy `Post.tags`, changing public tag filtering/display rules, adding raw-value-only partial migration, changing the post editor tag model, migrating videos/docs/files, and adding automatic scheduled migration.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `content-tags`: Add admin requirements for selective post-scoped legacy `Post.tags` import into shared content tags.

## Impact

- Routes: `/admin/content-tags`.
- Data models: existing `Post.tags`, `ContentTag`, and `PostsToContentTags`; no schema or migration changes expected.
- Admin surfaces: legacy migration panel gains eligible-post selection, selected dry-run, and selected import controls.
- Server code: extend legacy migration data/actions in `app/_data/content-tags-legacy-migration.ts` and planning helpers in `lib/content-tags-legacy-migration.ts`.
- Public surfaces: no new public UI behavior; migrated posts continue to render shared content tags through existing fallback rules.
- Dependencies: no new dependencies expected.
