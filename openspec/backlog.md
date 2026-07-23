# OpenSpec Backlog

This backlog tracks project-wide planned features with one stable sequence.

Use the same `feature-<3 digits>-<area>-<short-action>` name for the OpenSpec change directory and git branch when possible.

## Status Values

- `Planned`: identified, not proposed yet.
- `Proposed`: OpenSpec change exists, not implemented.
- `In Progress`: implementation has started.
- `Done`: implemented and archived into accepted specs.
- `Cancelled`: intentionally not happening; do not reuse the number.

## Features

| ID | Status | Change | Area | Summary |
| --- | --- | --- | --- | --- |
| feature-001 | Done | feature-001-video-admin-table-pagination | video/admin | Add client-side pagination to the admin video table, starting from the shared DataTable pattern. |
| feature-002 | Done | feature-002-video-metadata-provider-extraction | video/metadata | Add provider-aware metadata extraction for provider IDs, thumbnails, and embeds while keeping saves failure-tolerant. |
| feature-003 | Done | feature-003-video-channel-list-filters | video/channels | Add channel filtering and sorting to admin and public video lists. |
| feature-004 | Done | feature-004-video-tags-foundation | video/tags | Add reusable video tags, admin video/tag assignment, and tag badges without public tag filtering. |
| feature-005 | Planned | feature-005-video-notes-timestamps | video/notes | Add video notes and timestamped comments on video detail pages. |
| feature-006 | Planned | feature-006-video-search | video/search | Add broader video search across title, URL, channel, tags, notes, and extracted metadata. |
| feature-007 | Planned | feature-007-video-import-export | video/tools | Add import and export workflows for saved video links. |
| feature-008 | Planned | feature-008-video-admin-bulk-actions | video/admin | Add bulk actions to the admin video table. |
| feature-009 | Planned | feature-009-public-navbar-hydration-fix | navigation/public | Fix the public navbar hydration warning by auditing the `NavigationMenuList` HTML structure. |
| feature-010 | Planned | feature-010-admin-table-pagination-rollout | admin/tables | Apply the shared client-side admin table pagination pattern to other admin tables after the video table slice proves it useful. |
| feature-011 | Planned | feature-011-comments-page-workflow | comments/public | Turn the placeholder comments page into a functional comments workflow backed by the existing comment model. |
| feature-012 | Planned | feature-012-saved-posts-admin-workflow | posts/admin | Define and implement the saved posts admin workflow currently represented by a placeholder. |
| feature-013 | Planned | feature-013-video-duration-api-extraction | video/metadata | Add API-backed video duration extraction while preserving failure-tolerant video saves. |
| feature-014 | Planned | feature-014-public-video-tag-filtering | video/tags | Add public `/videos` filtering by video tag once tag foundation behavior is proven, with tag UI visually distinct from channel badges. |
| feature-015 | Planned | feature-015-video-tag-management | video/tags | Define dedicated admin tag management for rename, delete, merge, ordering, or visual tag metadata. |
| feature-016 | Planned | feature-016-video-tag-confirm-dialog | video/tags | Replace the browser-native new-tag confirmation with an app-styled confirmation dialog. |
