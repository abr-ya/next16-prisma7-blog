## Context

The project already has several file-like paths, but they are not covered by one shared contract. UploadThing powers image uploads through `app/api/uploadthing`, rich-text post images can retain an UploadThing `fileKey` through `PostImage`, markdown docs now store an optional `previewImageUrl`, and videos can store external/provider thumbnail URLs.

Future archive downloads, uploaded video-related files, reusable public files, and cleanup work need one domain structure before schema or UI slices start adding more file fields. The first slice should be intentionally small: backend-owned records, a dedicated UploadThing file route, a minimal admin upload form, and a count of files owned by the current user.

This feature is a backend-first foundation slice. It creates the smallest useful file flow while keeping public downloads, role-aware permissions, global storage settings, richer management UI, and existing media migrations for later features.

## Goals / Non-Goals

**Goals:**

- Define the file domain vocabulary for first-party uploaded files, external references, and public downloadable files.
- Define and implement the first data model shape for file identity, storage provider metadata, ownership, visibility, lifecycle state, and future content attachment.
- Add a dedicated UploadThing general-file route separate from the image uploader.
- Add a minimal `/admin/files` page with upload and the current user's file count.
- Define server/client boundaries for upload, minimal admin management, and future public download rendering.
- Define migration and compatibility expectations for current UploadThing-backed images and URL-only media fields.
- Split implementation follow-ups into small slices.

**Non-Goals:**

- No public download route, signed URL endpoint, full admin file manager, or cleanup worker in this slice.
- No role system, role-based file permissions, or shared admin settings page in this slice.
- No migration of existing `PostImage`, `MdDoc.previewImageUrl`, `Post.imageUrl`, `Video.thumbnailUrl`, or channel image fields in this slice.

## Decisions

### Decision: Add a first-party `FileAsset` model for uploaded files

This slice should introduce a first-party file record for files controlled by this application. The initial record should represent:

- storage provider, starting with UploadThing;
- provider file key for deletion or signed-access operations;
- canonical URL when the provider exposes one;
- filename, MIME type, byte size, optional width/height, and checksum when available;
- owner user;
- purpose, such as admin upload, archive attachment, video attachment, preview image, rich-text image, or standalone shared file;
- visibility, starting conservatively with admin/private-oriented values;
- lifecycle state, such as active, detached, pending deletion, or deleted;
- timestamps for create/update/delete lifecycle.

Alternative considered: keep URL fields on each content model only. That is simpler in the short term, but it repeats ownership, cleanup, audit, and visibility logic across unrelated models.

### Decision: Add a dedicated UploadThing `fileUploader` route

General downloadable files should use a separate UploadThing route from the existing `imageUploader`. The route should be named for general files, accept a conservative file type set or `blob`, use one file per upload for the first implementation, and set an explicit per-file size limit. The route middleware should authenticate with the real app session and attach the user id to upload metadata.

UploadThing route config can limit file size and file count per upload, but project-level totals should be enforced by this application. The first quota check should compare the current user's active `FileAsset.sizeBytes` total against an app constant before allowing a new upload.

Alternative considered: reuse `imageUploader` for all files. That blurs intent and makes future file-specific limits, content disposition, and quota behavior harder to manage.

### Decision: Start admin UI with a minimal `/admin/files` page

The first admin page should be intentionally plain: show a simple upload control for one file and display the current user's file count. It does not need search, previews, file deletion, bulk actions, filters, global usage charts, or role-aware controls yet.

Alternative considered: build a full file manager immediately. That would mix the backend foundation with table UX, permissions, cleanup, and public sharing concerns before the core record/upload path is proven.

### Decision: Keep external media references separate from first-party files

External URLs, such as YouTube thumbnails or channel image URLs, should remain references unless the system intentionally imports them into storage. The file model should distinguish first-party uploaded files from external references so cleanup and access-control code never tries to delete or sign third-party URLs.

Alternative considered: normalize every URL into one file table. That hides important operational differences between files the app controls and remote resources it only displays.

### Decision: Public downloads are deferred but remain app-owned when policy matters

Publicly visible files may render direct provider URLs only when the file is intentionally public and no download policy is needed. Files that require audit, future signed access, private/admin visibility, or stable app URLs should be served through app-owned routes such as `/files/[id]` or `/api/files/[id]/download` in later implementation slices. The current slice stores enough metadata for that later route, but does not expose a public download surface.

Alternative considered: always expose provider URLs. That is fast, but it couples public content to storage-provider URLs and leaves no room for access checks or audit.

### Decision: Treat current file fields as compatibility surfaces

Existing fields continue to work as-is until dedicated migration slices are created. The structure should describe how each current surface maps into the future model:

- `PostImage.url` and `PostImage.fileKey` are the closest current file-asset shape.
- `MdDoc.previewImageUrl`, `Post.imageUrl`, `Video.thumbnailUrl`, and video channel `imageUrl` are URL-only media references today.
- Tiptap images can carry `data-filekey` and should remain compatible with current rendering.

### Decision: Defer roles and global UploadThing settings

Role design should happen in a separate admin/auth feature before file permissions become role-aware. After roles exist, a later UploadThing settings feature can design a shared admin view for canonical URL policy, total stored file counts, storage usage, limits, provider policy, and other site-wide file parameters.

Alternative considered: include roles and settings in this slice. That would make the first file upload foundation too broad and would force permissions decisions before the role model exists.

## Risks / Trade-offs

- UploadThing callback succeeds but database record creation fails -> log the failure and make reconciliation a later cleanup/admin task.
- A generic file model can become too broad -> start implementation with only `/admin/files`, one upload control, and a current-user file count.
- Public download routes can add complexity for files that are already public -> allow direct public provider URLs when no access policy, audit, or URL stability requirement exists.
- Cleanup can delete files still referenced by rich text or older content -> require detached/pending-delete states and reference checks before provider deletion.
- UploadThing metadata currently uses a placeholder auth helper in `app/api/uploadthing/core.ts` -> resolve real auth in this slice for the new general-file route.
- Per-user total quotas can be imperfect when concurrent uploads start at the same time -> keep the first quota simple and record sizes server-side, then tighten with transactions or reserved bytes later if needed.

## Migration Plan

1. Add the `FileAsset` schema and migration without touching existing media fields.
2. Add a dedicated UploadThing general-file route that authenticates the user and records completed uploads.
3. Add a minimal `/admin/files` page with one upload form and current-user file count.
4. Create separate follow-up features for public download routes, richer admin management, role-aware permissions, UploadThing site settings, and existing media migration.

Rollback for this slice should remove the new admin route, UploadThing route, and `FileAsset` records/model. Existing blog/docs/video media fields are not migrated in this slice, so they should remain unaffected.

## Open Questions

- What initial per-user total storage limit should the app enforce for general file uploads?
- Should public file URLs be human-readable slugs, opaque IDs, or both?
- Should deleted provider files be removed synchronously from admin actions or asynchronously through a cleanup job?
