## Why

Admins should be able to clean up shared content tag assignments from the main tag inventory, not only from the needs-review queue. The tag-level inventory actions are already proven, and assignment cleanup is the next small slice needed before broader shared-tag usage becomes comfortable.

## What Changes

- Add assignment-level selection controls to the `/admin/content-tags` inventory for supported post assignments.
- Allow admins to remove selected post assignments from a shared content tag without deleting posts or changing unrelated assignments.
- Allow admins to replace selected post assignments with another shared tag, creating or reusing the replacement tag and deduplicating existing assignments.
- Require app-styled confirmation before selected assignment removal or replacement runs.
- Keep the existing needs-review cleanup workflow available and unchanged in scope.

## Non-goals

- Do not add schema changes or Prisma migrations.
- Do not migrate videos, docs, files, or other content types onto shared content tags.
- Do not add public tag filtering or change public tag visibility/display behavior.
- Do not add bulk content editing beyond selected shared-tag assignment removal and replacement.
- Do not remove the existing needs-review cleanup workflow.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `content-tags`: add admin inventory behavior for selecting shared post/tag assignments and running remove or replace actions from the all-tag management surface.

## Impact

- Affected route: `/admin/content-tags`.
- Affected admin surface: `ContentTagsInventory` gains post assignment selection and assignment action dialogs.
- Affected server actions: existing content tag assignment mutation actions may be reused or hardened.
- Affected data models: existing `ContentTag` and `PostsToContentTags`; no schema migration.
- Public surfaces remain unchanged except for normal revalidation after assignment mutations.
