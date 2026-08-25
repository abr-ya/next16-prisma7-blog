## 1. Planning And Scope

- [ ] 1.1 Update `openspec/backlog.md` so `feature-042-content-tags-admin-tag-actions` is marked `In Progress` when implementation starts.
- [ ] 1.2 Review the existing content tag server actions and inventory data model against the accepted spec before editing UI.

## 2. Inventory Tag Actions

- [ ] 2.1 Convert or extend the content tags inventory UI so each listed tag can open tag-level action controls without losing the existing summary and usage display.
- [ ] 2.2 Add rename controls that submit a normalized replacement name, show success/error feedback, refresh the admin page, and preserve assignments.
- [ ] 2.3 Add status controls for marking a tag active or needs-review, showing pending state and feedback for each action.
- [ ] 2.4 Add merge controls that accept a target tag name and run behind an app-styled confirmation dialog.
- [ ] 2.5 Add unused-tag delete controls that run behind an app-styled confirmation dialog and clearly handle the used-tag rejection case.

## 3. Page Integration

- [ ] 3.1 Keep `/admin/content-tags` loading all inventory tags, needs-review tags, and legacy migration data through the existing server component page.
- [ ] 3.2 Preserve the legacy post-tag migration panel and the existing needs-review cleanup workflow.
- [ ] 3.3 Keep selected assignment removal/replacement out of the all-tag inventory UI for the follow-up assignment-actions slice.

## 4. Validation

- [ ] 4.1 Run `openspec validate feature-042-content-tags-admin-tag-actions --strict`.
- [ ] 4.2 Run `npm run tsc`.
- [ ] 4.3 Run `npm run lint`.
- [ ] 4.4 Ask the user to run `npm run build` locally before completion because this changes user-facing admin behavior.
- [ ] 4.5 Manually verify `/admin/content-tags` with admin access: rename, status changes, merge confirmation/cancel, unused delete confirmation/cancel, used delete rejection, inventory refresh, legacy migration panel, and needs-review workflow.
