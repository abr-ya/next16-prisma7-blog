## Why

Public video detail pages should show the discussion that already exists instead of stopping at a comment count and "coming soon" message. This slice makes comments readable to visitors while keeping management actions for later planned features.

## What Changes

- Render the public video comment list on `/videos/{id}` using the existing public-video comment read helper.
- Show each comment's plain text, creation date, user display name, and user avatar or fallback avatar state.
- Keep the existing comment count and signed-in comment composer behavior.
- Replace the "comment list coming soon" copy with a real empty/list state.
- Non-goals: comment editing, comment deletion, 24-hour mutation limits, threaded replies, reactions, moderation, notifications, search, or exposing comments on video list pages.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `video-comments`: Public video detail pages render readable comment lists for comments attached to public videos.

## Impact

- Affected public route: `/videos/{id}`.
- Affected public UI: video detail comment section under the existing video actions/bookmarks area.
- Affected helpers/components: existing `app/_data/video-comments.ts` read data shape plus `components/video-pages` comment UI.
- Affected data model: none; this slice uses the existing `Comment` model with `videoId`, `createdAt`, and related user name/image fields.
