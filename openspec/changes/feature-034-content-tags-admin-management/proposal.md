## Why

Admins need one content-wide place to manage shared content tags after post adoption, legacy import, and review status work. This turns the current review-only `/admin/content-tags` surface into a broader tag management workflow where admins can inspect usage, rename tags, merge duplicates, and safely remove unused or selected assignments without changing public visibility rules.

## What Changes

- Add an admin-only shared content tag management view for all `ContentTag` records, not only `NEEDS_REVIEW` tags.
- Show usage visibility by content type, starting with post assignments from `PostsToContentTags`, while leaving room for later content types to report their own usage.
- Add admin actions to rename a shared tag, merge one tag into another, mark tags active or needing review, and remove selected post assignments.
- Add a safe delete/detach boundary: tags with usage require explicit assignment removal or merge first; unused tags can be deleted.
- Keep public blog tag display and legacy post tag fallback behavior unchanged.
- Non-goals: migrate `VideoTag`/`VideosToVideoTags` to shared content tags, add public tag filtering, add tag management for docs/files before they adopt shared tags, or change the legacy post tag import semantics.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `content-tags`: Extend shared content tag requirements from review-only cleanup to content-wide admin management with usage visibility, rename, merge, status, and delete/detach boundaries.

## Impact

- Routes: `/admin/content-tags`.
- Data models: existing `ContentTag` and `PostsToContentTags`; no new model is expected unless implementation discovers a persistence gap.
- Admin surfaces: content tag admin page, tag review panel, and any new management table/dialog components under `components/admin-pages`.
- Server code: content-tag data helpers and admin server actions under `app/_data/content-tags.ts` and `app/_actions/content-tags.ts`.
- Public surfaces: no intended behavior change for `/blog`, `/blog/[slug]`, or `/blog/tag/[tag]`; public visibility remains governed by existing post status and tag display rules.
