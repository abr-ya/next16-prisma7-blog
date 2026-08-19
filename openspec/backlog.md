# OpenSpec Backlog

This backlog tracks live project candidates. Completed and cancelled feature history lives in [feature-history.md](./feature-history.md).

Backlog candidates stay unnumbered until they are promoted into implementation. Promotion assigns the lowest unused `feature-XXX` number from the shared project sequence.

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
- To promote a candidate, assign the lowest unused `feature-XXX` number after checking this file and [feature-history.md](./feature-history.md).
- Cancelled or deferred candidates do not reserve numbers; keep or move them as unnumbered history notes when useful.

## P0 Now

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Ready | public-top-menu-section-coverage | navigation/public | Review the shared public top menu after the hydration fix and add all primary public sections such as blog, docs, videos, comments, and home while preserving auth-aware account access. |
| Candidate | home-page-content-hub-header-links | home/public | Add a proper public home page header and revise the hero/home links so the landing page clearly points to the main content sections without stale labels like old version notes. |

## P1 Soon

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| Ready | content-tags-admin-management-ui | content/tags | Build the admin UI for content-wide shared tag management on top of the backend foundation, including all-tags listing, usage inspection, dialogs, and management controls. |
| Ready | admin-sidebar-role-sections | navigation/admin | Split the admin sidebar into explicit signed-in workspace and admin-only control sections while keeping server-side role checks as the authorization boundary. |
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
