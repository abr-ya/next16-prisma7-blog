## 1. Data Model and Upload Contract

- [ ] 1.1 Add additive Prisma schema changes for `PhotoStatus`, `Photo`, ordered `PhotoImage` attachments, `User.photos`, `FileAsset.photoImages`, and an outdoor photo image `FileAssetPurpose`.
- [ ] 1.2 Create and review the Prisma migration without rewriting existing migrations or generated client files manually.
- [ ] 1.3 Add photo upload limits in the existing upload limits module, including 1-3 image count support and explicit per-file size.
- [ ] 1.4 Add a dedicated authenticated UploadThing route for outdoor photo images that records `FileAsset` rows with the photo-specific purpose and private visibility.
- [ ] 1.5 Update file usage metadata so `/admin/files` distinguishes the outdoor photo upload route as a tracked UploadThing usage point.

## 2. Photo Domain Helpers and Actions

- [ ] 2.1 Add photo validation helpers for title, optional description, status, and one to three eligible image file asset IDs.
- [ ] 2.2 Add server-only data helpers for listing photos, getting a photo for edit, and checking eligible photo image file assets.
- [ ] 2.3 Add create, update, and delete server actions for photos with admin authentication and revalidation.
- [ ] 2.4 Ensure editing image selections preserves photo identity and does not delete previously referenced file assets.
- [ ] 2.5 Ensure deleting a photo removes the photo record and attachment rows while preserving linked file assets.

## 3. Admin Photo UI

- [ ] 3.1 Add `/admin/photos` page with authenticated admin data loading.
- [ ] 3.2 Add an admin photos panel/table showing title, image count, status, and updated timestamp.
- [ ] 3.3 Add create/edit form UI with 1-3 image upload support through the dedicated photo uploader.
- [ ] 3.4 Add delete controls using the existing app-styled confirmation dialog pattern.
- [ ] 3.5 Add Photos to the admin navigation using the established outdoor/admin navigation style.

## 4. OpenSpec Tracking and Validation

- [ ] 4.1 Update `openspec/backlog.md` so `outdoor-photos-file-data-foundation` is marked `In Progress` with `feature-051-outdoor-photos-file-data-foundation`.
- [ ] 4.2 Update docs/checklists if implementation changes outdoor photo or UploadThing usage notes.
- [ ] 4.3 Run Prisma generate through the existing project flow after schema changes.
- [ ] 4.4 Run `npm run tsc`.
- [ ] 4.5 Run `npm run lint`.
- [ ] 4.6 Run targeted ESLint for changed non-app files when needed.
- [ ] 4.7 Ask the user to run `npm run build` locally and report the result because this slice changes schema, routes, uploads, and admin UI.
- [ ] 4.8 Ask the user to manually check `/admin/photos` create, edit, delete, upload count limits, invalid file handling, and file preservation behavior.
