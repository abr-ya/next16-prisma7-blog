## Why

Admins need a minimal first-party file foundation before the project adds archives, downloadable files, video assets, or richer uploaded media. This change starts with the backend-owned file model, a dedicated UploadThing file route, and a tiny admin upload surface so later slices can build on real stored file records instead of one-off URL fields.

## What Changes

- Add a first `FileAsset` foundation for first-party uploaded files.
- Add a dedicated UploadThing route for general files, separate from the existing image uploader.
- Add a minimal admin files page with a simple upload form and the current user's file count.
- Define how admin-managed files should be grouped by purpose, ownership, visibility, and future content attachment.
- Define retention, quota, and cleanup expectations at the backend boundary.
- Document how existing UploadThing-backed image usage fits into the broader file-sharing model.

Non-goals:

- No public download route implementation in this slice.
- No full file manager UI, bulk file operations, deletion workflow, virus scanning, or restore workflow in this slice.
- No role system or site-wide UploadThing settings page in this slice.
- No change to current blog post images, markdown doc preview images, video thumbnails, or rich-text image behavior.

## Capabilities

### New Capabilities

- `file-sharing-structure`: Defines and introduces the minimal first-party file foundation for admin uploads, stored file records, user file counts, future content attachments, public downloads, quotas, and file lifecycle boundaries.

### Modified Capabilities

- None.

## Impact

- Adds the first minimal admin file upload flow under `/admin/files`.
- Affects future public file/download surfaces for blog posts, docs, videos, archives, and standalone shared files.
- Establishes the first data model expectations for file records, ownership, storage keys, visibility, file counts, quotas, content attachment, and auditability.
- Aligns with existing UploadThing usage in `app/api/uploadthing`, `components/admin-pages/image-uploader.tsx`, rich-text image uploads, `PostImage.fileKey`, markdown doc preview images, and video thumbnail URL handling.
