## Why

Feature-029 adopted shared post tags for new and re-saved posts, but posts that still only have legacy `Post.tags` remain outside `ContentTag` / `PostsToContentTags`. Admins need a controlled, inspectable way to review remaining legacy values, drop or normalize junk variants, and migrate approved values into shared tags without a silent one-shot bulk rewrite and without building the full tag-management console yet (`feature-031`).

## What Changes

- Add an admin **Tags** page (`/admin/tags`) as the long-term home for content-tag work in the admin shell.
- On that page, show a clear **placeholder** for future shared-tag management (list/rename/merge/usage) pointing at later `feature-031` work.
- On the same page, ship a **Legacy post-tag migration** section only: inventory of remaining legacy-only post tags, optional drop/rename policy, dry-run, apply, and result summary.
- Support a reviewed migration that creates shared `ContentTag` rows and `PostsToContentTags` assignments for approved legacy values, using existing slug/name normalization.
- Keep apply **idempotent**: posts that already have content-tag assignments are skipped; re-runs only process remaining legacy-only posts.
- Dual-write migrated posts' `Post.tags` to the migrated display names so dual-read stays consistent after migration.
- Record an auditable summary of each dry-run/apply via the existing admin log pathway.
- Link **Tags** from the admin sidebar (admin-gated), reusing existing sidebar patterns.

### Non-goals

- No bulk auto-migration on app boot or deploy.
- No full content-wide admin tag manager, rename/merge table for existing shared tags, or usage dashboard (`feature-031` on the same page later).
- No migration of `VideoTag` / video workflows.
- No removal of the `Post.tags` column in this slice.
- No public tag filtering or tag pages.
- No forced app-styled confirm dialogs (can keep a native confirm until `feature-038`).
- No multi-stage batch UI for huge catalogs (one apply over all eligible posts is enough at current scale).

## Capabilities

### New Capabilities

- `content-tags-legacy-post-migration`: Rules for the admin Tags page shell, migration section, inventory, review policies (drop/rename), dry-run, apply, idempotency, dual-write after migration, and audit summary for legacy post string tags.

### Modified Capabilities

- `content-tags`: Mark legacy post string migration as an implemented admin-controlled flow (no longer only “planned separately” without runtime).
- `content-tags-post-adoption`: Update the boundary that bulk migration was deferred; migration of remaining legacy-only posts becomes an explicit admin action on the Tags page.

## Impact

- **Admin routes:** new `/admin/tags` page; sidebar entry **Tags**.
- **Data:** reads/writes `Post`, `ContentTag`, `PostsToContentTags`; does not change video models.
- **Helpers:** extend or pair with `lib/content-tags.ts` + new server helpers under `app/_data`.
- **Auth:** admin-role gated (same spirit as other sensitive admin ops), not only “any authenticated creator”.
- **Logs:** migration dry-run/apply summary via existing log helpers.
- **Follow-up:** `feature-031` fills the Tags page management section after one-time legacy cleanup.
