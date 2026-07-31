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
| feature-014 | In Progress | feature-014-video-comments-list-rendering | video/comments | Render public video detail comment lists with comment text, date, user avatar, and user display name. |
| feature-015 | Planned | feature-015-video-comments-own-management | video/comments | Add signed-in own-comment edit and delete controls on public video detail comment lists. |
| feature-016 | Planned | feature-016-video-comments-edit-delete-expiry | video/comments | Prevent editing and deleting own comments after they are more than 24 hours old. |
| feature-017 | Planned | feature-017-file-sharing-structure | files/architecture | Define the project-wide file upload and public download structure for archives, videos, and other files before splitting it into implementation slices. |
| feature-018 | Planned | feature-018-comments-domain-structure | comments/architecture | Define the project-wide comment structure across video comments, future post comments, and the standalone `/comments` page before expanding comments beyond videos. |
| feature-019 | Planned | feature-019-content-tags-structure | content/tags | Define a project-wide tag structure that reuses the proven video tag workflow for posts and future content types, including the shared pieces worth extracting. |
| feature-020 | Planned | feature-020-admin-database-backup-structure | admin/database | Define the admin-panel database backup structure, including full or partial backups, export formats, user-role audit, access controls, and restore boundaries before implementation slices. |
| feature-021 | Planned | feature-021-comment-link-handling-structure | comments/links | Analyze comment link handling and define whether plain URLs in comments should become safe clickable links immediately, including parsing, sanitization, and rendering rules. |
| feature-040 | Planned | feature-040-video-search | video/search | Add broader video search across title, URL, channel, tags, notes, bookmarks, comments, and extracted metadata. |
| feature-041 | Planned | feature-041-video-import-export | video/tools | Add import and export workflows for saved video links. |
| feature-042 | Planned | feature-042-video-admin-bulk-actions | video/admin | Add bulk actions to the admin video table. |
| feature-043 | Planned | feature-043-public-navbar-hydration-fix | navigation/public | Fix the public navbar hydration warning by auditing the `NavigationMenuList` HTML structure. |
| feature-044 | Planned | feature-044-admin-table-pagination-rollout | admin/tables | Apply the shared client-side admin table pagination pattern to other admin tables after the video table slice proves it useful. |
| feature-045 | Planned | feature-045-saved-posts-admin-workflow | posts/admin | Define and implement the saved posts admin workflow currently represented by a placeholder. |
| feature-046 | Planned | feature-046-video-duration-api-extraction | video/metadata | Add API-backed video duration extraction while preserving failure-tolerant video saves. |
| feature-047 | Planned | feature-047-public-video-tag-filtering | video/tags | Add public `/videos` filtering by video tag once tag foundation behavior is proven, with tag UI visually distinct from channel badges. |
| feature-048 | Planned | feature-048-video-tag-management | video/tags | Define dedicated admin tag management for rename, delete, merge, ordering, or visual tag metadata. |
| feature-049 | Planned | feature-049-video-tag-confirm-dialog | video/tags | Replace the browser-native new-tag confirmation with an app-styled confirmation dialog. |
