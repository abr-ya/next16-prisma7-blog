# OpenSpec Backlog

This backlog tracks live project candidates. Completed and cancelled feature history lives in [feature-history.md](./feature-history.md).

Backlog candidates stay unnumbered until they are promoted into implementation. Promotion assigns the lowest unused `feature-XXX` number from the shared project sequence. When a large candidate is deliberately split, immediately sequential follow-up slices may be numbered together so their implementation order stays explicit.

## Status Values

- `Candidate`: identified, but scope or timing is still flexible.
- `Ready`: scope is clear enough to promote into a numbered OpenSpec change.
- `In Progress`: implementation has started and the candidate has a `feature-XXX` number.

## Priority Values

- `P0 Now`: next or near-next work; important, unblocking, or clearly time-sensitive.
- `P1 Soon`: useful and reasonably clear, but not the immediate focus.
- `P2 Later`: valid work with known value, but sequencing is not urgent.
- `P3 Someday`: parked ideas, experiments, or large fuzzy directions.

## Numbering Rules

- `Done` numbered features live in [feature-history.md](./feature-history.md).
- Unnumbered candidates can use any free number when promoted.
- Numbered follow-up slices stay in this backlog until completed, then move to [feature-history.md](./feature-history.md).
- To promote a candidate, assign the lowest unused `feature-XXX` number after checking this file and [feature-history.md](./feature-history.md).
- Cancelled or deferred candidates do not reserve numbers; keep or move them as unnumbered history notes when useful.

## Outdoor Content High-Priority Roadmap

These candidates track the hikes/tracks/photos initiative as small increments. They stay unnumbered until promoted; the first promoted slice should take the next available feature number from the shared sequence.

| Order | Status | Candidate | Area | Summary |
| --- | --- | --- | --- | --- |
| 2 | Candidate | outdoor-tracks-file-data-foundation | outdoor/tracks | Add the first `Track` entity backed by a GPX `FileAsset`, upload validation, stored metadata shell, data actions, and admin create/edit/list page without map rendering. |
| 3 | Candidate | outdoor-tracks-public-download-preview | outdoor/tracks | Add public track listing/detail pages with visibility-safe metadata and controlled access to public GPX files. |
| 4 | Candidate | outdoor-photos-file-data-foundation | outdoor/photos | Add the first `Photo` entity backed by image `FileAsset` records, 1-3 file upload batch support, data actions, and admin create/edit/list page. |
| 5 | Candidate | outdoor-photos-exif-capture | outdoor/photos | Extract and store photo captured-at, camera/lens basics, dimensions, orientation, and raw safe EXIF metadata where available. |
| 6 | Candidate | outdoor-photos-public-gallery | outdoor/photos | Add public photo listing/detail pages with visibility-safe previews, captured-at display, and selected EXIF metadata. |
| 7 | Candidate | outdoor-hike-track-association | outdoor/hikes-tracks | Let admins attach/detach tracks to hikes and show linked tracks in both hike and track admin/public views. |
| 8 | Candidate | outdoor-hike-photo-association | outdoor/hikes-photos | Let admins attach/detach photos to hikes and show linked photos in both hike and photo admin/public views. |
| 9 | Candidate | outdoor-track-gpx-parsing-summary | outdoor/maps | Parse GPX geometry and summary stats such as distance, bounds, elevation range, and time range into a reusable stored/read model. |
| 10 | Candidate | outdoor-track-map-component | outdoor/maps | Add a public map component for rendering one GPX track with OSM-compatible tiles and graceful fallback when geometry is unavailable. |
| 11 | Candidate | outdoor-hike-combined-track-map | outdoor/maps | Add one map on hike detail pages that renders all linked visible tracks together and frames the combined bounds. |
| 12 | Candidate | outdoor-photo-gps-map-markers | outdoor/maps-photos | Use direct GPS EXIF coordinates to place linked hike photos on the hike map when coordinates exist. |
| 13 | Candidate | outdoor-photo-manual-ordering | outdoor/photos | Add simple manual ordering for hike photos so later album/gallery work has a stable foundation. |
| 14 | Candidate | outdoor-photo-track-time-matching-spike | outdoor/maps-photos | Investigate and plan timestamp-based photo-to-track matching before implementing interpolation, timezone, and confidence rules. |
| 15 | Candidate | outdoor-photo-albums-structure | outdoor/photos | Define and add album/grouping structure for photos after basic hike association and ordering are proven. |

## P0 Now

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Ready | feature-044-content-tags-selective-legacy-post-import | content/tags | Add high-priority selective legacy post tag planning so admins can choose specific legacy-only posts and dry-run the selected set without writing shared content tags yet. |
| Ready | feature-046-content-tags-selected-legacy-post-import-apply | content/tags | Apply the selected legacy post tag import after the dry-run slice, with confirmation, eligibility re-checks, idempotent shared tag assignments, logging, and revalidation. |

