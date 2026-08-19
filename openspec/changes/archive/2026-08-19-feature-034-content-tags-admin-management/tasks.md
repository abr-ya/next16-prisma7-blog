## 1. Data And Actions

- [x] 1.1 Add a management-oriented content tag query that returns all shared tags with status, slug, total usage count, and grouped post usage.
- [x] 1.2 Add a rename server action that normalizes name/slug, preserves assignments, rejects slug collisions, and revalidates affected admin/public paths.
- [x] 1.3 Add an unused-tag delete server action that requires admin access and rejects deletion while supported assignments still exist.
- [x] 1.4 Review existing status, merge, replace, and assignment-removal actions for management-surface reuse and adjust messages/revalidation where needed.

## 2. Scope And Compatibility

- [x] 2.1 Keep public blog tag display, public tag links, and legacy `Post.tags` fallback behavior unchanged.
- [x] 2.2 Keep video tags on `VideoTag` and `VideosToVideoTags`; do not present them as shared content-tag usage.
- [x] 2.3 Ensure all new admin mutations call `requireAdmin()` server-side.

## 3. Documentation And Tracking

- [x] 3.1 Update `openspec/backlog.md` to keep this backend foundation feature `In Progress` and add a separate UI follow-up candidate.
- [x] 3.2 Update implementation notes or feature docs if the existing content-tag docs track admin tag cleanup behavior.

## 4. Validation

- [x] 4.1 Run `openspec validate feature-034-content-tags-admin-management --strict` and fix any planning or spec issues.
- [x] 4.2 Run `npm run tsc`.
- [x] 4.3 Run `npm run lint`.
