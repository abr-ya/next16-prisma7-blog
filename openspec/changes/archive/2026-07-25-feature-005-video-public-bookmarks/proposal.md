## Why

Authenticated visitors should be able to save useful moments from public videos so they can return to exact timestamps later. This is the next near-term video detail slice after the video admin, metadata, channel, and tag foundations are in place.

## What Changes

- Add timestamp bookmarks on public video detail pages for authenticated users.
- Allow an authenticated user to create, view, update, and delete their own bookmarks for a public video.
- Store each bookmark with a timestamp offset and optional short note/title.
- Keep bookmarks scoped to the saving user while allowing the target video to belong to another owner.
- Preserve public video visibility rules: private or missing videos remain unavailable through public bookmark workflows.
- Add UI on `/videos/{id}` for signed-in users to manage their bookmarks for that public video.
- Non-goals: public comments/discussion, public tag filtering, full video search, bookmark sharing between users, and import/export workflows.

## Capabilities

### New Capabilities

- `video-bookmarks`: User-owned timestamp bookmarks attached to public video detail pages.

### Modified Capabilities

- `video-library`: Public video detail behavior gains an authenticated bookmark surface while preserving existing read-only behavior for visitors.

## Impact

- Affected routes: `/videos/{id}` public detail page and server actions or route handlers used by that page.
- Affected data models: Prisma schema gains a user-owned video bookmark model related to videos and app users.
- Affected surfaces: public video detail UI for signed-in users; anonymous visitors keep the existing read-only public video detail.
- Validation: Prisma schema/client generation, `npm run tsc`, `npm run lint`, and local `npm run build` before completion.
