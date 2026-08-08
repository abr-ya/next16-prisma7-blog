## 1. Data Boundary

- [ ] 1.1 Add an admin-authorized server mutation for marking an active `FileAsset` as `PENDING_DELETE` and setting `deletedAt`.
- [ ] 1.2 Ensure the mutation rejects or no-ops non-active file assets without changing their lifecycle timestamp.
- [ ] 1.3 Revalidate `/admin/files` after a successful lifecycle transition.

## 2. Admin File Manager UI

- [ ] 2.1 Update the file asset listing data so the file manager can audit non-active records through status filters while keeping active files as the default view.
- [ ] 2.2 Add a row-level delete action for active files with confirmation copy that does not promise provider deletion.
- [ ] 2.3 Disable delete and preview actions for non-active files.
- [ ] 2.4 Preserve existing search, filters, sorting, pagination, stats, upload form, download links, and usage-point display.

## 3. Validation

- [ ] 3.1 Run targeted ESLint for changed non-app files.
- [ ] 3.2 Run `npm run tsc`.
- [ ] 3.3 Run `npm run lint`.
- [ ] 3.4 Ask for local `npm run build` validation if routing or runtime behavior needs sandbox-independent confirmation.
- [ ] 3.5 Manually verify `/admin/files`: active file delete flow, default active filtering, pending-delete visibility via status filter, and disabled non-active actions.
