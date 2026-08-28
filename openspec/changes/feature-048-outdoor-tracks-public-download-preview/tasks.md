## 1. Public Data Boundary

- [ ] 1.1 Add public track list/detail helpers that return only `PUBLISHED` tracks.
- [ ] 1.2 Add a server-side derived field or helper for GPX download availability based on linked `FileAsset` status and visibility.
- [ ] 1.3 Ensure public helpers never expose private provider URLs.

## 2. Public Routes

- [ ] 2.1 Add `/tracks` under the shared public navbar route group with a published track listing.
- [ ] 2.2 Add `/tracks/[slug]` under the shared public navbar route group with not-found handling for missing or draft tracks.
- [ ] 2.3 Add metadata for track listing/detail pages.
- [ ] 2.4 Render GPX filename, file size, updated/uploaded dates, description, and download availability on public pages.

## 3. Public Navigation

- [ ] 3.1 Add Tracks to the shared public navbar links.
- [ ] 3.2 Add English and Russian navigation labels for Tracks.
- [ ] 3.3 Update the public navigation route coverage documentation if the project tracks current public route coverage there.

## 4. Backlog and Validation

- [ ] 4.1 Update `openspec/backlog.md` so `feature-048-outdoor-tracks-public-download-preview` is marked `In Progress` and reflects the assigned feature number.
- [ ] 4.2 Run `npm run tsc`.
- [ ] 4.3 Run `npm run lint`.
- [ ] 4.4 Run targeted ESLint for changed non-app files when needed.
- [ ] 4.5 Ask the user to run `npm run build` locally and report the result because this slice adds public routes.
- [ ] 4.6 Ask the user to manually check `/tracks` and `/tracks/[slug]` in the browser with published, draft, downloadable, and non-downloadable track cases.
