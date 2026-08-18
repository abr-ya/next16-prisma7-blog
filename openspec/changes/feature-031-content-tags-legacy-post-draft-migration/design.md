## Context

Posts already write new tag edits through shared `ContentTag` and `PostsToContentTags` records, while older posts may still have only legacy `Post.tags` string-array values. The review-status workflow in `master` added `ContentTag.status` with `ACTIVE` and `NEEDS_REVIEW`, plus an admin review surface at `/admin/content-tags`.

The legacy import should use that review workflow instead of making old string values immediately canonical. The old donor branch contains useful inventory and dry-run code, but its apply behavior and OpenSpec artifacts predate review status.

## Goals / Non-Goals

**Goals:**

- Add an admin-only legacy post-tag import surface to the current content-tags admin area.
- Preserve dry-run/inventory visibility before apply.
- Import eligible legacy-only post tags as shared post/tag assignments with `NEEDS_REVIEW` status.
- Keep public tag behavior stable before and after import.
- Reuse selected donor branch helpers where they fit the new contract.

**Non-Goals:**

- Do not create a separate `/admin/tags` route unless the existing `/admin/content-tags` route proves unsuitable.
- Do not add broad tag management beyond the existing review workflow.
- Do not migrate non-post tags.
- Do not delete legacy post data or reset database state.

## Decisions

### Integrate into `/admin/content-tags`

The migration panel should live alongside the existing content-tag review workflow so admins import legacy tags and then clean them up in the same area.

Alternative considered: restore the donor branch `/admin/tags` route. That would split closely related workflows and duplicate sidebar/navigation concepts that `master` has already settled around `/admin/content-tags`.

### Import as `NEEDS_REVIEW`

Apply should create or reuse shared tag records by normalized slug, create missing post/tag assignments, and ensure imported legacy values are reviewable by setting affected imported tags to `NEEDS_REVIEW`.

Alternative considered: import as active/canonical after optional drop/rename policy. That duplicates cleanup controls now provided by the review workflow and makes old ambiguous values look approved too early.

### Keep migration idempotent and conservative

Eligible posts should be posts with non-empty legacy `Post.tags` and no shared content-tag assignments. Assignment creation should skip duplicates, and existing posts with assignments should be left alone.

Alternative considered: import legacy strings even for posts that already have shared assignments. That risks reintroducing stale tag values after an admin has already edited a post through the new shared-tag form.

### Preserve legacy fallback until import

The import should not remove the compatibility behavior where posts without shared assignments display legacy `Post.tags`. Once imported, those posts may resolve display tags through shared assignments.

Alternative considered: clear `Post.tags` after import. That would make rollback and audit harder and is not required for this slice.

## Risks / Trade-offs

- Existing `ContentTag` records reused by legacy imports may already be active. Marking them `NEEDS_REVIEW` could flag assignments created earlier through normal post editing. Mitigation: expose this clearly as a conservative review signal and rely on the admin review workflow for approval.
- A raw legacy value may normalize to an empty slug. Mitigation: skip invalid values and report skipped counts in dry-run/apply summaries.
- Importing all eligible posts in one action could touch many rows. Mitigation: keep the first slice simple but report counts first and use idempotent writes; pagination/batching can be added later if real data volume demands it.
- Public display source can change from legacy fallback to shared assignment after import. Mitigation: normalize display names consistently and validate public listing/detail behavior.

## Migration Plan

1. Promote the backlog candidate as `feature-031-content-tags-legacy-post-draft-migration`.
2. Add the OpenSpec deltas and implementation tasks.
3. Pull forward selected donor helpers and adapt apply behavior to `NEEDS_REVIEW`.
4. Integrate the migration panel into `/admin/content-tags`.
5. Validate with OpenSpec, TypeScript, lint, and a user-run build.

Rollback is code-level only: do not delete existing content-tag rows or assignments automatically. If an import is applied accidentally, admins can use the review workflow to remove or replace assignments.
