## Context

`feature-044-content-tags-selective-legacy-post-import` is complete and archived. The legacy migration panel on `/admin/content-tags` now exposes eligible-post selection, planned tag previews, and selected dry-run. This follow-up adds the write path that applies the selected plan by creating shared content tags and post/tag assignments for selected eligible posts, and replaces the broad all-post import control.

## Goals / Non-Goals

**Goals:**

- Apply the legacy migration only for selected eligible post IDs.
- Preserve post-scoped migration: every selected post imports all valid legacy tag values together.
- Reuse the selected dry-run planning shape so admins can compare planned and applied results.
- Reuse existing normalization, upsert, review-status, admin-auth, logging, and revalidation boundaries.

**Non-Goals:**

- Do not clear legacy `Post.tags` after import.
- Do not support raw-value-only partial import.
- Do not change public tag resolution or post editor behavior.
- Do not add schema changes or migrate other content types.
- Do not keep the broad all-post import action once selected import ships.

## Decisions

- Add `Import Selected` only after selected dry-run exists.
  Rationale: the write path should consume the same selected-post boundary admins already reviewed in the dry-run slice.

- Re-check eligibility during import.
  Rationale: a post may gain shared content-tag assignments between page load, dry-run, and apply. The server remains authoritative and skips no-longer-eligible posts safely.

- Keep imports idempotent by relying on unique tag slugs and unique post/tag assignments.
  Rationale: repeat submissions should not duplicate relationships or create multiple tags for the same normalized value.

- Keep imported tags in `NEEDS_REVIEW`.
  Rationale: existing admin review controls already cover approve, replace, remove, and merge behavior, so the import workflow does not need separate canonicalization controls.

- Do not clear legacy `Post.tags`.
  Rationale: this preserves source data and keeps rollback/data audit simpler. Public display already prefers shared assignments once they exist.

- Replace broad all-post import with selected import.
  Rationale: the selective workflow is now proven in feature-044, so the write path should match the same post-selection boundary instead of keeping a surprising all-or-nothing import action.

## Risks / Trade-offs

- A selected post can become ineligible before import -> Mitigation: import re-checks eligibility and reports skipped posts.
- Import creates review workload -> Mitigation: all imported tags enter the existing `NEEDS_REVIEW` workflow with known cleanup actions.
- Revalidation can be easy to under-scope -> Mitigation: revalidate `/admin/content-tags` and affected public blog post detail/listing paths consistent with existing content-tag actions.

## Migration Plan

No database migration is required. Deploying the slice adds selected import controls and server-side write behavior using existing `ContentTag` and `PostsToContentTags` tables. Rollback is removing the selected import UI/action; already-created shared tags and assignments remain ordinary content-tag data for admins to review or clean up through existing tools.
