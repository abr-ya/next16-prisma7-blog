## Why

Public video detail pages should support lightweight discussion so authenticated visitors can respond to a video in context instead of using the separate placeholder comments page. This is the next social slice after timestamp bookmarks and keeps conversation distinct from personal saved moments.

## What Changes

- Add comments to public video detail pages for authenticated users.
- Allow signed-in users to create, view, update, and delete their own comments on public videos.
- Show existing public-video comments to all visitors on `/videos/{id}` after the video is confirmed public.
- Keep comment mutations scoped to the current authenticated user while allowing comments on public videos owned by another user.
- Preserve video visibility rules: private or missing videos remain unavailable through public comment workflows.
- Reuse or extend the existing `Comment` model instead of adding a parallel generic comment system.
- Update `/videos/{id}` UI with a focused discussion surface below the existing video and bookmark sections.
- Non-goals: the standalone `/comments` placeholder workflow, threaded replies, reactions, moderation queues, rich-text comments, comment search, notifications, and cross-video/global comment feeds.

## Capabilities

### New Capabilities

- `video-comments`: User-owned comments attached to public video detail pages.

### Modified Capabilities

- `video-library`: Public video detail behavior gains a video discussion surface while preserving existing video visibility and anonymous read behavior.

## Impact

- Affected routes: `/videos/{id}` public detail page and server actions or helpers used by that page.
- Affected data models: Prisma `Comment` gains a relation to `Video` or an equivalent public-video comment association, with indexes for video/user reads.
- Affected surfaces: public video detail UI for all visitors, with mutation controls only for signed-in users.
- Admin impact: no new admin workflow in this slice.
- Validation: Prisma schema/migration and client generation, `npm run tsc`, `npm run lint`, and local `npm run build` before completion.