## P1 Soon

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Ready | feature-043-content-tags-admin-assignment-actions | content/tags | Add assignment-level controls for shared content tags after the inventory and tag-level actions are proven: select linked post assignments, remove selected assignments, and replace selected assignments with another shared tag without deleting posts or affecting unrelated tag assignments. |
| Ready | admin-sidebar-role-sections | navigation/admin | Split the admin sidebar into explicit signed-in workspace and admin-only control sections while keeping server-side role checks as the authorization boundary. |
| Ready | public-navbar-route-coverage-rollout | navigation/public | Move remaining primary public routes into the shared top-nav layout after the docs pilot, including home and comments, then consolidate blog/videos layout wiring and remove duplicated legacy back navigation or oversized page spacing where needed without changing public URLs or auth boundaries. |
| Candidate | public-localization-page-scope-audit | localization/public | Inventory public pages and shared components before deeper localization work, grouping pages into small slices and identifying pages that need component-level translation planning. |
| Candidate | public-home-page-localization | localization/home | Localize the public home page copy using the established app locale resource structure while preserving existing database-backed content behavior. |
| Candidate | public-docs-comments-localization | localization/public | Localize static UI copy for the public Docs listing/detail surfaces and the placeholder Comments page as a small paired slice, without translating markdown document content or comment records. |
| Candidate | public-blog-videos-list-localization | localization/public | Localize static UI copy for the Blog and Videos listing/detail surfaces after navbar/home localization is proven, keeping post/video database content unchanged. |
| Candidate | public-navbar-multi-content-search | search/public | Replace the shared public navbar search placeholder with a working public search experience across visible blog posts, markdown docs, and public videos, with a route or dialog for grouped results and explicit visibility boundaries. |
| Candidate | video-comments-own-management | video/comments | Add signed-in own-comment edit and delete controls on public video detail comment lists after earlier comment follow-ups are prioritized. |
| Candidate | admin-database-backup-generation | admin/database | Add manual admin-triggered database backup generation and download using the accepted admin database backup structure, without restore, scheduling, retention, or external storage policy. |
| Candidate | image-upload-tracking-migration | files/migration | Migrate legacy `imageUploader` route to create `FileAsset` records and count toward user storage quota, or create new tracked image route and deprecate legacy route. |
| Candidate | email-password-account-flow | auth/email | Finish first-party email/password account creation and login with form UX, mailbox-backed email verification, and password reset boundaries. |
| Candidate | dependency-upgrade-audit | dependencies | Audit and upgrade important framework/runtime packages such as Prisma, Next, React, better-auth, UploadThing, Tiptap, Radix, and ESLint in isolated groups with compatibility fixes and validation after each group. |

## P2 Later

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Candidate | video-search | video/search | Add broader video search across title, URL, channel, tags, notes, bookmarks, comments, and extracted metadata. |
| Candidate | video-import-export | video/tools | Add import and export workflows for saved video links. |
| Candidate | video-admin-bulk-actions | video/admin | Add bulk actions to the admin video table. |
| Candidate | admin-table-pagination-rollout | admin/tables | Apply the shared client-side admin table pagination pattern to other admin tables after the video table slice proves it useful. |
| Candidate | saved-posts-admin-workflow | posts/admin | Define and implement the saved posts admin workflow currently represented by a placeholder. |
| Candidate | public-comments-unified-feed | comments/public | Implement the standalone `/comments` page as a unified public comments feed across supported visible targets, replacing the current placeholder. |
| Candidate | video-duration-api-extraction | video/metadata | Add API-backed video duration extraction while preserving failure-tolerant video saves. |
| Candidate | public-video-tag-filtering | video/tags | Add public `/videos` filtering by video tag once tag foundation behavior is proven, with tag UI visually distinct from channel badges. |
| Candidate | video-comments-edit-delete-expiry | video/comments | Prevent editing and deleting own comments after they are more than 24 hours old. |
| Candidate | github-oauth-credentials-validation | auth/github | Create environment-specific GitHub OAuth credentials, document required callback URLs, and manually verify the live GitHub sign-in/sign-up integration after the code-level flow is complete. |

## P3 Someday

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Candidate | admin-file-category-drill-down | files/admin | Add purpose-filtered file views in admin file manager with category-specific listing, previews, stats, and management controls accessible from settings breakdown. |
| Candidate | site-settings-storage-structure | admin/settings | Define project-wide site settings storage strategy (env variables vs database table vs config file) for editable admin controls including persistence, hot reload, versioning, and audit boundaries. |
| Candidate | file-upload-domain-isolation | files/upload | Add full domain isolation for file uploads using server-side proxy or signed URLs so browser never sees UploadThing provider URLs during upload or download. |
| Candidate | per-user-storage-quota-configuration | files/admin | Add per-user configurable storage quotas with database-backed limits, allowing admins to set different storage limits for individual users instead of site-wide constant. |
