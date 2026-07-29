## Context

`feature-006-video-comments` added the `Comment` model and server-side helpers for public video comments. Public video detail pages currently show metadata, the embedded player or thumbnail, the original URL, and authenticated bookmark controls, but they do not render comments or expose the comment mutation actions.

## Goals / Non-Goals

**Goals:**

- Add a public video detail comments section that works for both anonymous and authenticated visitors.
- Reuse the existing `getPublicVideoComments`, `createVideoComment`, `updateVideoComment`, and `deleteVideoComment` helpers.
- Keep ownership checks on the server and mirror them in the UI by showing edit/delete controls only for the current user's comments.
- Keep the UI compact and consistent with the existing bookmark manager and shadcn-style primitives.

**Non-Goals:**

- No Prisma schema or migration changes.
- No moderation, threading, replies, reactions, or rich-text editor.
- No comments workflow changes outside `/videos/[id]`.

## Decisions

1. Render initial comments in the server page and hand them to a client manager.

   The video detail page already resolves the video and current session server-side. Fetching comments there keeps public visibility checks close to the existing data helper and gives the client component a stable initial list. The client manager can then update local state after server actions and call `router.refresh()` to reconcile with server-rendered data.

2. Add dedicated `components/video-pages` comment components instead of reusing the placeholder comments page.

   The existing `components/comments-page/comment-form.tsx` is a placeholder for a separate workflow. Keeping video comments in `components/video-pages` matches the current bookmark component pattern and avoids coupling this slice to the future `/comments` page.

3. Treat anonymous visitors as read-only.

   The server actions already reject anonymous mutations, but the UI should not show unusable mutation controls. Anonymous visitors see the comment list, empty state, and a sign-in prompt only.

4. Use plain textarea editing with optimistic local replacement only after successful server action.

   Comments are plain text and capped by the existing server helper. Waiting for the server result keeps authorization, validation, and revalidation behavior authoritative while still giving immediate local UI feedback after success.

## Risks / Trade-offs

- Server action errors are intentionally generic today -> the UI will show simple failure toasts instead of exposing detailed validation reasons.
- Local state could briefly differ from refreshed server data -> call `router.refresh()` after successful mutations to reconcile.
- Two active OpenSpec changes may appear in `openspec list` -> keep this change scoped to video comment UI so it does not collide with the active docs preview image change.

## Migration Plan

No data migration is required. Rollback is removing the new video comment UI component wiring while leaving the accepted server-side comment foundation intact.
