## Why

Admins can already upload, search, filter, and download tracked file assets from `/admin/files`, but they cannot quickly inspect what a file contains before downloading it. This change adds an admin-side preview workflow for common safe file types so the file manager becomes more useful for review and cleanup decisions.

## What Changes

- Add preview controls to the admin file list for previewable tracked `FileAsset` records.
- Support image, PDF, and text-like previews using the existing app-owned file download route as the source.
- Show unsupported file types as non-previewable while preserving the existing download link.
- Keep preview access inside the authenticated admin file manager surface.

### Non-goals

- No file deletion, detach, or cleanup workflow.
- No public preview page or public sharing behavior.
- No UploadThing storage policy, provider URL, or signed URL changes.
- No legacy image uploader migration to `FileAsset`.
- No database schema change.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `files-admin`: add admin file preview behavior for common file types on `/admin/files`.

## Impact

- Affected route: `/admin/files`.
- Affected data model: existing `FileAsset` records only; no schema changes.
- Affected admin surface: file manager table and preview UI.
- Affected public surface: none.
- Dependencies: no new dependencies expected.
