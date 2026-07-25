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
- `feature-005` through `feature-019` are reserved for the next near-term video detail and social slices.
- `feature-020+` rows are parked backlog ideas; promote or split them into the reserved range only when they become the next implementation candidate and before creating an OpenSpec change.

## Features

| ID | Status | Change | Area | Summary |
| --- | --- | --- | --- | --- |
| feature-001 | Done | feature-001-video-admin-table-pagination | video/admin | Add client-side pagination to the admin video table, starting from the shared DataTable pattern. |
| feature-002 | Done | feature-002-video-metadata-provider-extraction | video/metadata | Add provider-aware metadata extraction for provider IDs, thumbnails, and embeds while keeping saves failure-tolerant. |
| feature-003 | Done | feature-003-video-channel-list-filters | video/channels | Add channel filtering and sorting to admin and public video lists. |
| feature-004 | Done | feature-004-video-tags-foundation | video/tags | Add reusable video tags, admin video/tag assignment, and tag badges without public tag filtering. |
| feature-005 | Done | feature-005-video-public-bookmarks | video/bookmarks | Add public-video timestamp bookmarks so authenticated people can save linked moments in each other's public videos. |
| feature-006 | Done | feature-006-video-comments | video/comments | Add the public-video comments data model and server actions as a foundation before UI work. |
| feature-007 | Planned | feature-007-video-comments-public-ui | video/comments | Add the public video detail comments UI for reading comments and signed-in comment management. |
| feature-020 | Planned | feature-020-video-search | video/search | Add broader video search across title, URL, channel, tags, notes, bookmarks, comments, and extracted metadata. |
| feature-021 | Planned | feature-021-video-import-export | video/tools | Add import and export workflows for saved video links. |
| feature-022 | Planned | feature-022-video-admin-bulk-actions | video/admin | Add bulk actions to the admin video table. |
| feature-023 | Planned | feature-023-public-navbar-hydration-fix | navigation/public | Fix the public navbar hydration warning by auditing the `NavigationMenuList` HTML structure. |
| feature-024 | Planned | feature-024-admin-table-pagination-rollout | admin/tables | Apply the shared client-side admin table pagination pattern to other admin tables after the video table slice proves it useful. |
| feature-025 | Planned | feature-025-comments-page-workflow | comments/public | Turn the placeholder comments page into a functional comments workflow backed by the existing comment model. |
| feature-026 | Planned | feature-026-saved-posts-admin-workflow | posts/admin | Define and implement the saved posts admin workflow currently represented by a placeholder. |
| feature-027 | Planned | feature-027-video-duration-api-extraction | video/metadata | Add API-backed video duration extraction while preserving failure-tolerant video saves. |
| feature-028 | Planned | feature-028-public-video-tag-filtering | video/tags | Add public `/videos` filtering by video tag once tag foundation behavior is proven, with tag UI visually distinct from channel badges. |
| feature-029 | Planned | feature-029-video-tag-management | video/tags | Define dedicated admin tag management for rename, delete, merge, ordering, or visual tag metadata. |
| feature-030 | Planned | feature-030-video-tag-confirm-dialog | video/tags | Replace the browser-native new-tag confirmation with an app-styled confirmation dialog. |
