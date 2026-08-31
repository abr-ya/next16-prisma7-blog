## 1. Server Action Readiness

- [ ] 1.1 Review existing content tag assignment server actions for admin authorization, empty-selection handling, replacement target validation, deduplication, and path revalidation.
- [ ] 1.2 Harden assignment mutation return messages or affected-tag/post refresh behavior if the inventory UI needs clearer success/error feedback.

## 2. Inventory Assignment UI

- [ ] 2.1 Add per-tag selection state to the content tag inventory for linked post assignments.
- [ ] 2.2 Render individual and select-all assignment controls for supported post usage without selecting assignments across unrelated tags.
- [ ] 2.3 Add selected-assignment removal controls that are disabled without a selection and run only after app-styled confirmation.
- [ ] 2.4 Add selected-assignment replacement controls with replacement tag input, disabled empty states, and app-styled confirmation before mutation.
- [ ] 2.5 Clear affected tag selection and refresh inventory state after successful assignment removal or replacement.

## 3. Scope Preservation

- [ ] 3.1 Keep existing tag-level rename, status, merge, and unused-delete actions working from the inventory.
- [ ] 3.2 Keep the existing needs-review cleanup workflow and legacy post-tag migration workflow available on `/admin/content-tags`.
- [ ] 3.3 Confirm public tag display behavior and public visibility rules are unchanged aside from normal revalidation after assignment changes.

## 4. Validation

- [ ] 4.1 Run `npm run tsc`.
- [ ] 4.2 Run `npm run lint`.
- [ ] 4.3 Ask the user to run `npm run build` locally before completion because this is an admin UI/user-facing behavior change.
- [ ] 4.4 Manually check `/admin/content-tags` in a browser with tags that have multiple post assignments: select, clear, remove selected, replace selected, and cancel confirmations.

## 5. Documentation

- [ ] 5.1 Update `openspec/backlog.md` and completion/history notes as appropriate when implementation is finished.
