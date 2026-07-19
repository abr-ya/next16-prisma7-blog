## Why

Admins should be able to browse larger video libraries without the `/admin/videos` table becoming one long, hard-to-scan list. This change adds client-side pagination to the existing admin video table while keeping the current owner-scoped query and table workflow intact.

## What Changes

- Add pagination controls to the shared admin table pattern used by `VideosTable`.
- Let admins move between bounded pages of their loaded videos.
- Show enough pagination state for admins to understand the current page and available navigation.
- Keep existing admin video sorting and row actions working with the paginated table rows.
- Do not change public `/videos` browse behavior.
- Do not introduce server-side admin pagination, search, or filtering in this slice.

## Capabilities

### New Capabilities

### Modified Capabilities
- `video-library`: Admin video listing gains client-side pagination behavior for `/admin/videos`.

## Impact

- Affected route: `/admin/videos`.
- Affected admin surface: `VideosTable` and the shared `DataTable` pattern.
- Data model impact: none.
- Public surface impact: none.
- Dependencies: none expected.
