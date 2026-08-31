## 1. Server Action Readiness

- [x] 1.1 Review existing content tag assignment server actions for admin authorization, empty-selection handling, replacement target validation, deduplication, and path revalidation.
- [x] 1.2 Harden assignment mutation return messages or affected-tag/post refresh behavior if the inventory UI needs clearer success/error feedback.

## 2. Inventory Assignment UI

- [x] 2.1 Add per-tag selection state to the content tag inventory for linked post assignments.
- [x] 2.2 Render individual and select-all assignment controls for supported post usage without selecting assignments across unrelated tags.
- [x] 2.3 Add selected-assignment removal controls that are disabled without a selection and run only after app-styled confirmation.
- [x] 2.4 Add selected-assignment replacement controls with replacement tag input, disabled empty states, and app-styled confirmation before mutation.
- [x] 2.5 Clear affected tag selection and refresh inventory state after successful assignment removal or replacement.

## 3. Scope Preservation

- [x] 3.1 Keep existing tag-level rename, status, merge, and unused-delete actions working from the inventory.
- [x] 3.2 Keep the existing needs-review cleanup workflow and legacy post-tag migration workflow available on `/admin/content-tags`.
- [x] 3.3 Confirm public tag display behavior and public visibility rules are unchanged aside from normal revalidation after assignment changes.

## 4. Validation

- [x] 4.1 Run `npm run tsc`.
- [x] 4.2 Run `npm run lint`.
- [x] 4.3 Ask the user to run `npm run build` locally before completion because this is an admin UI/user-facing behavior change.
- [x] 4.4 Defer the manual `/admin/content-tags` browser check with real migrated tag data to the `content-tags-migration-verification-pass` backlog candidate.

## 5. Documentation

- [x] 5.1 Update `openspec/backlog.md` and completion/history notes as appropriate when implementation is finished.
