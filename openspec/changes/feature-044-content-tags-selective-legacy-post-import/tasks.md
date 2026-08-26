## 1. Planning And Data Shape

- [ ] 1.1 Review current legacy migration helpers, post form tag behavior, and public display fallback before editing implementation.
- [ ] 1.2 Extend legacy migration planning types so eligible post rows include post identity, raw legacy values, planned normalized tags, skipped values, and enough summary data for selected dry-run/import.

## 2. Server Actions And Safety

- [ ] 2.1 Add server-side loading for eligible legacy-only posts while preserving the existing raw-value inventory summary.
- [ ] 2.2 Add selected-post dry-run behavior that rejects empty selections, re-checks post eligibility, and summarizes only selected eligible posts.
- [ ] 2.3 Add selected-post import behavior that rejects empty selections, re-checks post eligibility, imports all valid legacy tags per selected post, skips no-longer-eligible posts safely, logs the operation, and revalidates affected admin/public paths.
- [ ] 2.4 Keep the existing broad import behavior available only if still needed by current UI, or replace it with selected-post import without leaving unused admin controls.

## 3. Admin UI

- [ ] 3.1 Update the `Legacy Post Tags` panel so it shows selectable eligible posts alongside the raw-value inventory summary.
- [ ] 3.2 Add checkbox selection controls, selected count feedback, clear/select-all-visible controls, and disabled states when no eligible posts exist.
- [ ] 3.3 Wire `Dry Run Selected` to the selected-post dry-run summary and show success/error feedback.
- [ ] 3.4 Wire `Import Selected` through an app-styled confirmation dialog and show selected import results.
- [ ] 3.5 Keep each selected post migration whole-post scoped; do not add raw-value-only partial import controls.

## 4. Integration Boundaries

- [ ] 4.1 Keep `/admin/content-tags` loading shared tag inventory, legacy migration data, and needs-review data through the existing server page.
- [ ] 4.2 Preserve public tag display behavior: shared assignments continue to win over legacy fallback once a post is imported.
- [ ] 4.3 Preserve existing legacy `Post.tags` values; do not clear or rewrite legacy arrays in this slice.

## 5. Validation

- [ ] 5.1 Run `openspec validate feature-044-content-tags-selective-legacy-post-import --strict`.
- [ ] 5.2 Run `npm run tsc`.
- [ ] 5.3 Run `npm run lint`.
- [ ] 5.4 Run targeted ESLint for any changed files under `components`, `lib`, or other non-`app` folders.
- [ ] 5.5 Ask the user to run `npm run build` locally before completion because this changes user-facing admin behavior.
- [ ] 5.6 Manually verify `/admin/content-tags` with admin access: eligible post list, selection and clearing, selected dry-run, selected import confirmation/cancel, empty selection rejection, no-longer-eligible skip behavior where practical, raw inventory summary, shared tag inventory, and needs-review workflow.
