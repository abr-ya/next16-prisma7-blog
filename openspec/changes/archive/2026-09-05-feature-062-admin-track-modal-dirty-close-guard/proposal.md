## Why

Admins should not lose partially entered track data or leave a newly uploaded GPX file behind just because they click outside the track form modal. This is especially important after UploadThing has already created a tracked `FileAsset`.

## What Changes

- Add a dirty-close guard to the `/admin/tracks` create/edit track modal.
- Prevent accidental outside-click dismissal when the form has unsaved edits or a newly uploaded/replaced GPX file.
- When an unsaved GPX file was uploaded in the modal, show a confirmation that clearly says the uploaded file will be removed if the admin discards the form.
- On confirmed discard, mark the unsaved newly uploaded GPX `FileAsset` for deletion before closing the modal.
- Preserve normal close behavior for pristine forms and successful saves.

Non-goals:

- No Prisma schema change.
- No new UploadThing upload route.
- No physical provider-file deletion worker in this slice; use the existing pending-delete lifecycle.
- No broad reusable dirty-form guard across every admin modal yet.
- No changes to public track pages or GPX download behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: Admin track create/edit modals protect unsaved form and uploaded GPX state from accidental dismissal.
- `files-admin`: Unsaved track GPX uploads discarded from the modal enter the existing file deletion lifecycle instead of remaining active orphan candidates.

## Impact

- Affected route: `/admin/tracks`.
- Affected UI: `components/admin-pages/tracks-admin-panel.tsx`, especially `TrackFormDialog`.
- Affected server actions/data: existing tracked file cleanup action or a narrowly scoped helper for uploaded GPX discard.
- Affected data model: existing `FileAsset.status` / `deletedAt`; no migration.
- Validation: OpenSpec strict validation, TypeScript, root lint, targeted ESLint for changed non-`app` files, local build, and manual checks for pristine close, dirty text close, uploaded-file discard, successful save, and edit-mode file replacement.
