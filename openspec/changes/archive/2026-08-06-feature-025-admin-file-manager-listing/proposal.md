## Why

The admin files page currently shows basic file stats, upload form, and a simple table with 50 most recent tracked files. Administrators need better file listing controls to navigate, search, and filter files before adding preview or deletion capabilities in later features.

## What Changes

- Add client-side pagination to the file table using the proven `DataTable` pattern from videos-table.
- Add search by filename with client-side filtering.
- Add filters by purpose, visibility, and status.
- Enhance file metadata display: show custom ID, file key, owner name, visibility, status badges, and clickable download links.
- Keep existing file stats cards, upload form, and UploadThing usage points.
- Non-goals: file preview, file deletion, bulk actions, file editing, direct UploadThing deletion, per-user admin file views, file categories/tags, or external storage provider integration.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `files-admin`: Admin file management page gains pagination, search, filters, and enhanced file metadata display for better file list navigation.

## Impact

- Affected admin route: `/admin/files`.
- Affected admin components: `components/admin-pages` file listing table component.
- Affected data helpers: `app/_data/files.ts` may need extended file queries to include owner user data.
- Affected data model: uses existing `FileAsset` model, no schema changes.
- No schema migrations, new dependencies, or public route changes expected.
