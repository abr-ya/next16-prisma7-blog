## Context

`feature-006-video-comments` added the `Comment` model and server-side helpers for public video comments. Public video detail pages currently show metadata, the embedded player or thumbnail, the original URL, and authenticated bookmark controls, but they do not show comment activity or expose a way to add a comment.

## Goals / Non-Goals

**Goals:**

- Add a public video detail comments section that shows a comment count to every visitor.
- Reuse the existing `getPublicVideoComments` and `createVideoComment` helpers.
- Let authenticated users submit a new plain-text comment from the video detail page.
- Keep the UI compact and consistent with the existing bookmark manager and shadcn-style primitives.

**Non-Goals:**

- No Prisma schema or migration changes.
- No moderation, threading, replies, reactions, or rich-text editor.
- No visible comment list in this slice.
- No comment edit/delete UI in this slice.
- No comments workflow changes outside `/videos/[id]`.

## Decisions

1. Render initial comment count in the server page and hand it to a client composer.

   The accepted helper returns comments ordered for the future list UI, so this slice can derive the count from that result without adding a new data helper. The client component receives the initial count and increments local state after successful creation, then calls `router.refresh()` to reconcile with server-rendered data.

2. Add dedicated `components/video-pages` comment composer components instead of reusing the placeholder comments page.

   The existing `components/comments-page/comment-form.tsx` is a placeholder for a separate workflow. Keeping video comments in `components/video-pages` matches the current bookmark component pattern and avoids coupling this slice to the future `/comments` page.

3. Treat anonymous visitors as read-only.

   The server action already rejects anonymous mutations, but the UI should not show an unusable form. Anonymous visitors see the count and a sign-in prompt only.

4. Defer list rendering and own-comment management to `feature-014-video-comments-list-management`.

   Comment list display plus edit/delete controls is a bigger UI state surface. Splitting it keeps this feature focused on the first public write path and keeps the next feature free to solve list ergonomics and ownership affordances cleanly.

## Risks / Trade-offs

- Server action errors are intentionally generic today -> the UI will show simple failure toasts instead of exposing detailed validation reasons.
- Local count could briefly differ from refreshed server data -> call `router.refresh()` after successful creation to reconcile.
- Two active OpenSpec changes may appear in `openspec list` -> keep this change scoped to video comment UI so it does not collide with the active docs preview image change.

## Migration Plan

No data migration is required. Rollback is removing the new comment composer/count wiring while leaving the accepted server-side comment foundation intact.
