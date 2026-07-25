## Context

The project already has a generic `Comment` model related to `User`, plus a placeholder `/comments` page and placeholder `CommentForm`. Public video detail pages now support signed-in personal bookmarks through `app/_data/video-bookmarks.ts` and `components/video-pages/video-bookmark-manager.tsx`.

This change now stays at the data/server foundation layer. The visible public video discussion UI is split into `feature-007-video-comments-public-ui`.

## Goals / Non-Goals

**Goals:**

- Let server-side code list comments attached to public videos.
- Let authenticated users create, edit, and delete their own comments on public videos through server helpers/actions.
- Preserve existing public/private video visibility rules for reads and mutations.
- Keep the implementation small and close to existing video bookmark patterns.

**Non-Goals:**

- Add public video detail UI for comments.
- Implement the standalone `/comments` placeholder page.
- Add threaded replies, reactions, moderation queues, notifications, search, or rich-text comments.
- Add an admin comment-management workflow.
- Make comments available for private videos through public routes.

## Decisions

### Extend `Comment` Instead Of Creating `VideoComment`

The existing `Comment` model will be extended with an optional `videoId` relation to `Video`, plus indexes for `videoId` and `userId`/`videoId` reads. Keeping `videoId` nullable preserves any existing generic comments and avoids forcing the placeholder `/comments` concept into this slice.

Alternative considered: create a separate `VideoComment` model. That would avoid nullable fields, but it would duplicate a comment concept that already exists in the schema and make later consolidation harder.

### Server Actions Mirror Bookmark Boundaries

Comment helpers will live under `app/_data`, likely as `video-comments.ts`, and will follow the bookmark pattern:

- `getPublicVideoComments(videoId)` returns comments only after the video is public.
- `createVideoComment(values)` requires a session and a public video.
- `updateVideoComment(values)` and `deleteVideoComment(id)` require current-user ownership and a public linked video.
- Mutations revalidate `/videos/{id}`.

This keeps auth, visibility, and ownership on the server instead of relying on client UI checks.

### Plain Text Only

Comments will be plain text with trimming and a bounded length. The first slice does not need Tiptap, Markdown, uploads, mentions, or embedded media.

## Risks / Trade-offs

- Nullable `Comment.videoId` keeps old data safe but means video-comment queries must explicitly filter for `videoId` and public video visibility.
- Public comments will create visible user-generated content once the UI lands; this foundation slice limits risk to server-side ownership and visibility boundaries.
- Reusing the generic `Comment` model means the placeholder `/comments` page remains unresolved; that is already tracked separately as `feature-025-comments-page-workflow`.

## Migration Plan

- Add a nullable `videoId` field and `Video.comments` relation in Prisma.
- Add indexes that support public video comment reads and owner mutation checks.
- Generate a migration without resetting existing data.
- Regenerate the Prisma client through the existing project flow.
- Rollback can drop the nullable relation/indexes and helper changes without affecting existing non-video comments.

## Open Questions

- None for this foundation slice. Public video comment UI moves to `feature-007-video-comments-public-ui`.
