## Why

Admins need a first outdoor photo foundation so image files can be uploaded, tracked as first-party `FileAsset` records, and managed as `Photo` content before public galleries, EXIF extraction, hike associations, or map markers are added.

## What Changes

- Add the first `Photo` data model for outdoor photos with title, optional description, publication status, owner, timestamps, and an ordered set of image file assets.
- Add a dedicated authenticated UploadThing route for outdoor photo images that records first-party file assets with a photo-specific purpose and supports uploading 1-3 image files per attempt.
- Add admin data actions and helpers for listing, creating, editing, and deleting photos while preserving file assets unless a later cleanup flow handles them.
- Add `/admin/photos` with create/edit/list management and navigation access for authenticated admins.
- Keep photo files private by default until a later public gallery slice defines public visibility and rendering rules.

## Non-goals

- No public `/photos` listing or detail pages.
- No EXIF extraction, GPS parsing, camera metadata, or captured-at inference.
- No hike/photo association, manual photo ordering across hikes, albums, or map markers.
- No provider-file deletion or cleanup workflow beyond preserving existing `FileAsset` lifecycle boundaries.

## Capabilities

### New Capabilities

- `outdoor-photos`: Stores and manages first-party outdoor photo records and their image file assets from admin surfaces.

### Modified Capabilities

- `file-sharing-structure`: Adds a dedicated tracked UploadThing route and file purpose for outdoor photo image uploads.

## Impact

- Data model: add `Photo`, photo/file attachment structure, `PhotoStatus`, and an outdoor photo image `FileAssetPurpose` value.
- Uploads: add a dedicated UploadThing route for authenticated 1-3 image uploads with size/count limits and quota checks.
- Admin routes: add `/admin/photos` and admin navigation entry.
- Server modules: add photo validation, data helpers, and server actions under the existing admin/outdoor patterns.
- Validation: requires Prisma migration/generation, TypeScript, lint, and build checks because this slice changes schema, routes, uploads, and admin UI.
