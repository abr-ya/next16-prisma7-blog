## Context

See proposal.md for motivation. The current legacy migration panel on `/admin/content-tags` shows a raw-value inventory and exposes all-or-nothing dry-run/import actions. The server currently loads legacy-only posts by filtering for posts with no `contentTags` assignments and plans normalized tags from `Post.tags`. This slice adds selected eligible-post visibility and selected dry-run; replacing the broad write/import path moves to `feature-046-content-tags-selected-legacy-post-import-apply`.

## Goals / Non-Goals

**Goals:**

- Make the legacy migration workflow post-selective, with dry-run scoped to selected eligible post IDs.
- Preserve post-scoped migration: every selected post imports all valid legacy tag values together.
- Keep the raw legacy tag inventory summary as context while adding a concrete eligible-post selection surface.
- Reuse the existing normalization and admin-auth boundaries for selected planning without adding new write behavior.

**Non-Goals:**

- Do not clear `Post.tags` after import.
- Do not support raw-value-only partial import.
- Do not change public tag resolution or post editor behavior.
- Do not add schema changes or migrate other content types.
- Do not apply selected imports; that is handled by the follow-up write-path slice.

## Decisions

- Add selected-post dry-run actions before selected import actions.
  Rationale: selected post IDs create an explicit admin decision boundary and avoid surprising imports. Alternative considered: ship selection and import together, but that keeps the review-only UX and DB write path in one larger slice.

- Keep eligibility defined as “post has non-empty legacy `Post.tags` and no shared `contentTags` assignments.”
  Rationale: this matches the current safe migration boundary and avoids mixed display states. Alternative considered: allow posts with existing assignments and merge in missing legacy values, but that needs a different reconciliation design.

- Show planned normalized tags per eligible post.
  Rationale: admins need to understand what each selected post will receive before import. Alternative considered: keep only the raw-value aggregate table, but that answers cleanup frequency rather than which posts will be migrated.

- Keep planning post-scoped.
  Rationale: `resolvePostDisplayTags` prefers shared assignments when any exist, so the follow-up import must avoid raw-value-only partial writes that could hide remaining legacy values. Alternative considered: temporarily display a union of legacy and shared tags, but that introduces duplicate handling and public behavior changes outside these slices.

- Extend existing helper shapes rather than introducing new tables.
  Rationale: no persistent migration queue is needed; the page can load eligible posts and submit selected IDs to server actions. The server remains the authority for eligibility at dry-run time.

## Risks / Trade-offs

- Eligible-post lists can become long -> Mitigation: keep the initial UI compact and consider search/pagination only if the real dataset demands it.
- A post can become ineligible between page load and dry-run -> Mitigation: server actions SHALL re-check eligibility and exclude no-longer-eligible posts from the selected summary.
- Users may expect selected import controls immediately after dry-run -> Mitigation: keep copy and tasks explicit that selected apply behavior ships in `feature-046-content-tags-selected-legacy-post-import-apply`.
- Existing all-import controls remain until the follow-up -> Mitigation: keep selected dry-run visually distinct from the existing broad action so admins understand which operation is scoped to selected posts.

## Migration Plan

No database migration is required. Deploying the slice adds selected eligible-post visibility and selected dry-run controls while keeping the existing raw inventory context and current broad import behavior. Rollback is removing the selected-post UI and selected dry-run action while preserving existing `Post.tags`, `ContentTag`, and `PostsToContentTags` data.
