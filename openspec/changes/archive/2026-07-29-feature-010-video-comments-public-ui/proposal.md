## Why

Public video comments already have a server-side foundation, but the video detail page does not show that a discussion exists or let signed-in users add a comment. This change adds the smallest useful public entry point: comment creation plus a visible comment count.

## What Changes

- Show the number of comments on public video detail pages.
- Let signed-in users add a plain-text comment from the video detail page.
- Update the visible count after a comment is created.
- Keep anonymous visitors read-only with a sign-in prompt instead of a comment form.
- Show useful empty-count, pending, and failure states for the comment creation workflow.

## Non-goals

- Do not change the existing `Comment` data model or add a migration.
- Do not add threaded comments, reactions, moderation queues, notifications, or rich-text comments.
- Do not render the comment list in this slice.
- Do not add comment edit or delete UI in this slice.
- Do not expose comments on video list pages in this slice.
- Do not change the placeholder `/comments` page workflow.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `video-comments`: Add public video detail comment creation and comment-count display on top of the existing server-side comment foundation.

## Impact

- Affected route: `/videos/[id]`.
- Affected public surface: video detail comment count and signed-in comment form.
- Affected helpers/components: existing `app/_data/video-comments.ts` server actions plus new `components/video-pages` UI components.
- Affected data model: none; this slice uses the existing `Comment` model and public video comment helpers.
- Follow-up: `feature-014-video-comments-list-management` will cover rendering existing comments plus own-comment edit/delete UI.
- Dependencies: none.
