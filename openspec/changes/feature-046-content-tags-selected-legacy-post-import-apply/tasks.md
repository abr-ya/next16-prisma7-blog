## 1. Write Path Review

- [x] 1.1 Review the shipped selected dry-run implementation from archived `feature-044-content-tags-selective-legacy-post-import` and confirm the existing broad all-post import controls/actions can be replaced cleanly by selected import.

## 2. Selected Import Server Path

- [x] 2.1 Add selected-post import behavior that rejects empty selections, re-checks eligibility, imports all valid legacy tags per selected post, skips no-longer-eligible posts, and remains idempotent.

## 3. Tag And Assignment Writes

- [x] 3.1 Ensure imports create or reuse unique `ContentTag` records by slug, mark imported legacy tags as `NEEDS_REVIEW`, and create `PostsToContentTags` assignments without duplicates.

## 4. Audit And Revalidation

- [x] 4.1 Log the selected import operation with summary data and revalidate `/admin/content-tags` plus affected public blog paths after import.

## 5. Import UI

- [x] 5.1 Add `Import Selected` to the `Legacy Post Tags` panel with an app-styled confirmation dialog and selected import result feedback, replacing the broad all-post import control.

## 6. Boundaries

- [x] 6.1 Preserve post-scoped imports, public tag display fallback behavior, legacy `Post.tags` values, and the existing needs-review cleanup workflow.

## 7. Validation

- [x] 7.1 Run OpenSpec, TypeScript, lint, targeted ESLint for changed non-`app` files, request local `npm run build`, and manually verify the selected import workflow on `/admin/content-tags`.
