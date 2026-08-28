## 1. Data Model

- [ ] 1.1 Add `Track`, `TrackStatus`, and `FileAssetPurpose.TRACK_GPX` to `prisma/schema.prisma` with indexes for slug, status, owner, and unique `fileAssetId`.
- [ ] 1.2 Create a Prisma migration for the track model and GPX file purpose without touching existing migrations or generated client files manually.
- [ ] 1.3 Regenerate the Prisma client through the existing project flow.

## 2. GPX Upload Boundary

- [ ] 2.1 Add shared GPX validation helpers for filename, MIME, and lightweight content sniffing.
- [ ] 2.2 Add a dedicated `trackGpxUploader` UploadThing route that enforces authentication, GPX validation, quota checks, and `TRACK_GPX` file asset recording.
- [ ] 2.3 Extend upload usage-point reporting so the new GPX track route is visible in existing admin file settings/usage surfaces.

## 3. Server Data Boundary

- [ ] 3.1 Add server-side track validation for required fields, slug format/uniqueness, and eligible GPX file asset binding.
- [ ] 3.2 Add data helpers/actions for admin listing, create, update, and delete.
- [ ] 3.3 Ensure track delete removes only the track record and leaves the linked file asset in existing file-management lifecycle states.

## 4. Admin UI

- [ ] 4.1 Add `/admin/tracks` with breadcrumbs, create action entry point, and a table of tracks.
- [ ] 4.2 Add track create/edit form controls for title, slug, description, status, GPX upload, and GPX replace.
- [ ] 4.3 Add admin row actions for editing and deleting tracks with the existing confirmation pattern where appropriate.
- [ ] 4.4 Add a Tracks entry to the admin sidebar navigation.

## 5. Backlog and Validation

- [ ] 5.1 Update `openspec/backlog.md` so `feature-047-outdoor-tracks-file-data-foundation` is marked `In Progress` during implementation and the promoted outdoor candidate reflects the assigned feature number.
- [ ] 5.2 Run `npm run tsc`.
- [ ] 5.3 Run `npm run lint`.
- [ ] 5.4 Ask the user to run `npm run build` locally and report the result because this slice changes Prisma schema and upload routes.
