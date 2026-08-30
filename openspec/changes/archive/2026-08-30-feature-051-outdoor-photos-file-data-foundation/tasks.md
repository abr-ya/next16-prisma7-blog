## 1. Data Model and Upload Contract

- [x] 1.1 Add additive Prisma schema changes for `PhotoStatus`, `Photo`, ordered `PhotoImage` attachments, `User.photos`, `FileAsset.photoImages`, and an outdoor photo image `FileAssetPurpose`.
- [x] 1.2 Create and review the Prisma migration without rewriting existing migrations or generated client files manually.
- [x] 1.3 Add photo upload limits in the existing upload limits module, including 1-3 image count support and explicit per-file size.
- [x] 1.4 Add a dedicated authenticated UploadThing route for outdoor photo images that records `FileAsset` rows with the photo-specific purpose and private visibility.
- [x] 1.5 Update file usage metadata so `/admin/files` distinguishes the outdoor photo upload route as a tracked UploadThing usage point.

## 2. Photo Domain Helpers and Actions

- [x] 2.1 Add photo validation helpers for title, optional description, status, and one to three eligible image file asset IDs.
- [x] 2.2 Add server-only data helpers for listing photos, getting a photo for edit, and checking eligible photo image file assets.
- [x] 2.3 Add create, update, and delete server actions for photos with admin authentication and revalidation.
- [x] 2.4 Ensure editing image selections preserves photo identity and does not delete previously referenced file assets.
- [x] 2.5 Ensure deleting a photo removes the photo record and attachment rows while preserving linked file assets.

## 3. Admin Photo UI

- [x] 3.1 Add `/admin/photos` page with authenticated admin data loading.
- [x] 3.2 Add an admin photos panel/table showing title, image count, status, and updated timestamp.
- [x] 3.3 Add create/edit form UI with 1-3 image upload support through the dedicated photo uploader.
- [x] 3.4 Add delete controls using the existing app-styled confirmation dialog pattern.
- [x] 3.5 Add Photos to the admin navigation using the established outdoor/admin navigation style.

## 4. OpenSpec Tracking and Validation

- [x] 4.1 Update `openspec/backlog.md` so `outdoor-photos-file-data-foundation` is marked `In Progress` with `feature-051-outdoor-photos-file-data-foundation`.
- [x] 4.2 Update docs/checklists if implementation changes outdoor photo or UploadThing usage notes.
- [x] 4.3 Run Prisma generate through the existing project flow after schema changes.
- [x] 4.4 Run `npm run tsc`.
- [x] 4.5 Run `npm run lint`.
- [x] 4.6 Run targeted ESLint for changed non-app files when needed.

## Deferred Manual Validation

Manual browser validation for `/admin/photos` create, edit, delete, upload count limits, invalid file handling, file preservation behavior, and local `npm run build` will be checked during the next outdoor photos feature slice.
