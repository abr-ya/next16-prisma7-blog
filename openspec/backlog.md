# OpenSpec Backlog

This backlog tracks project-wide planned features with one stable sequence.

Use the same `feature-<3 digits>-<area>-<short-action>` name for the OpenSpec change directory and git branch when possible.

## Status Values

- `Planned`: identified, not proposed yet.
- `Proposed`: OpenSpec change exists, not implemented.
- `In Progress`: implementation has started.
- `Done`: implemented and archived into accepted specs.
- `Cancelled`: intentionally not happening; do not reuse the number.

## Numbering Reserve

- `feature-001` through `feature-004` are completed historical slices and keep their numbers.
- `feature-005` through `feature-019` are reserved for the next near-term product slices.
- `feature-020` through `feature-039` are available for upcoming near-term candidates as the roadmap clarifies.
- `feature-040+` rows are parked backlog ideas; promote or split them into the reserved range only when they become the next implementation candidate and before creating an OpenSpec change.

## Features

| ID | Status | Change | Area | Summary |
| --- | --- | --- | --- | --- |
| feature-001 | Done | feature-001-video-admin-table-pagination | video/admin | Add client-side pagination to the admin video table, starting from the shared DataTable pattern. |
| feature-002 | Done | feature-002-video-metadata-provider-extraction | video/metadata | Add provider-aware metadata extraction for provider IDs, thumbnails, and embeds while keeping saves failure-tolerant. |
| feature-003 | Done | feature-003-video-channel-list-filters | video/channels | Add channel filtering and sorting to admin and public video lists. |
| feature-004 | Done | feature-004-video-tags-foundation | video/tags | Add reusable video tags, admin video/tag assignment, and tag badges without public tag filtering. |
| feature-005 | Done | feature-005-video-public-bookmarks | video/bookmarks | Add public-video timestamp bookmarks so authenticated people can save linked moments in each other's public videos. |
| feature-006 | Done | feature-006-video-comments | video/comments | Add the public-video comments data model and server actions as a foundation before UI work. |
| feature-007 | Done | feature-007-video-detail-bookmark-polish | video/bookmarks | Polish the public video detail page with inline video actions, earlier bookmark placement, all/my bookmark views, and dialog-based bookmark creation. |
| feature-008 | Done | feature-008-site-share-metadata | site/metadata | Add the reusable share metadata foundation and apply it first to public video pages. |
| feature-009 | Done | feature-009-docs-share-metadata | docs/metadata | Extend share metadata to public docs pages first as the next narrow proof point after the video slice. |
| feature-010 | Done | feature-010-video-comments-public-ui | video/comments | Add public video detail comment creation and visible comment counts without rendering the comment list yet. |
| feature-011 | Done | feature-011-video-preview-player-toggle | video/detail | Always show the video preview on public video detail pages and add a preview/player toggle, disabling player mode with a short reason when embed playback is unavailable. |
| feature-012 | Done | feature-012-site-share-metadata-content-pages | site/metadata | Extend share metadata to blog posts and remaining public listing pages after the docs metadata slice is proven. |
| feature-013 | Done | feature-013-md-doc-preview-image | docs/admin | Add an optional preview image to markdown docs and use it as the doc share metadata image when present. |
| feature-014 | Done | feature-014-video-comments-list-rendering | video/comments | Render public video detail comment lists with comment text, date, user avatar, and user display name. |
| feature-015 | Done | feature-015-file-sharing-structure | files/admin | Add the minimal backend-first file foundation with `FileAsset`, a dedicated UploadThing file route, a basic admin upload form, and the current user's file count. |
| feature-016 | Done | feature-016-admin-auth-roles-structure | admin/auth | Document the current registration/authentication setup and plan the role, registration, provider, and admin access model before role-gated features. |
| feature-017 | Done | feature-017-auth-admin-plugin-role-storage | admin/auth | Implement Better Auth Admin plugin role storage with safe `user` defaults, manual first-admin promotion, and minimal server-side role helpers. |
| feature-018 | Done | feature-018-comments-domain-structure | comments/architecture | Define the project-wide comment structure across video comments, future post comments, and the standalone `/comments` page before expanding comments beyond videos. |
| feature-019 | Done | feature-019-content-tags-structure | content/tags | Define a project-wide tag structure that reuses the proven video tag workflow for posts and future content types, including the shared pieces worth extracting. |
| feature-020 | Done | feature-020-admin-database-backup-structure | admin/database | Define the admin-panel database backup structure, including full or partial backups, export formats, user-role audit, access controls, and restore boundaries before implementation slices. |
| feature-021 | Done | feature-021-comment-link-handling-structure | comments/links | Analyze comment link handling and define whether plain URLs in comments should become safe clickable links immediately, including parsing, sanitization, and rendering rules. |
| feature-022 | Done | feature-022-video-comments-shared-foundation | video/comments | Bring existing video comments onto the shared comment domain contract with a compatibility-focused adapter/helper slice, without changing public video comment behavior. |
| feature-023 | Done | feature-023-uploadthing-site-settings-structure | files/settings | After roles are defined, design an admin settings page for site-wide UploadThing/file parameters such as canonical file URLs, total stored files, storage usage, limits, and provider policy. |
| feature-024 | Done | feature-024-public-file-downloads | files/public | Add app-owned public download routes for file assets that need stable URLs, access checks, or download audit. |
| feature-025 | Done | feature-025-admin-file-manager-listing | files/admin | Add pagination, search, and filters (purpose/visibility/status) to admin file listing with enhanced metadata display. |
| feature-026 | In Progress | feature-026-admin-file-preview | files/admin | Add file preview capability for common file types (images, PDFs, text files) with dialog or inline preview in admin file manager. |
| feature-027 | Planned | feature-027-admin-file-deletion | files/admin | Add file deletion controls that transition files to cleanup states (DETACHED, PENDING_DELETE) with eventual removal workflow. |
| feature-028 | Planned | feature-028-video-comments-edit-delete-expiry | video/comments | Prevent editing and deleting own comments after they are more than 24 hours old. |
| feature-027 | Planned | feature-027-admin-file-deletion | files/admin | Add file deletion controls that transition files to cleanup states (DETACHED, PENDING_DELETE) with eventual removal workflow. |
| feature-028 | Planned | feature-028-video-comments-edit-delete-expiry | video/comments | Prevent editing and deleting own comments after they are more than 24 hours old. |
| feature-029 | Planned | feature-029-email-password-account-flow | auth/email | Finish first-party email/password account creation and login with form UX, mailbox-backed email verification, and password reset boundaries. |
| feature-030 | Planned | feature-030-github-account-flow | auth/github | Finish GitHub account creation and sign-in with provider configuration, callback handling, email availability checks, and account-linking boundaries. |
| feature-031 | Planned | feature-031-content-tags-post-adoption | content/tags | Move post tag reads and writes onto shared content tag records and post/tag assignments while preserving legacy `Post.tags` readability without bulk-migrating old values yet. |
| feature-032 | Planned | feature-032-content-tags-legacy-post-migration | content/tags | Review legacy `Post.tags` values, merge or drop old tag variants as needed, then migrate approved values into shared content tags with an auditable compatibility boundary. |
| feature-033 | Planned | feature-033-video-comments-own-management | video/comments | Add signed-in own-comment edit and delete controls on public video detail comment lists after earlier comment follow-ups are prioritized. |
| feature-034 | Planned | feature-034-content-tags-admin-management | content/tags | Add content-wide admin tag management for shared tags, including rename, merge, delete or detach boundaries, and usage visibility by content type. |
| feature-033 | Planned | feature-033-video-comments-own-management | video/comments | Add signed-in own-comment edit and delete controls on public video detail comment lists after earlier comment follow-ups are prioritized. |
| feature-034 | Planned | feature-034-content-tags-admin-management | content/tags | Add content-wide admin tag management for shared tags, including rename, merge, delete or detach boundaries, and usage visibility by content type. |
| feature-035 | Done | feature-035-blog-post-detail-tags-links | blog/detail | Render existing post tags on public blog post detail pages and only show connected-link UI when a post actually has connected links. |
| feature-036 | Planned | feature-036-admin-database-backup-generation | admin/database | Add manual admin-triggered database backup generation and download using the accepted admin database backup structure, without restore, scheduling, retention, or external storage policy. |
| feature-037 | Done | feature-037-video-comments-link-rendering | video/comments | Render safe clickable links for plain URLs in public video comment text using the accepted comment link handling structure. |
| feature-040 | Planned | feature-040-video-search | video/search | Add broader video search across title, URL, channel, tags, notes, bookmarks, comments, and extracted metadata. |
| feature-041 | Planned | feature-041-video-import-export | video/tools | Add import and export workflows for saved video links. |
| feature-042 | Planned | feature-042-video-admin-bulk-actions | video/admin | Add bulk actions to the admin video table. |
| feature-043 | Planned | feature-043-public-navbar-hydration-fix | navigation/public | Fix the public navbar hydration warning by auditing the `NavigationMenuList` HTML structure. |
| feature-044 | Planned | feature-044-admin-table-pagination-rollout | admin/tables | Apply the shared client-side admin table pagination pattern to other admin tables after the video table slice proves it useful. |
| feature-045 | Planned | feature-045-saved-posts-admin-workflow | posts/admin | Define and implement the saved posts admin workflow currently represented by a placeholder. |
| feature-046 | Planned | feature-046-video-duration-api-extraction | video/metadata | Add API-backed video duration extraction while preserving failure-tolerant video saves. |
| feature-047 | Planned | feature-047-public-video-tag-filtering | video/tags | Add public `/videos` filtering by video tag once tag foundation behavior is proven, with tag UI visually distinct from channel badges. |
| feature-048 | Cancelled | feature-048-video-tag-management | video/tags | Superseded by `feature-032-content-tags-admin-management` so tag management is content-wide instead of video-only. |
| feature-049 | Planned | feature-049-video-tag-confirm-dialog | video/tags | Replace the browser-native new-tag confirmation with an app-styled confirmation dialog. |
| feature-050 | Planned | feature-050-image-upload-tracking-migration | files/migration | Migrate legacy `imageUploader` route to create `FileAsset` records and count toward user storage quota, or create new tracked image route and deprecate legacy route. |
| feature-070 | Planned | feature-070-admin-file-category-drill-down | files/admin | Add purpose-filtered file views in admin file manager with category-specific listing, previews, stats, and management controls accessible from settings breakdown. |
| feature-071 | Planned | feature-071-site-settings-storage-structure | admin/settings | Define project-wide site settings storage strategy (env variables vs database table vs config file) for editable admin controls including persistence, hot reload, versioning, and audit boundaries. |
| feature-072 | Planned | feature-072-file-upload-domain-isolation | files/upload | Add full domain isolation for file uploads using server-side proxy or signed URLs so browser never sees UploadThing provider URLs during upload or download. |
| feature-100 | Planned | feature-100-per-user-storage-quota-configuration | files/admin | Add per-user configurable storage quotas with database-backed limits, allowing admins to set different storage limits for individual users instead of site-wide constant. |
