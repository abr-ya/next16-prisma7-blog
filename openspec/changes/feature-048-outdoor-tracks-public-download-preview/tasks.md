## 1. Public Data Boundary

- [x] 1.1 Add public track list/detail helpers that return only `PUBLISHED` tracks.
- [x] 1.2 Add a server-side derived field or helper for GPX download availability based on linked `FileAsset` status and visibility.
- [x] 1.3 Ensure public helpers never expose private provider URLs.

## 2. Public Routes

- [x] 2.1 Add `/tracks` under the shared public navbar route group with a published track listing.
- [x] 2.2 Add `/tracks/[slug]` under the shared public navbar route group with not-found handling for missing or draft tracks.
- [x] 2.3 Add metadata for track listing/detail pages.
- [x] 2.4 Render GPX filename, file size, updated/uploaded dates, description, and download availability on public pages.

## 3. Public Navigation

- [x] 3.1 Add Tracks to the shared public navbar links.
- [x] 3.2 Add English and Russian navigation labels for Tracks.
- [x] 3.3 Update the public navigation route coverage documentation if the project tracks current public route coverage there.

## 4. Backlog and Validation

- [x] 4.1 Update `openspec/backlog.md` so `feature-048-outdoor-tracks-public-download-preview` is marked `In Progress` and reflects the assigned feature number.
- [x] 4.2 Run `npm run tsc`.
- [x] 4.3 Run `npm run lint`.
- [x] 4.4 Run targeted ESLint for changed non-app files when needed.
- [x] 4.5 Ask the user to run `npm run build` locally and report the result because this slice adds public routes.
- [x] 4.6 Ask the user to manually check `/tracks` and `/tracks/[slug]` in the browser with published, draft, downloadable, and non-downloadable track cases.
