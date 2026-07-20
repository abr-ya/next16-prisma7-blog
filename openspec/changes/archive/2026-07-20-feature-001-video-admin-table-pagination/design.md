## Context

`/admin/videos` already loads the authenticated admin's full video list server-side and renders it through `VideosTable`, a client component built on the shared `DataTable` wrapper around TanStack Table. The current table supports sorting and row actions, but it renders every loaded row at once.

This change keeps the existing owner-scoped server query unchanged and adds client-side pagination to the table layer. That is enough for the current admin scale and avoids changing data contracts before search/filtering or much larger datasets require server-side paging.

## Goals / Non-Goals

**Goals:**
- Add predictable page navigation to the admin videos table.
- Keep existing sorting and row actions working on paginated rows.
- Reuse the shared `DataTable` pattern so future admin tables can opt into the same client-side behavior.
- Preserve the current authenticated server data boundary.

**Non-Goals:**
- No database schema changes.
- No server-side admin pagination, search, or filtering.
- No public `/videos` behavior changes.
- No changes to video ownership, visibility, or authorization rules.

## Decisions

- Implement pagination in the client table layer using TanStack Table's pagination row model.
  - Rationale: the existing `DataTable` already owns TanStack table setup, and sorting is already client-side.
  - Alternative considered: add route query parameters and server-side `skip`/`take`. That is more appropriate once admin search/filtering or larger data volumes make full-list loading a real problem.

- Keep admin pagination local to the table state rather than URL-driven.
  - Rationale: `/admin/videos` is an authenticated management view where quick row work matters more than shareable browse URLs.
  - Alternative considered: query-string-backed admin pagination. That would add route state and server/client coordination without a current user-facing need.

- Add a small configurable page size with a sensible default.
  - Rationale: the videos table has wide columns and action buttons, so limiting visible rows improves scanning without changing the underlying list query.
  - Alternative considered: fixed page size only. A prop keeps the shared table reusable without adding much surface area.

## Risks / Trade-offs

- Client-side pagination still loads all owned videos -> acceptable for this slice; revisit server-side pagination if admin video count grows enough to affect load time.
- Sorting and pagination interaction can confuse users if page position is stale after sorting -> reset to the first page when sort state changes or rely on TanStack state updates that keep navigation valid.
- Shared `DataTable` changes can affect other tables -> keep pagination opt-in or default behavior compatible for current callers.

## Migration Plan

No data migration is required. The implementation can be deployed as a UI-only change and rolled back by reverting the component changes.

## Open Questions

- None for this slice.
