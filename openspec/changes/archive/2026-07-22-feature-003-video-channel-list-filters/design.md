## Context

The video library already stores an optional `Video.channelId` relation and loads channel data for admin and public video lists. `/admin/videos` renders all owned videos in a client `VideosTable` with TanStack sorting and client-side pagination. `/videos` is a server page that parses `sort` and `page` query params, calls `getPublicVideos`, and builds shareable pagination links.

This feature should add channel filtering without changing the Prisma schema or weakening visibility rules. Video tags remain the next separate backlog feature.

## Goals / Non-Goals

**Goals:**

- Let admins filter the loaded owned video table by channel, including a clear all-channels state.
- Let public visitors filter `/videos` by channel through URL query state.
- Preserve public `sort`, `page`, and channel filter state across control and pagination links.
- Keep public video queries scoped to `PUBLIC` videos.
- Use stable channel ordering for filter options.

**Non-Goals:**

- Do not add video tags, tag assignment, tag badges, or tag filtering.
- Do not add full-text search.
- Do not add provider filters.
- Do not add public channel detail pages.
- Do not add or migrate database fields.

## Decisions

1. Use existing channel data and add no schema migration.
   - Rationale: `Video.channelId` and `VideoChannel` already support this workflow.
   - Alternative considered: add channel slugs or public channel pages first. That would make URLs prettier, but it expands the feature beyond list filtering.

2. Keep admin filtering client-side inside `VideosTable`.
   - Rationale: `/admin/videos` already loads the authenticated user's owned videos, and the table already owns client-side sorting and pagination.
   - Alternative considered: make `/admin/videos` parse query params and requery server-side. That adds route state and server round trips without a current need.

3. Keep public filtering server-side in `getPublicVideos`.
   - Rationale: public pagination metadata must reflect the filtered result count, and public browse state is already URL-driven.
   - Alternative considered: filter the visible page client-side. That would make counts and pagination misleading.

4. Represent the public channel filter with a `channel` query param containing a channel id.
   - Rationale: channel ids already exist and avoid introducing slug uniqueness or migration concerns.
   - Alternative considered: use channel names in URLs. Names are readable but mutable and can collide.

5. Public channel filter options should come from public channels attached to at least one public video.
   - Rationale: this avoids exposing empty or hidden channel options in public browse controls.
   - Alternative considered: list every channel. That can expose admin-only organization noise.

## Risks / Trade-offs

- Hidden channels assigned to public videos can create confusing public browse behavior -> Public filter options should include only channels that are safe to show publicly, while the underlying public video query must remain `visibility: PUBLIC`.
- Channel ids in public URLs are opaque -> This keeps the slice migration-free; public channel pages or slugs can be a later feature if needed.
- Admin client-side filtering resets pagination -> Acceptable, because filter changes should return the admin to the first filtered page rather than leaving them on an empty later page.
- More public controls can crowd mobile layouts -> Use compact controls and wrap them predictably with existing button/select primitives.
