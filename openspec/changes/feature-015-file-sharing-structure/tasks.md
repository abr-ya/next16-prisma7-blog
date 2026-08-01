## 1. Current Surface Review

- [x] 1.1 Review existing UploadThing route configuration and replace placeholder auth only where needed for the new general file route.
- [x] 1.2 Review current file-like Prisma fields and confirm they remain compatibility surfaces for this slice.
- [x] 1.3 Choose the first per-file and per-user general file limits and keep them centralized in app code.

## 2. Backend File Foundation

- [x] 2.1 Add the `FileAsset` Prisma model with provider metadata, owner, URL, name, MIME type, size, purpose, visibility, lifecycle status, and timestamps.
- [x] 2.2 Add a migration and regenerate the Prisma client through the existing project flow.
- [x] 2.3 Add server-side file data helpers for current-user file count, current-user storage usage, tracked file listing, and completed upload recording.
- [x] 2.4 Ensure quota checks count active first-party files owned by the current user and ignore external URL references.

## 3. UploadThing File Route

- [x] 3.1 Add a dedicated general-file UploadThing route separate from `imageUploader`.
- [x] 3.2 Configure one-file uploads with an explicit per-file size limit and suitable content disposition.
- [x] 3.3 Authenticate the user in route middleware and reject unauthenticated uploads.
- [x] 3.4 Record completed UploadThing uploads as `FileAsset` rows with provider key, URL, file name, MIME type, size, owner, purpose, visibility, and active status.

## 4. Minimal Admin Files Page

- [x] 4.1 Add `/admin/files` to the admin sidebar.
- [x] 4.2 Add a minimal `/admin/files` page with the current user's file count and a simple list of tracked general file assets.
- [x] 4.3 Add a simple one-file upload form/control wired to the new general-file UploadThing route.
- [x] 4.4 Add a static dashboard section for known UploadThing usage points and mark legacy image/upload URL surfaces as not migrated in this slice.
- [x] 4.5 Keep search, filters, deletion, previews, bulk actions, role-aware controls, and global settings out of this slice.

## 5. Follow-up Backlog Boundaries

- [x] 5.1 Keep public download routes as a later feature.
- [x] 5.2 Keep full file manager UI and cleanup/deletion workflows as later features.
- [x] 5.3 Keep roles and permissions as a later admin/auth feature.
- [x] 5.4 Keep site-wide UploadThing settings for canonical URLs, total files, storage usage, and provider policy as a later feature after roles.

## 6. Validation and Closeout

- [x] 6.1 Run `openspec validate feature-015-file-sharing-structure --strict`.
- [x] 6.2 Run `npx prisma validate`.
- [x] 6.3 Run `npx prisma generate`.
- [x] 6.4 Run `npm run tsc`.
- [x] 6.5 Run `npm run lint` plus targeted ESLint for changed files outside `app/`.
- [x] 6.6 Ask the user to run `npm run build` locally before closeout because this slice touches routing, Prisma, and UploadThing; user-provided build output passed and manual `/admin/files` upload check passed.
- [ ] 6.7 Sync accepted specs before archive after review approval.
- [ ] 6.8 Update `openspec/backlog.md` to `Done` only after accepted-spec sync and archive.
- [ ] 6.9 Run `git diff --check` after final OpenSpec edits.
