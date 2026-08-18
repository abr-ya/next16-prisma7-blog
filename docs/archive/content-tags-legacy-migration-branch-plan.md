# Content Tags Legacy Migration Branch Plan

## Context

The current branch `feature-030-content-tags-legacy-post-migration` contains useful draft work for migrating legacy `Post.tags` values into shared content tags.

It cannot be merged into `master` as-is because `master` has already merged a different `feature-030`: `feature-030-content-tags-review-status-workflow`. The current `master` also reorganized the OpenSpec backlog/history flow, and it now expects legacy post tags to be imported as `NEEDS_REVIEW` shared tags so the existing admin review workflow can handle cleanup.

## Working Rule

Git branch and checkout commands are written for the user to run manually.

Codex may inspect files, prepare plans, apply code edits after the user is on the intended branch, and validate with non-destructive commands. Codex should not switch branches, create branches, merge, rebase, cherry-pick, or commit unless the user explicitly asks for that specific git action.

## Recommended Branch Flow

User-run git commands:

```bash
git switch master
git pull
git switch -c feature-031-content-tags-legacy-post-draft-migration
```

If `feature-031` is no longer the lowest unused feature number, use the next valid number from `openspec/backlog.md` and `openspec/feature-history.md`.

## Source Branch To Reuse

Reuse selected work from:

```text
feature-030-content-tags-legacy-post-migration
```

Treat this branch as a code donor, not as the base branch.

## Useful Pieces To Pull Forward

- `lib/content-tags-legacy-migration.ts`
- `app/_data/content-tags-legacy-migration.ts`
- `components/admin-pages/tags-legacy-migration-panel.tsx`
- `components/ui/textarea.tsx`, only if the new UI still needs it

Potential user-run restore commands after creating the new branch:

```bash
git restore --source=feature-030-content-tags-legacy-post-migration -- lib/content-tags-legacy-migration.ts
git restore --source=feature-030-content-tags-legacy-post-migration -- app/_data/content-tags-legacy-migration.ts
git restore --source=feature-030-content-tags-legacy-post-migration -- components/admin-pages/tags-legacy-migration-panel.tsx
git restore --source=feature-030-content-tags-legacy-post-migration -- components/ui/textarea.tsx
```

Codex should review and adapt these files before considering them ready.

## Pieces Not To Pull Forward

- Old `openspec/changes/**` artifacts from the donor branch.
- Old `openspec/backlog.md`, `openspec/feature-history.md`, or main spec edits from the donor branch.
- `app/admin/tags/page.tsx`, unless there is a deliberate decision to keep a separate route.
- Sidebar changes that add `/admin/tags`; the current `master` already has `/admin/content-tags`.
- Incidental formatter-only changes in unrelated files.
- `package.json` script changes unless they are explicitly needed.

## Target Product Direction

Build the legacy migration as the next OpenSpec feature on top of current `master`.

The current backlog candidate is:

```text
content-tags-legacy-post-draft-migration
```

The new feature should import legacy `Post.tags` values into shared `ContentTag` records and `PostsToContentTags` assignments with `ContentTag.status = NEEDS_REVIEW`.

Public behavior must remain unchanged: imported tags should still display publicly, and cleanup should happen through the existing `/admin/content-tags` review workflow.

## Implementation Shape

1. Promote the backlog candidate into a new numbered OpenSpec change.
2. Create proposal/design/tasks/spec delta for the new feature.
3. Pull forward the donor branch helper files selectively.
4. Adapt the migration planning helpers to preserve the useful inventory and dry-run summary behavior.
5. Change apply behavior so newly created/imported legacy tags are marked `NEEDS_REVIEW`.
6. Prefer integrating the migration panel into `/admin/content-tags` instead of creating a parallel `/admin/tags` route.
7. Keep legacy `Post.tags` fallback readable until each post receives shared assignments.
8. Avoid treating imported tags as immediately canonical; use the review workflow for approve, replace, remove, and merge decisions.

## Validation

Expected checks:

```bash
openspec validate <new-feature-name> --strict
npm run tsc
npm run lint
```

For changed files outside `app/`, run targeted ESLint if needed, for example:

```bash
npx eslint components/admin-pages/tags-legacy-migration-panel.tsx app/_data/content-tags-legacy-migration.ts lib/content-tags-legacy-migration.ts --quiet
```

Ask the user to run `npm run build` locally before completion because this feature touches admin UI, server data behavior, and Prisma-backed routes.

## Current Decision

Proceed by starting a clean new feature branch from updated `master`, then transplant only the useful donor code and adapt it to the review-status workflow already merged in `master`.
