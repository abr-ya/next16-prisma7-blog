## Context

See proposal.md for motivation. The current legacy migration panel on `/admin/content-tags` shows a raw-value inventory and exposes all-or-nothing dry-run/import actions. The server currently loads legacy-only posts by filtering for posts with no `contentTags` assignments, plans normalized tags from `Post.tags`, and imports all eligible posts. Public post tag rendering already prefers shared `contentTags` and falls back to legacy `Post.tags`, so importing only some tags for a post would hide the remaining legacy values from display.

## Goals / Non-Goals

**Goals:**

- Make the legacy migration workflow post-selective, with dry-run and import scoped to selected eligible post IDs.
- Preserve post-scoped migration: every selected post imports all valid legacy tag values together.
- Keep the raw legacy tag inventory summary as context while adding a concrete eligible-post selection surface.
- Reuse the existing normalization, upsert, review-status, admin-auth, logging, and revalidation boundaries.

**Non-Goals:**

- Do not clear `Post.tags` after import.
- Do not support raw-value-only partial import.
- Do not change public tag resolution or post editor behavior.
- Do not add schema changes or migrate other content types.

## Decisions

- Add selected-post migration actions instead of changing the current all-import action in place.
  Rationale: selected post IDs create an explicit admin decision boundary and avoid surprising imports. Alternative considered: `Import Next N Posts`, but it gives weaker control and makes the exact selected set depend on ordering.

- Keep eligibility defined as “post has non-empty legacy `Post.tags` and no shared `contentTags` assignments.”
  Rationale: this matches the current safe migration boundary and avoids mixed display states. Alternative considered: allow posts with existing assignments and merge in missing legacy values, but that needs a different reconciliation design.

- Show planned normalized tags per eligible post.
  Rationale: admins need to understand what each selected post will receive before import. Alternative considered: keep only the raw-value aggregate table, but that answers cleanup frequency rather than which posts will be migrated.

- Keep import post-scoped.
  Rationale: `resolvePostDisplayTags` prefers shared assignments when any exist, so a raw-value-only partial import could hide remaining legacy values. Alternative considered: temporarily display a union of legacy and shared tags, but that introduces duplicate handling and public behavior changes outside this slice.

- Extend existing helper shapes rather than introducing new tables.
  Rationale: no persistent migration queue is needed; the page can load eligible posts and submit selected IDs to server actions. The server remains the authority for eligibility at execution time.

## Risks / Trade-offs

- Eligible-post lists can become long -> Mitigation: keep the initial UI compact and consider search/pagination only if the real dataset demands it.
- A post can become ineligible between page load and import -> Mitigation: server actions SHALL re-check eligibility and skip no-longer-eligible posts safely.
- Selected import may make broad migration slower than all-import -> Mitigation: explicit control is the desired safety property; admins can still select all visible eligible posts.
- Existing legacy `Post.tags` remain after import -> Mitigation: document this as intentional data preservation; public display already prefers shared assignments.

## Migration Plan

No database migration is required. Deploying the slice adds selected dry-run/import controls and keeps the existing raw inventory context. Rollback is removing the selected-post UI and selected server actions while preserving existing `Post.tags`, `ContentTag`, and `PostsToContentTags` data.
