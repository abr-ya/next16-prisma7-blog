## Why

Admins should be able to manage shared content tags directly from the all-tag inventory instead of relying only on the needs-review cleanup queue. This slice turns the existing admin-only tag management actions into visible, focused tag-level controls so tag cleanup can continue safely before assignment-level bulk tools are added.

## What Changes

- Add tag-level action controls to `/admin/content-tags` for every shared `ContentTag` shown in the inventory.
- Support renaming a tag, marking it `ACTIVE`, marking it `NEEDS_REVIEW`, merging it into another tag, and deleting it only when it has no supported assignments.
- Use the existing admin server actions and app-styled confirmation dialogs for destructive or sensitive operations.
- Keep direct deletion blocked for tags that still have post assignments, directing admins to merge or remove assignments first.
- Preserve the existing legacy migration panel and needs-review workflow on the same admin page.
- Non-goals: selected assignment removal or replacement from the all-tag inventory, public tag filtering, public display changes, schema changes, video/docs/files adoption into shared content tags, and new restore/undo flows.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `content-tags`: Add admin inventory UI requirements for tag-level rename, status, merge, and unused-delete controls on shared content tags.

## Impact

- Routes: `/admin/content-tags`.
- Data models: existing `ContentTag` and `PostsToContentTags`; no schema or migration changes.
- Admin surfaces: content tags inventory gains action dialogs while migration and needs-review sections remain available.
- Server code: reuse existing actions in `app/_actions/content-tags.ts` and existing admin authorization boundaries.
- Public surfaces: no new public behavior; post tag displays may refresh after rename or merge through existing revalidation.
- Dependencies: no new dependencies expected.
