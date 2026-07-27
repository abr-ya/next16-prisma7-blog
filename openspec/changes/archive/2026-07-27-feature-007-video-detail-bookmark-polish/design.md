## Context

The public video detail route currently renders the video URL in its own bordered block, then a separate `Open video` button, then the signed-in user's bookmark manager. Bookmarks are user-owned: reads return only the current user's bookmarks, and update/delete operations enforce `userId` ownership on the server. `feature-006-video-comments` added the comments server foundation, but the visible comments UI is intentionally deferred until after this bookmark/detail polish.

## Goals / Non-Goals

**Goals:**

- Improve the public video detail layout before adding comments UI.
- Keep the video URL and open action visually connected.
- Place bookmarks directly below the video action row.
- Let signed-in users switch between their own bookmarks and all bookmarks for the same public video.
- Keep bookmark creation in a dialog to reduce page weight.
- Preserve server-side ownership enforcement for update and delete.

**Non-Goals:**

- Add public comment UI.
- Add anonymous bookmark visibility.
- Add bookmark privacy controls.
- Add moderation, reporting, reactions, notifications, or bookmark search.
- Change bookmark ownership or allow users to edit another user's bookmark.

## Decisions

### Use Existing Bookmark Model

The existing `VideoBookmark` model already stores `userId`, `videoId`, timestamp, label, and note. This feature should add read behavior for all bookmarks on a public video rather than introduce a new model or migration.

Alternative considered: add bookmark visibility settings. That would be more flexible, but it would expand scope into privacy controls and schema work; this slice treats all public-video bookmarks as visible to signed-in visitors while mutations remain private to the owner.

### Server Reads Separate Ownership From Visibility

The server helper layer should expose a public-video-safe read for all bookmarks and preserve the current-user read/mutation boundaries. Read helpers must verify the linked video is public. Mutations must continue to require the current user's `userId` and find existing bookmarks by both bookmark id and owner.

### Client Tabs For My/All Views

The bookmark manager should receive enough data to render both views without relying on client-side access to private data. A local tab state can switch between `My bookmarks` and `All bookmarks`, and the manager can use ownership metadata to decide whether edit/delete controls appear for a row.

### Dialog For Bookmark Creation

Bookmark creation should move into the existing `Dialog` UI primitive. The bookmark list remains visible while creation fields stay hidden until the user activates the add action. After a successful create, both views should update consistently and the dialog should close.

## Risks / Trade-offs

- Public signed-in visibility for all bookmarks changes prior expectations that bookmark lists were personal only. Mitigation: keep anonymous visitors read-only without bookmark surfaces and keep mutations owner-only.
- Showing all bookmarks may reveal user-provided labels or notes. Mitigation: document the behavior in the spec and avoid adding anonymous visibility in this slice.
- Updating client state across `My` and `All` views can drift after create/update/delete. Mitigation: update local state in both collections and call `router.refresh()` after mutations.
- The URL/action row may overflow on small screens. Mitigation: use responsive wrapping and truncation so URL text and button remain coherent on mobile.

## Migration Plan

No Prisma schema or migration is expected. Rollback can restore the current bookmark read helper usage, inline creation form, and separate URL/button layout without data changes.

## Open Questions

- None for planning. The intended behavior is signed-in-only `All bookmarks`, with owner-only edit/delete controls.
