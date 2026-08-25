## 1. Page Data And Composition

- [ ] 1.1 Load all shared content tag management items on `/admin/content-tags` alongside the existing needs-review tags and legacy migration inventory.
- [ ] 1.2 Compute inventory summary counts for total tags, active tags, needs-review tags, and post assignments from the loaded management items.
- [ ] 1.3 Preserve the existing `requireAdmin()` route boundary and existing migration/review data loading.

## 2. Inventory UI

- [ ] 2.1 Add a read-oriented admin inventory component for all shared content tags.
- [ ] 2.2 Show each tag's display name, slug, review status, total usage count, and grouped post usage.
- [ ] 2.3 Keep unsupported shared-tag content types absent from usage display instead of implying videos, docs, or files are migrated.
- [ ] 2.4 Keep broad rename, merge, delete, replace, and selected-assignment controls out of the inventory component.

## 3. Integration And Compatibility

- [ ] 3.1 Integrate the inventory section with the existing content tags admin page without removing the legacy migration panel.
- [ ] 3.2 Keep the existing needs-review cleanup workflow available and scoped to needs-review tags.
- [ ] 3.3 Update `openspec/backlog.md` so `feature-041-content-tags-admin-inventory-page` is marked `In Progress`.

## 4. Validation

- [ ] 4.1 Run `openspec validate feature-041-content-tags-admin-inventory-page --strict`.
- [ ] 4.2 Run `npm run tsc`.
- [ ] 4.3 Run `npm run lint`.
- [ ] 4.4 Ask the user to run `npm run build` locally before completion if implementation changes routing or user-facing admin behavior.
- [ ] 4.5 Manually verify `/admin/content-tags` in the browser with admin access: inventory counts, all-tag list, post usage, legacy migration panel, and needs-review workflow remain visible.
