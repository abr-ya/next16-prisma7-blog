## Why

Published trip photos currently support likes but no text discussion. Adding signed-in comments gives viewers a lightweight way to acknowledge a moment while keeping the existing photo privacy boundary (full-size photos require authentication) intact. With feature-085's shared comment UI foundation already in place, photo comments become the second concrete target on the shared comment domain contract without building a second component set.

## What Changes

- Add `photoId` as a nullable target on the existing `Comment` model so one row holds either a video comment or a photo comment, gated by a constraint that exactly one of `videoId` / `photoId` is set.
- Extend the shared `CommentTargetType` to include `"photo"` and map each photo comment to its linked published trip as the target href and preview source.
- Add `app/_data/photo-comments.ts` with `create`, `list`, `update`, and `delete` server actions that mirror the video-comment validation, safe-link rendering, ownership, and revalidation patterns.
- Add a `HikePhotoCommentComposer` client component that consumes the shared `CommentList` and `CommentComposer` and a small `HikePhotoCommentSection` wrapper that wires the actions and revalidation.
- Surface comments inside the existing published-trip photo lightbox: a comment-count badge on each gallery card, an inline comments section below the active photo, and a signed-in composer (anonymous visitors see no comment section, matching the photo-likes boundary).
- Enforce server-side visibility through the published trip association on every read and mutation: comments are only exposed when the photo is linked to a `PUBLISHED` trip; the linked trip is used as the comment's target reference.
- Reuse the established safe comment text rendering, validation length, ownership checks, and `revalidatePath` calls for the affected trip slug.

## Capabilities

### New Capabilities

- `outdoor-photo-comments`: Signed-in comments on photos linked to a published trip, exposed through the shared comment UI foundation with published-trip visibility, owner-scoped edit/delete, and no public feed or moderation in this slice.

### Modified Capabilities

- None. The shared comment domain contract, `video-comments`, `outdoor-photos`, `outdoor-photo-likes`, `outdoor-trip-participants`, and `workspace-access-policy` requirements stay unchanged.

## Impact

- Prisma: extend `Comment` with a nullable `photoId` and `Photo` back-relation, plus a check constraint that exactly one of `videoId` / `photoId` is non-null; add a new forward migration that backfills nothing because the new column is nullable and existing rows already satisfy the constraint.
- Data: new `app/_data/photo-comments.ts` server-action module and shared `lib/comments.ts` `CommentTargetType` extension.
- UI: new `components/hike-pages/hike-photo-comment-composer.tsx` plus a thin integration into `components/hike-pages/hike-photo-gallery.tsx` (count badge + inline section).
- Public route: `/trips/[slug]` (and the legacy `/hikes/[slug]` alias) only; no new public routes.
- Admin: no changes.
- Visibility/Auth: comments are signed-in only (same boundary as `outdoor-photo-likes`); visibility is gated by the photo's `Hike.status = PUBLISHED` association.

## Non-Goals

- Unified `/comments` feed across targets (handled by the separate `public-comments-unified-feed-mvp` candidate).
- Comments on posts, markdown docs, or any non-photo, non-video target.
- Moderation, reporting, blocking, profanity filtering, edit/delete expiry, or notifications.
- Anonymous read access to photo comments.
- Changing photo publication, trip association, full-size image, like, or coordinate-review rules.
- Changing the `Comment` model to a polymorphic target table — we keep a single nullable column per concrete target.