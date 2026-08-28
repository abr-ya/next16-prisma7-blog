## Why

Admins should be able to inspect legacy-only posts and dry-run exact selected batches before using import writes. This creates a safe review step before the follow-up import slice replaces the current all-or-nothing legacy import.

## What Changes

- Add a selectable eligible-posts workflow to the existing **Legacy Post Tags** panel on `/admin/content-tags`.
- Show legacy-only posts that still rely on `Post.tags`, including post identity, current legacy values, planned normalized shared tag names/slugs, and skipped invalid values.
- Support dry-running the selected posts without creating shared tags, assignments, or post updates.
- Keep the existing raw-value inventory summary available for broad cleanup context.
- Keep migration post-scoped: selected posts are migrated as whole posts, not one raw tag value at a time.
- Preserve the existing broad import behavior until the follow-up selected import/apply slice replaces it.
- Leave selected import/apply behavior to `feature-046-content-tags-selected-legacy-post-import-apply`.
- Non-goals: creating `ContentTag` records, creating `PostsToContentTags` assignments, clearing or deleting legacy `Post.tags`, changing public tag filtering/display rules, adding raw-value-only partial migration, changing the post editor tag model, migrating videos/docs/files, and adding automatic scheduled migration.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `content-tags`: Add admin requirements for selected legacy-only post inspection and selected dry-run planning before import.

## Impact

- Routes: `/admin/content-tags`.
- Data models: existing `Post.tags`, `ContentTag`, and `PostsToContentTags`; no schema or migration changes expected.
- Admin surfaces: legacy migration panel gains eligible-post selection and selected dry-run controls.
- Server code: extend legacy migration data/actions in `app/_data/content-tags-legacy-migration.ts` and planning helpers in `lib/content-tags-legacy-migration.ts`.
- Public surfaces: no new public UI behavior.
- Dependencies: no new dependencies expected.
