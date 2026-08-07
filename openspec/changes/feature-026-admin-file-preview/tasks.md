## 1. Preview UI

- [x] 1.1 Add file preview type detection for image, PDF, and text-like MIME types.
- [x] 1.2 Add an admin file preview dialog that renders image, PDF, text, too-large text, and unsupported states.
- [x] 1.3 Keep preview sources and download links on the app-owned `/files/{fileId}/download` route.

## 2. Files Table Integration

- [x] 2.1 Add preview actions to `components/admin-pages/files-table.tsx` for previewable files.
- [x] 2.2 Keep unsupported files downloadable without an active inline preview action.
- [x] 2.3 Mark `feature-026` as `In Progress` in `openspec/backlog.md`.

## 3. Validation

- [x] 3.1 Run `openspec validate feature-026-admin-file-preview --strict`.
- [x] 3.2 Run `npm run tsc`.
- [x] 3.3 Run `npm run lint` and targeted ESLint for changed non-app files.
- [x] 3.4 Run `git diff --check`.
- [x] 3.5 Note that `npm run build` and manual browser preview checks are expected locally for this admin UI slice.
