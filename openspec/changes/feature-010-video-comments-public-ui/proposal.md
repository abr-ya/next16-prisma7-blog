## Why

Public video comments already have a server-side foundation, but visitors cannot see or use that workflow from the video detail page. This change makes comments visible and manageable where people watch the public video.

## What Changes

- Add a comments section to public video detail pages.
- Show existing public video comments in chronological order.
- Let signed-in users add a plain-text comment from the video detail page.
- Let signed-in users edit and delete their own comments.
- Keep anonymous visitors read-only with a sign-in prompt instead of mutation controls.
- Show useful empty, pending, and failure states for the comment workflow.

## Non-goals

- Do not change the existing `Comment` data model or add a migration.
- Do not add threaded comments, reactions, moderation queues, notifications, or rich-text comments.
- Do not expose comments on video list pages in this slice.
- Do not change the placeholder `/comments` page workflow.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `video-comments`: Add the public video detail UI behavior for reading and managing video comments on top of the existing server-side comment foundation.

## Impact

- Affected route: `/videos/[id]`.
- Affected public surface: video detail comments section for anonymous and authenticated users.
- Affected helpers/components: existing `app/_data/video-comments.ts` server actions plus new `components/video-pages` UI components.
- Affected data model: none; this slice uses the existing `Comment` model and public video comment helpers.
- Dependencies: none.
