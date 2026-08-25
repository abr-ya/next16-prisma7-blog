## Context

The content tags admin route currently combines the legacy post-tag migration panel with a review queue that only loads `NEEDS_REVIEW` tags. Feature 034 already added the admin-only management data helper for all shared tags, including status, slug, total post usage, and grouped post usage. This slice should expose that data in the admin UI without expanding the mutation surface yet.

## Goals / Non-Goals

**Goals:**

- Reuse the existing admin route `/admin/content-tags` and existing server-side admin boundary.
- Load all shared content tags through the management data helper and present them as a read-oriented inventory.
- Preserve the existing migration and needs-review cleanup surfaces on the same page.
- Keep the first UI slice small enough to validate layout, data shape, and admin usefulness before adding broader actions.

**Non-Goals:**

- No Prisma schema changes, migrations, or data backfills.
- No new server actions are expected.
- No broad all-tag rename, merge, delete, remove, or replace controls.
- No shared-tag adoption for videos, docs, files, or other non-post content.
- No public tag filtering or public display change.

## Decisions

- Use `/admin/content-tags` as the inventory page instead of adding a separate route.
  Rationale: the page already owns shared content tag migration and review, so a separate route would fragment the admin workflow. Alternative considered: create `/admin/content-tags/inventory`, but that adds navigation and state duplication before the management UI proves its shape.

- Keep data loading in the server page.
  Rationale: `getAdminContentTagManagementItems` already calls `requireAdmin()` and returns the complete read model needed for this slice. The page can load management items, needs-review items, and legacy inventory together with `Promise.all`. Alternative considered: add a client fetch endpoint, but this read-only admin view does not need client-side data fetching yet.

- Add a dedicated inventory component instead of folding all-tag display into `ContentTagsReview`.
  Rationale: `ContentTagsReview` is action-oriented and currently scoped to cleanup items. A separate component keeps this slice read-oriented and avoids accidentally generalizing destructive controls to every tag. Alternative considered: extend `ContentTagsReview` to accept all tags, but that blurs the boundary planned for feature 042 and feature 043.

- Treat posts as the only supported shared-tag usage group for now.
  Rationale: posts are the current runtime adopter of `ContentTag`; videos still use `VideoTag`, and docs/files have not adopted shared tags. The UI should make unsupported content types absent instead of implying migration that has not happened.

## Risks / Trade-offs

- Larger admin page could become visually dense -> Mitigation: use compact summary stats and a scannable inventory layout, with post usage grouped per tag.
- Duplicate information with the review queue could confuse admins -> Mitigation: clearly separate the broad inventory from the existing needs-review workflow and keep action controls in the review workflow only.
- Future action slices may need different component boundaries -> Mitigation: keep the inventory component focused on display data and avoid embedding management form state in this slice.
- Admin-only data exposure must remain protected -> Mitigation: preserve `requireAdmin()` in the route and rely on the existing management helper's server-side admin check.

## Migration Plan

No data migration is required. Deployment is a UI-only admin change that reads existing `ContentTag` and `PostsToContentTags` data. Rollback is removing the inventory component usage and returning `/admin/content-tags` to the migration plus needs-review workflow.
