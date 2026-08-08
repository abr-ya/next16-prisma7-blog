## Why

Administrators need a safe way to remove tracked files from the active file manager view without immediately destroying provider storage. The existing `FileAsset` lifecycle already includes `DETACHED`, `PENDING_DELETE`, and `DELETED`, so this slice should expose the first intentional admin deletion workflow using those states.

## What Changes

- Add deletion controls to `/admin/files` rows for tracked `FileAsset` records.
- Transition an active file to a cleanup state instead of physically deleting the UploadThing object in this slice.
- Preserve status filtering so deleted or cleanup-pending records remain auditable when administrators choose to view them.
- Prevent repeated deletion actions on files that are already detached, pending delete, or deleted.
- Keep downloads/previews available only according to existing active-file access rules.

Non-goals:

- No UploadThing provider delete API call.
- No background cleanup job, retention policy, restore workflow, or hard-delete workflow.
- No bulk deletion controls.
- No deletion for legacy URL-only image uploads that are not represented by `FileAsset`.
- No new file attachment/reference detection beyond the current tracked file data.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `files-admin`: Add safe admin file deletion controls and lifecycle-state behavior to the existing admin file manager.

## Impact

- Affected routes and surfaces: `/admin/files`.
- Affected data model: existing `FileAsset.status` and `FileAsset.deletedAt` fields; no schema migration expected.
- Affected code areas: `app/_data/files.ts`, `components/admin-pages/files-table.tsx`, and any small admin action/component needed to submit the lifecycle transition.
- Public surface: no new public UI; public/app-owned download behavior should continue to reject non-active files.
- Dependencies: no new runtime dependency expected.
