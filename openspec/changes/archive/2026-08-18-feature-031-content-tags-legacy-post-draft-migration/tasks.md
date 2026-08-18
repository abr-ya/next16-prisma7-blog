## 1. OpenSpec And Backlog

- [x] 1.1 Promote `content-tags-legacy-post-draft-migration` to `feature-031-content-tags-legacy-post-draft-migration` in `openspec/backlog.md`.
- [x] 1.2 Add proposal, design, tasks, and content-tags/content-tags-post-adoption spec deltas.
- [x] 1.3 Run `openspec validate feature-031-content-tags-legacy-post-draft-migration --strict`.

## 2. Donor Code Import

- [x] 2.1 Pull forward selected donor helpers from `feature-030-content-tags-legacy-post-migration`.
- [x] 2.2 Avoid old donor OpenSpec artifacts, route/sidebar changes, package script changes, and unrelated formatter-only diffs.
- [x] 2.3 Review imported files against current `master` types, route names, and review-status workflow.

## 3. Server Migration Behavior

- [x] 3.1 Add admin-only inventory for posts with non-empty `Post.tags` and no shared content-tag assignments.
- [x] 3.2 Add dry-run summary for eligible posts, planned assignments, tags to create/reuse, and skipped values.
- [x] 3.3 Add apply action that creates/reuses shared tags, marks imported tags `NEEDS_REVIEW`, and creates post/tag assignments idempotently.
- [x] 3.4 Preserve legacy `Post.tags` fallback and avoid clearing or rewriting legacy values in this slice.
- [x] 3.5 Add logging/revalidation consistent with existing admin data helpers.

## 4. Admin UI

- [x] 4.1 Integrate a legacy migration panel into `/admin/content-tags`.
- [x] 4.2 Show inventory and dry-run/apply summary clearly enough for admin review.
- [x] 4.3 Keep apply gated behind admin-only server behavior and a deliberate confirmation.
- [x] 4.4 Ensure imported tags become visible in the existing needs-review queue after apply.

## 5. Validation

- [x] 5.1 Run `npm run tsc`.
- [x] 5.2 Run `npm run lint` plus targeted ESLint for changed non-`app/` files if needed.
- [x] 5.3 Ask the user to run `npm run build` locally because this slice touches admin UI and Prisma-backed route behavior.

Validation notes:

- `npm run build` passed locally with Next.js 16.1.1/Turbopack.
