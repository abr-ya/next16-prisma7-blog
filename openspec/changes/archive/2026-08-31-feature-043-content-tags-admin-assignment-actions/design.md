## Context

See `proposal.md` for motivation. `/admin/content-tags` currently combines legacy post-tag migration, all-tag inventory, and the needs-review cleanup workflow. The inventory already exposes tag-level rename/status/merge/delete actions, while `ContentTagsReview` already demonstrates selected post assignment remove/replace behavior for `NEEDS_REVIEW` tags only.

Existing server actions in `app/_actions/content-tags.ts` already enforce admin authorization and include assignment mutations for removing and replacing selected post assignments. Existing management data in `app/_data/content-tags.ts` already returns post usage details for each shared tag.

## Goals / Non-Goals

**Goals:**

- Extend the all-tag inventory into the primary assignment cleanup surface for supported post assignments.
- Reuse or harden existing server actions instead of adding a new API route.
- Keep selection state scoped per tag so assignment actions cannot accidentally cross tag boundaries.
- Require app-styled confirmation for selected assignment removal and replacement.
- Preserve public tag display semantics and existing post visibility behavior.

**Non-Goals:**

- No Prisma schema or migration changes.
- No adoption of shared content tags by videos, docs, files, hikes, tracks, or photos.
- No public tag filtering or new public route behavior.
- No removal of the needs-review workflow in this slice.

## Decisions

- Add assignment actions to `ContentTagsInventory`.
  Rationale: the all-tag inventory is the admin surface that shows every shared tag and its supported usage. Alternative considered: create a separate assignment manager route, but that would split decisions away from the inventory where admins already compare tags and usage.

- Keep actions post-assignment scoped by `{ tagId, postIds }`.
  Rationale: `PostsToContentTags` is the only shared-tag assignment model adopted at runtime today. The UI can show only supported post assignments and leave future content types out until their own adoption slices. Alternative considered: introduce generic content assignment payloads now, but that would add abstraction before multiple assignment types exist.

- Reuse existing server actions for remove and replace.
  Rationale: `removeContentTagAssignments` and `replaceContentTagAssignments` already call `requireAdmin()`, revalidate admin/public paths, deduplicate selected post ids, and avoid deleting posts. This feature should harden them only if implementation reveals missing validation. Alternative considered: duplicate inventory-specific actions, but that increases drift between inventory and review cleanup behavior.

- Add confirmation state in the inventory client component.
  Rationale: selected assignment removal and replacement are sensitive because they alter published post tag display. Confirmation dialogs match the existing admin confirmation pattern used by tag merge/delete. Alternative considered: immediate button execution with toast errors, but that is too easy to trigger accidentally.

- Clear or refresh selection after successful mutation.
  Rationale: selected assignment rows may disappear or move to another tag after a mutation, so stale selections should not survive successful actions. Alternative considered: preserve selections across refresh, but that creates confusing state after assignments change.

## Risks / Trade-offs

- Inventory table may become visually dense -> Keep assignment controls compact, scoped to each tag's usage cell or an adjacent action panel, and avoid duplicating all needs-review card layout inside every row.
- Existing replacement action can create a new target tag as `ACTIVE` by default -> Accept current shared tag identity behavior unless implementation discovers it conflicts with existing server action semantics.
- Selection can become stale after `router.refresh()` -> Clear selected post ids for the affected tag after successful remove or replace.
- Assignment changes can affect public post tag labels -> Reuse existing revalidation and keep public visibility rules unchanged.

## Migration Plan

No database migration is required. Deploying the slice adds admin UI around existing `ContentTag` and `PostsToContentTags` behavior. Rollback is removing the new inventory assignment controls while leaving the existing server actions and needs-review workflow in place.
