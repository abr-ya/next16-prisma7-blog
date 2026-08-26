## Context

The `/admin/content-tags` route currently renders three related surfaces: legacy post-tag migration, read-oriented all-tag inventory, and the needs-review cleanup workflow. Feature 034 already added server actions for renaming tags, changing status, merging tags, removing/replacing selected assignments, and deleting unused tags. Feature 041 exposed the all-tag read model through `ContentTagsInventory`, but intentionally left broad mutation controls for later.

## Goals / Non-Goals

**Goals:**

- Add focused tag-level controls to the all-tag inventory for every shared `ContentTag`.
- Reuse the existing server actions and admin-only authorization checks.
- Keep destructive or sensitive actions behind reusable app-styled confirmation dialogs.
- Preserve existing page composition: legacy migration, inventory, and needs-review workflow remain on `/admin/content-tags`.

**Non-Goals:**

- Do not add selected assignment removal or replacement controls to the all-tag inventory; that is the next assignment-action slice.
- Do not change `ContentTag`, `PostsToContentTags`, or Prisma migrations.
- Do not migrate videos, docs, or files onto shared content tags.
- Do not change public tag display, public tag filtering, or public visibility rules.

## Decisions

- Keep `/admin/content-tags` as the single shared tag management route.
  Rationale: admins already use this page for migration, inventory, and needs-review cleanup. A separate route would split closely related decisions and duplicate navigation. Alternative considered: add `/admin/content-tags/manage`, but the current page is still small enough to hold the focused controls.

- Extend the inventory component into a client action surface.
  Rationale: rename/status/merge/delete require local dialog state, form input, pending states, toast feedback, and `router.refresh()`. The page can remain a server component that loads data once and passes it down. Alternative considered: add per-action form components, but shared state around dialogs and pending keys is simpler in one inventory action component.

- Reuse existing content tag server actions.
  Rationale: `app/_actions/content-tags.ts` already normalizes names, checks merge/delete boundaries, revalidates admin and public paths, and calls `requireAdmin()`. This slice should expose those actions rather than create another API layer. Alternative considered: introduce route handlers for tag management, but server actions match the current admin pattern.

- Treat merge and delete as confirmation-required actions.
  Rationale: merge moves assignments and delete removes records, so the admin should explicitly confirm intent. Rename and status changes can use normal form submission with clear error/success toasts. Alternative considered: confirm all actions, but that would make routine status cleanup unnecessarily heavy.

- Keep inventory tag actions separate from selected assignment actions.
  Rationale: feature 043 is planned for selecting linked post assignments, removing selected assignments, and replacing selected assignments. This slice may show post usage for decision context, but it should not add new checkbox/bulk controls to the all-tag inventory.

## Risks / Trade-offs

- Inventory table can become crowded after adding controls -> Mitigation: group tag-level commands in compact row actions or dialogs and keep usage content scannable.
- Rename/merge can affect public post tag labels after revalidation -> Mitigation: reuse existing server action revalidation and make the admin action copy explicit.
- Used-tag delete attempts may still be possible through the UI -> Mitigation: disable or warn when usage count is non-zero and rely on the server action as the final guard.
- Existing needs-review workflow duplicates some status and merge capabilities -> Mitigation: keep it available for assignment cleanup while the inventory owns all-tag tag-level actions.

## Migration Plan

No database migration is required. Deploying the slice adds admin UI around existing server actions. Rollback is removing the new inventory action UI and leaving the existing migration, inventory read model, and needs-review workflow intact.
