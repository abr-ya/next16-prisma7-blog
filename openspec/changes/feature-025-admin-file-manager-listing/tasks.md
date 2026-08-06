## 1. Planning State

- [x] 1.1 Mark `feature-025-admin-file-manager-listing` as In Progress in `openspec/backlog.md`.
- [x] 1.2 Create git branch `feature-025-admin-file-manager-listing`.

## 2. Data Layer Enhancement

- [x] 2.1 Extend `listTrackedFileAssets()` in `app/_data/files.ts` to include owner user name via Prisma relation select.
- [x] 2.2 Export enhanced file type with owner data from `app/_data/files.ts`.

## 3. FilesTable Component

- [x] 3.1 Create `components/admin-pages/files-table.tsx` client component using `@tanstack/react-table` pattern from `VideosTable`.
- [x] 3.2 Define columns for: name (with download link), type, size, purpose badge, visibility badge, status badge, owner name, uploaded date.
- [x] 3.3 Add sortable column headers for name and uploaded date.
- [x] 3.4 Add client-side pagination with page size of 10 (matching videos table).

## 4. Search and Filters

- [x] 4.1 Add search input for filename filtering (case-insensitive).
- [x] 4.2 Add purpose filter dropdown with "All purposes" + enum values.
- [x] 4.3 Add visibility filter dropdown with "All visibilities" + enum values.
- [x] 4.4 Add status filter dropdown with "All statuses" + enum values.
- [x] 4.5 Implement client-side filtering logic combining search + all three filters.
- [x] 4.6 Display filtered row count.

## 5. Metadata Display

- [x] 5.1 Show file name as clickable download link to `/files/{id}/download`.
- [x] 5.2 Show custom ID and file key in appropriate columns or tooltips.
- [x] 5.3 Show purpose, visibility, status as colored badges.
- [x] 5.4 Show owner name in dedicated column.
- [x] 5.5 Format uploaded date consistently with existing admin tables.

## 6. Page Integration

- [x] 6.1 Replace simple table in `app/admin/files/page.tsx` with `FilesTable` component.
- [x] 6.2 Pass enhanced file data from server to client component.
- [x] 6.3 Keep existing stats cards, upload form, and UploadThing usage points unchanged.

## 7. Validation

- [x] 7.1 Run `npm run tsc`.
- [x] 7.2 Run `npm run lint`.
- [x] 7.3 Run targeted ESLint for `components/admin-pages/files-table.tsx` and `app/_data/files.ts`.
- [x] 7.4 Run `git diff --check`.
- [ ] 7.5 Test pagination, search, and filters in browser on `/admin/files`.
- [ ] 7.6 Confirm download links work for different file types.
- [x] 7.7 Ask user to run `npm run build` for final validation.

## 8. Documentation

- [ ] 8.1 Update `openspec/backlog.md` to mark feature-025 as Done.
- [ ] 8.2 Archive OpenSpec change to `openspec/changes/archive/2026-08-05-feature-025-admin-file-manager-listing/`.
