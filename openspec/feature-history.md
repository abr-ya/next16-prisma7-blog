# Feature History

This file preserves completed numbered OpenSpec features and unnumbered notes for cancelled or superseded candidates.

Only completed features keep permanent `feature-XXX` numbers. Live unnumbered candidates are tracked in [backlog.md](./backlog.md), and a candidate receives the lowest unused feature number only when promoted into implementation.

Cancelled or deferred candidates do not reserve feature numbers.

## Completed Features

| ID | Change | Area | Summary |
| --- | --- | --- | --- |
| feature-001 | feature-001-video-admin-table-pagination | video/admin | Add client-side pagination to the admin video table, starting from the shared DataTable pattern. |
| feature-002 | feature-002-video-metadata-provider-extraction | video/metadata | Add provider-aware metadata extraction for provider IDs, thumbnails, and embeds while keeping saves failure-tolerant. |
| feature-003 | feature-003-video-channel-list-filters | video/channels | Add channel filtering and sorting to admin and public video lists. |
| feature-004 | feature-004-video-tags-foundation | video/tags | Add reusable video tags, admin video/tag assignment, and tag badges without public tag filtering. |
| feature-005 | feature-005-video-public-bookmarks | video/bookmarks | Add public-video timestamp bookmarks so authenticated people can save linked moments in each other's public videos. |
| feature-006 | feature-006-video-comments | video/comments | Add the public-video comments data model and server actions as a foundation before UI work. |
| feature-007 | feature-007-video-detail-bookmark-polish | video/bookmarks | Polish the public video detail page with inline video actions, earlier bookmark placement, all/my bookmark views, and dialog-based bookmark creation. |
| feature-008 | feature-008-site-share-metadata | site/metadata | Add the reusable share metadata foundation and apply it first to public video pages. |
| feature-009 | feature-009-docs-share-metadata | docs/metadata | Extend share metadata to public docs pages first as the next narrow proof point after the video slice. |
| feature-010 | feature-010-video-comments-public-ui | video/comments | Add public video detail comment creation and visible comment counts without rendering the comment list yet. |
| feature-011 | feature-011-video-preview-player-toggle | video/detail | Always show the video preview on public video detail pages and add a preview/player toggle, disabling player mode with a short reason when embed playback is unavailable. |
| feature-012 | feature-012-site-share-metadata-content-pages | site/metadata | Extend share metadata to blog posts and remaining public listing pages after the docs metadata slice is proven. |
| feature-013 | feature-013-md-doc-preview-image | docs/admin | Add an optional preview image to markdown docs and use it as the doc share metadata image when present. |
| feature-014 | feature-014-video-comments-list-rendering | video/comments | Render public video detail comment lists with comment text, date, user avatar, and user display name. |
| feature-015 | feature-015-file-sharing-structure | files/admin | Add the minimal backend-first file foundation with `FileAsset`, a dedicated UploadThing file route, a basic admin upload form, and the current user's file count. |
| feature-016 | feature-016-admin-auth-roles-structure | admin/auth | Document the current registration/authentication setup and plan the role, registration, provider, and admin access model before role-gated features. |
| feature-017 | feature-017-auth-admin-plugin-role-storage | admin/auth | Implement Better Auth Admin plugin role storage with safe `user` defaults, manual first-admin promotion, and minimal server-side role helpers. |
| feature-018 | feature-018-comments-domain-structure | comments/architecture | Define the project-wide comment structure across video comments, future post comments, and the standalone `/comments` page before expanding comments beyond videos. |
| feature-019 | feature-019-content-tags-structure | content/tags | Define a project-wide tag structure that reuses the proven video tag workflow for posts and future content types, including the shared pieces worth extracting. |
| feature-020 | feature-020-admin-database-backup-structure | admin/database | Define the admin-panel database backup structure, including full or partial backups, export formats, user-role audit, access controls, and restore boundaries before implementation slices. |
| feature-021 | feature-021-comment-link-handling-structure | comments/links | Analyze comment link handling and define whether plain URLs in comments should become safe clickable links immediately, including parsing, sanitization, and rendering rules. |
| feature-022 | feature-022-video-comments-shared-foundation | video/comments | Bring existing video comments onto the shared comment domain contract with a compatibility-focused adapter/helper slice, without changing public video comment behavior. |
| feature-023 | feature-023-uploadthing-site-settings-structure | files/settings | After roles are defined, design an admin settings page for site-wide UploadThing/file parameters such as canonical file URLs, total stored files, storage usage, limits, and provider policy. |
| feature-024 | feature-024-public-file-downloads | files/public | Add app-owned public download routes for file assets that need stable URLs, access checks, or download audit. |
| feature-025 | feature-025-admin-file-manager-listing | files/admin | Add pagination, search, and filters (purpose/visibility/status) to admin file listing with enhanced metadata display. |
| feature-026 | feature-026-admin-file-preview | files/admin | Add file preview capability for common file types (images, PDFs, text files) with dialog or inline preview in admin file manager. |
| feature-027 | feature-027-admin-file-deletion | files/admin | Add file deletion controls that transition files to cleanup states (DETACHED, PENDING_DELETE) with eventual removal workflow. |
| feature-028 | feature-028-github-account-flow | auth/github | Finish GitHub account creation and sign-in with provider configuration, callback handling, email availability checks, and account-linking boundaries. |
| feature-029 | feature-029-content-tags-post-adoption | content/tags | Move post tag reads and writes onto shared content tag records and post/tag assignments while preserving legacy `Post.tags` readability without bulk-migrating old values yet. |
| feature-030 | feature-030-content-tags-review-status-workflow | content/tags | Add a review status for shared content tags so reviewed and needs-review tags keep working publicly while admins can inspect, approve, flag, replace, remove, or merge tags that need cleanup. |
| feature-031 | feature-031-content-tags-legacy-post-draft-migration | content/tags | Import legacy `Post.tags` values as needs-review shared tag assignments without hiding them publicly, so admins can clean them up through the review workflow. |
| feature-032 | feature-032-admin-confirm-dialogs | admin/ui | Replace browser-native confirmation prompts for admin destructive or sensitive actions with a reusable app-styled confirmation dialog. |
| feature-033 | feature-033-public-navbar-hydration-fix | navigation/public | Fix the public navbar hydration warning by correcting the shared public navbar `NavigationMenuList` structure. |
| feature-034 | feature-034-content-tags-admin-management | content/tags | Add the backend foundation for content-wide shared tag management, including admin-only usage data, rename, merge, status, selected detach, and unused delete boundaries. |
| feature-035 | feature-035-blog-post-detail-tags-links | blog/detail | Render existing post tags on public blog post detail pages and only show connected-link UI when a post actually has connected links. |
| feature-036 | feature-036-public-top-menu-section-coverage | navigation/public | Add Home, Blog, Docs, Videos, and Comments links to the shared public navbar while preserving auth-aware account access and existing utility controls. |
| feature-037 | feature-037-video-comments-link-rendering | video/comments | Render safe clickable links for plain URLs in public video comment text using the accepted comment link handling structure. |
| feature-038 | feature-038-home-page-content-hub-header-links | home/public | Add a public home page content hub with prioritized section links, comments work-in-progress status, secondary admin access, and compact supporting sections. |
| feature-039 | feature-039-public-navbar-language-switcher | localization/public | Add the public navbar language switcher, select the project localization package, and translate the first shared navigation labels. |
| feature-040 | feature-040-navigation-public-navbar-route-coverage | navigation/public | Document public navbar route coverage, add a reusable site top-nav shell, and pilot it on docs listing/detail routes while leaving the full rollout to a follow-up slice. |
| feature-041 | feature-041-content-tags-admin-inventory-page | content/tags | Add a read-oriented admin inventory page for all shared content tags with status counts, post assignment totals, and grouped post usage while preserving existing migration and review workflows. |
| feature-042 | feature-042-content-tags-admin-tag-actions | content/tags | Add focused tag-level management controls to the shared content tag admin page, including rename, mark active/needs-review, merge into another tag, and delete unused tag with confirmation and used-tag deletion safeguards. |
| feature-043 | feature-043-content-tags-admin-assignment-actions | content/tags | Add assignment-level controls to the shared content tag admin inventory for selecting post assignments, removing selected assignments, and replacing selected assignments with another shared tag. |
| feature-044 | feature-044-content-tags-selective-legacy-post-import | content/tags | Add selective legacy post tag planning so admins can choose specific legacy-only posts and dry-run the selected set without writing shared content tags yet. |
| feature-045 | feature-045-outdoor-hikes-data-admin-public-foundation | outdoor/hikes | Add the first hike entity with admin create/edit/delete management and minimal published-only public listing/detail pages. |
| feature-046 | feature-046-content-tags-selected-legacy-post-import-apply | content/tags | Apply the selected legacy post tag import after the dry-run slice, with confirmation, eligibility re-checks, idempotent shared tag assignments, logging, and revalidation. |
| feature-047 | feature-047-outdoor-tracks-file-data-foundation | outdoor/tracks | Add the first GPX-backed track entity with upload validation, file asset binding, server actions, and admin create/edit/list management without public track pages or map rendering. |
| feature-048 | feature-048-outdoor-tracks-public-download-preview | outdoor/tracks | Add public track listing/detail pages for published tracks with visibility-safe metadata and controlled GPX download availability. |
| feature-049 | feature-049-outdoor-track-gpx-parsing-summary | outdoor/maps | Parse GPX geometry into stored track metadata with distance, bounds, elevation/time ranges, point counts, admin parse lifecycle, public summaries, and simplified map-ready geometry. |
| feature-050 | feature-050-outdoor-track-map-component | outdoor/maps | Add a public map component for rendering one GPX track with OSM-compatible tiles, stored simplified geometry, start/end markers, bounds fitting, and graceful fallback when geometry is unavailable. |
| feature-051 | feature-051-outdoor-photos-file-data-foundation | outdoor/photos | Add the first `Photo` entity backed by image `FileAsset` records, 1-3 file upload batch support, data actions, and admin create/edit/list page. |
| feature-052 | feature-052-outdoor-photos-exif-gps-capture | outdoor/photos | Extract and store versioned photo EXIF/GPS metadata with admin refresh controls, without public EXIF or coordinate display. |
| feature-053 | feature-053-outdoor-hike-media-map-planning | outdoor/hikes-maps | Plan the hike-centered public outdoor experience, sync hike media/map specs, and order the next implementation slices around hike-track and hike-photo associations first. |

## Cancelled Candidate Notes

| Candidate | Area | Note |
| --- | --- | --- |
| video-tag-management | video/tags | Superseded by `content-tags-admin-management` so tag management is content-wide instead of video-only. |
| video-tag-confirm-dialog | video/tags | Superseded by `admin-confirm-dialogs`, which covers reusable app-styled confirmation dialogs across admin flows. |
