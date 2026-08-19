## 1. Data And Actions

- [x] 1.1 Add a management-oriented content tag query that returns all shared tags with status, slug, total usage count, and grouped post usage.
- [x] 1.2 Add a rename server action that normalizes name/slug, preserves assignments, rejects slug collisions, and revalidates affected admin/public paths.
- [x] 1.3 Add an unused-tag delete server action that requires admin access and rejects deletion while supported assignments still exist.
- [x] 1.4 Review existing status, merge, replace, and assignment-removal actions for management-surface reuse and adjust messages/revalidation where needed.

## 2. Admin UI

- [ ] 2.1 Replace the review-only `/admin/content-tags` management section with an all-tags management component while keeping the legacy import panel.
- [ ] 2.2 Show tag identity, status, usage totals, and post usage details with enough post identity/status for cleanup decisions.
- [ ] 2.3 Add controls for rename, status changes, selected assignment removal/replacement, merge, and unused delete.
- [ ] 2.4 Use the existing app confirmation dialog pattern for destructive or sensitive operations such as merge, detach, rename, and delete.
- [ ] 2.5 Preserve clear empty states for no tags, no needs-review tags, and tags with no post assignments.

## 3. Scope And Compatibility

- [ ] 3.1 Keep public blog tag display, public tag links, and legacy `Post.tags` fallback behavior unchanged.
- [ ] 3.2 Keep video tags on `VideoTag` and `VideosToVideoTags`; do not present them as shared content-tag usage.
- [x] 3.3 Ensure all new admin mutations call `requireAdmin()` server-side.

## 4. Documentation And Tracking

- [ ] 4.1 Update `openspec/backlog.md` to mark `content-tags-admin-management` as `In Progress` with the assigned feature name.
- [ ] 4.2 Update implementation notes or feature docs if the existing content-tag docs track admin tag cleanup behavior.

## 5. Validation

- [ ] 5.1 Run `openspec validate feature-034-content-tags-admin-management --strict` and fix any planning or spec issues.
- [ ] 5.2 Run `npm run tsc`.
- [ ] 5.3 Run `npm run lint` and targeted ESLint for changed non-`app` files if needed.
- [ ] 5.4 Ask the user to run `npm run build` locally and paste the result before considering the user-facing admin route complete.
- [ ] 5.5 Manually check `/admin/content-tags` in a browser for layout, dialogs, mutation feedback, and no text overlap on desktop and mobile widths.
