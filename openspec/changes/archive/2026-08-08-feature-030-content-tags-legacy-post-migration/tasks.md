## 1. Inventory and policy helpers

- [x] 1.1 Add shared types for legacy migration policy (`drop`, `renameBySlug`) and migration summary counts in `lib/` or next to data helpers.
- [x] 1.2 Implement a query for legacy-only posts (non-empty `Post.tags`, zero `contentTags` assignments) with raw-value frequency stats and suggested slugs.
- [x] 1.3 Implement pure planning helper: given a post's `Post.tags` + policy → planned final `{ name, slug }[]` (normalize, drop, rename, dedupe).
- [x] 1.4 Implement dry-run aggregator that returns counts and a compact plan without writing `ContentTag` / `PostsToContentTags`.

## 2. Apply path and audit

- [x] 2.1 Implement apply migration: for each eligible post, upsert planned content tags, create assignments, dual-write sorted names into `Post.tags` (transaction per post or equivalent safe batching).
- [x] 2.2 Skip posts that already have assignments; make re-apply idempotent for remaining legacy-only posts.
- [x] 2.3 Gate inventory, dry-run, and apply with admin role helpers; refuse non-admin callers.
- [x] 2.4 Write `createLogEvent` (or project equivalent) summaries for dry-run and apply outcomes.

## 3. Admin Tags page

- [x] 3.1 Add `/admin/tags` route and page shell (breadcrumbs, title Tags).
- [x] 3.2 Add **Shared tags** section placeholder explaining that list/rename/merge/usage tools come later (`feature-031`).
- [x] 3.3 Add **Legacy post-tag migration** section: inventory summary, unique raw-tag table, optional drop/rename policy input.
- [x] 3.4 Wire Dry run and Apply actions with result summary panel; confirm before apply.
- [x] 3.5 Add a **Tags** sidebar link (admin-visible like other sensitive admin items) targeting `/admin/tags`.

## 4. Validation and bookkeeping

- [x] 4.1 Run `npm run tsc` and fix type errors.
- [x] 4.2 Run lint on changed paths (root `app/` lint + targeted ESLint for `components`/`lib` as needed).
- [x] 4.3 Ask for local `npm run build` after route changes; no Prisma column drops.
- [x] 4.4 Manually verify: Tags page loads, placeholder visible, inventory shows legacy-only posts, dry-run does not create assignments, apply migrates and dual-read uses assignments, second apply is no-op for migrated posts, video tags unchanged.
- [x] 4.5 Set `feature-030` backlog status to `In Progress` during implementation and `Done` after archive (currently In Progress).
