## Why

Admins should be able to bring legacy `Post.tags` values into the shared content-tag system without making those old values immediately canonical or hiding them from public pages. Now that shared tag review status exists, legacy post tags can be imported as `NEEDS_REVIEW` assignments and cleaned up through the existing admin review workflow.

## What Changes

- Add an admin-only legacy post-tag migration workflow for posts that still have `Post.tags` values but no shared content-tag assignments.
- Show an inventory and dry-run summary of legacy tag values before applying the migration.
- On apply, create or reuse shared `ContentTag` records and assign them to eligible posts.
- Mark imported or reused legacy tag records as `NEEDS_REVIEW` so admins can approve, replace, remove, or merge them through `/admin/content-tags`.
- Preserve public behavior: imported tags remain visible anywhere shared post tags are already displayed, and unmigrated legacy-only posts keep the existing fallback.
- Keep migration scope limited to post tags; broader shared-tag management and non-post content adoption remain separate work.

Non-goals:

- Do not bulk-migrate video, docs, files, or other content-type tags.
- Do not add a separate content-wide tag management dashboard beyond the existing review workflow.
- Do not remove `Post.tags` compatibility or reset existing post data.
- Do not make imported tags public-invisible or draft-only; review status is an admin cleanup signal only.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `content-tags`: Add admin-controlled legacy post-tag import into shared content tags with `NEEDS_REVIEW` status and unchanged public visibility.
- `content-tags-post-adoption`: Replace the “later migration” boundary with the concrete legacy migration behavior for posts that still rely only on `Post.tags`.

## Impact

- Affected admin route: `/admin/content-tags`.
- Affected data models: `Post.tags`, `ContentTag`, `PostsToContentTags`, and `ContentTag.status`.
- Affected server code: admin-gated data helpers/actions for legacy inventory, dry-run, and apply.
- Affected UI: content tags admin page gains a migration surface alongside the review workflow.
- Public blog listing/detail behavior should remain compatible with both existing legacy fallback and imported shared assignments.
- No new dependencies are expected.
