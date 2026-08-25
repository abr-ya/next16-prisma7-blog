## Why

Admins should be able to see the full shared content tag inventory, not only the subset that currently needs review. This slice turns the existing backend management foundation into a read-oriented admin page so tag cleanup work can be planned safely before adding broader mutation controls.

## What Changes

- Update `/admin/content-tags` to include all shared `ContentTag` records through the existing admin management query.
- Add inventory-level summary counts for total tags, active tags, needs-review tags, and current post assignments.
- Show each shared tag's display name, slug, review status, total usage count, and grouped post usage.
- Preserve the existing legacy post-tag migration panel and needs-review cleanup workflow.
- Keep this slice read-oriented for broad management: no new rename, merge, delete, replace, or selected-assignment management UI is added beyond controls that already exist in the review workflow.
- Non-goals: tag-level management dialogs, unused-tag deletion UI, selected assignment replacement/removal for all tags, video/docs/files adoption into shared content tags, public tag filtering, and public tag display changes.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `content-tags`: Add the first admin inventory UI requirements for viewing all shared content tags and their current supported usage without expanding mutation behavior.

## Impact

- Routes: `/admin/content-tags`.
- Data models: existing `ContentTag` and `PostsToContentTags`; no schema or migration changes.
- Admin surfaces: content tags admin page gains a read-oriented full inventory section while preserving existing migration and review surfaces.
- Public surfaces: no intended behavior changes for blog, docs, videos, or public tag links.
- Server code: reuse `getAdminContentTagManagementItems` from `app/_data/content-tags.ts`; no new server actions expected.
- Client/UI code: likely add or adjust components under `components/admin-pages`.
