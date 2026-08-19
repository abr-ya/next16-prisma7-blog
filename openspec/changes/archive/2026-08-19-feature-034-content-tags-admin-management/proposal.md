## Why

Admins need a safe backend foundation for content-wide shared tag management after post adoption, legacy import, and review status work. This slice prepares the data and admin-only mutations for a later UI feature while preserving current public tag behavior.

## What Changes

- Add an admin-only shared content tag management data shape for all `ContentTag` records, not only `NEEDS_REVIEW` tags.
- Return usage visibility by content type, starting with post assignments from `PostsToContentTags`, while leaving room for later content types to report their own usage.
- Add or harden admin server actions to rename a shared tag, merge one tag into another, mark tags active or needing review, remove selected post assignments, and delete unused tags.
- Add a safe delete/detach server boundary: tags with usage require explicit assignment removal or merge first; unused tags can be deleted.
- Keep public blog tag display and legacy post tag fallback behavior unchanged.
- Non-goals: build the broader admin management UI, migrate `VideoTag`/`VideosToVideoTags` to shared content tags, add public tag filtering, add tag management for docs/files before they adopt shared tags, or change the legacy post tag import semantics.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `content-tags`: Extend shared content tag requirements from review-only cleanup to the backend foundation for content-wide admin management with usage visibility, rename, merge, status, and delete/detach boundaries.

## Impact

- Routes: no route behavior change in this slice; later UI work is tracked separately.
- Data models: existing `ContentTag` and `PostsToContentTags`; no new model is expected unless implementation discovers a persistence gap.
- Admin surfaces: no new UI surface in this slice; existing review/import UI may continue to use existing actions.
- Server code: content-tag data helpers and admin server actions under `app/_data/content-tags.ts` and `app/_actions/content-tags.ts`.
- Public surfaces: no intended behavior change for `/blog`, `/blog/[slug]`, or `/blog/tag/[tag]`; public visibility remains governed by existing post status and tag display rules.
