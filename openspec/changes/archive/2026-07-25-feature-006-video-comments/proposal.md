## Why

Public video comments need a durable server-side foundation before the public detail UI is added. This slice creates the data model and server behavior for public-video comments while keeping the visible discussion interface as the next feature.

## What Changes

- Add the data model support needed to attach comments to public videos.
- Add server helpers/actions that can list public-video comments and let signed-in users create, update, and delete their own comments on public videos.
- Keep comment mutations scoped to the current authenticated user while allowing comments on public videos owned by another user.
- Preserve video visibility rules: private or missing videos remain unavailable through public comment workflows.
- Reuse or extend the existing `Comment` model instead of adding a parallel generic comment system.
- Non-goals: public video comment UI, the standalone `/comments` placeholder workflow, threaded replies, reactions, moderation queues, rich-text comments, comment search, notifications, and cross-video/global comment feeds.

## Capabilities

### New Capabilities

- `video-comments`: Server-side foundation for user-owned comments attached to public videos.

### Modified Capabilities

None.

## Impact

- Affected routes: no route UI changes in this slice; future `/videos/{id}` UI work will consume these helpers.
- Affected data models: Prisma `Comment` gains a relation to `Video` or an equivalent public-video comment association, with indexes for video/user reads.
- Affected surfaces: server-side public video comment data helpers/actions only.
- Admin impact: no new admin workflow in this slice.
- Follow-up: `feature-007-video-comments-public-ui` will add the visible `/videos/{id}` discussion surface.
- Validation: Prisma schema/migration and client generation, `npm run tsc`, `npm run lint`, and local migration/build handoff before completion.
