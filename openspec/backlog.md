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
| feature-002 | Planned | feature-002-video-metadata-provider-extraction | video/metadata | Add provider-aware metadata extraction for duration, provider IDs, thumbnails, and embeds while keeping saves failure-tolerant. |
| feature-003 | Planned | feature-003-video-channel-list-filters | video/channels | Add channel filtering and sorting to admin and public video lists. |
| feature-004 | Planned | feature-004-video-tags | video/tags | Add reusable video tags, video/tag assignment, badges, and tag filtering. |
| feature-005 | Planned | feature-005-video-notes-timestamps | video/notes | Add video notes and timestamped comments on video detail pages. |
| feature-006 | Planned | feature-006-video-search | video/search | Add broader video search across title, URL, channel, tags, notes, and extracted metadata. |
| feature-007 | Planned | feature-007-video-import-export | video/tools | Add import and export workflows for saved video links. |
| feature-008 | Planned | feature-008-video-admin-bulk-actions | video/admin | Add bulk actions to the admin video table. |
| feature-009 | Planned | feature-009-public-navbar-hydration-fix | navigation/public | Fix the public navbar hydration warning by auditing the `NavigationMenuList` HTML structure. |
| feature-010 | Planned | feature-010-admin-table-pagination-rollout | admin/tables | Apply the shared client-side admin table pagination pattern to other admin tables after the video table slice proves it useful. |
