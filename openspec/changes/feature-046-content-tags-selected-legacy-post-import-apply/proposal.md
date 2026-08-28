## Why

Admins need to turn a reviewed selected dry-run into an actual legacy post tag import without falling back to the older all-or-nothing migration. This completes the selective migration flow by adding the write path after the safer planning slice is proven.

## What Changes

- Add selected-post import/apply behavior to the **Legacy Post Tags** panel on `/admin/content-tags`.
- Import all valid legacy `Post.tags` values for each selected eligible post into shared `ContentTag` records and `PostsToContentTags` assignments.
- Mark imported legacy tag records as `NEEDS_REVIEW` so existing cleanup workflows remain the canonical review path.
- Re-check eligibility server-side at import time and skip posts that no longer qualify.
- Add app-styled confirmation before the selected import is applied.
- Show selected import result feedback, including imported posts, assignments, reused/new tags, skipped values, and no-longer-eligible skips.
- Replace the broad all-post import control with selected import after confirmation.
- Keep migration post-scoped: selected posts are imported as whole posts, not one raw tag value at a time.
- Non-goals: clearing or deleting legacy `Post.tags`, changing public tag filtering/display rules, adding raw-value-only partial migration, changing the post editor tag model, migrating videos/docs/files, and adding automatic scheduled migration.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `content-tags`: Add admin requirements for applying selected post-scoped legacy `Post.tags` import into shared content tags.

## Impact

- Routes: `/admin/content-tags`.
- Data models: existing `Post.tags`, `ContentTag`, and `PostsToContentTags`; no schema or migration changes expected.
- Admin surfaces: legacy migration panel gains selected import confirmation and result reporting.
- Server code: extend legacy migration data/actions in `app/_data/content-tags-legacy-migration.ts` and planning helpers in `lib/content-tags-legacy-migration.ts`.
- Public surfaces: no new public UI behavior; migrated posts continue to render shared content tags through existing fallback rules.
- Dependencies: no new dependencies expected.
