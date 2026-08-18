## 1. OpenSpec And Backlog

- [x] 1.1 Promote the review workflow candidate to `feature-030-content-tags-review-status-workflow` in `openspec/backlog.md`.
- [x] 1.2 Add proposal, design, tasks, and content-tags spec delta.
- [x] 1.3 Run OpenSpec validation for `feature-030-content-tags-review-status-workflow`.

## 2. Schema And Data Helpers

- [x] 2.1 Add `ContentTagStatus` with `ACTIVE` and `NEEDS_REVIEW` values.
- [x] 2.2 Add `ContentTag.status` with default `ACTIVE` without changing existing tag assignments.
- [x] 2.3 Regenerate Prisma client through the existing project flow.
- [x] 2.4 Add admin-only content-tag helpers for listing tags by status and reading linked post usage.
- [x] 2.5 Add server-side mutations for mark reviewed, mark needs-review, remove selected assignments, replace selected assignments, and merge tag.

## 3. Admin Review UI

- [x] 3.1 Add an admin review surface for shared content tags that need review.
- [x] 3.2 Show each needs-review tag with linked post usage and enough context to decide cleanup.
- [x] 3.3 Add controls for approve, mark needs-review, remove from selected posts, replace, and merge.
- [x] 3.4 Keep all sensitive actions admin-gated on the server.

## 4. Public Compatibility

- [x] 4.1 Verify public blog listing/detail tag display includes both `ACTIVE` and `NEEDS_REVIEW` tags.
- [x] 4.2 Verify admin post create/edit assignment behavior continues to work for both statuses.
- [x] 4.3 Keep legacy `Post.tags` fallback unchanged.

## 5. Validation

- [x] 5.1 Run `npm run tsc`.
- [x] 5.2 Run `npm run lint` plus targeted ESLint for changed non-`app/` files if needed.
- [x] 5.3 Ask for local `npm run build` because this slice includes schema/admin/user-facing behavior.
