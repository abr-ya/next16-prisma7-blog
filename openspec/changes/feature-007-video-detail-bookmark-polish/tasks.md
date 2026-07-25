## 1. Planning And Data Reads

- [ ] 1.1 Update the backlog so this bookmark/detail polish slice is `feature-007` and public comments UI moves to `feature-008`.
- [ ] 1.2 Extend `app/_data/video-bookmarks.ts` with a public-video-safe all-bookmarks read helper for signed-in visitors.
- [ ] 1.3 Include ownership metadata needed for the client to distinguish current-user bookmarks from other users' bookmarks.
- [ ] 1.4 Preserve existing owner-only create, update, and delete behavior.

## 2. Public Video Detail Layout

- [ ] 2.1 Update `/videos/{id}` data loading so signed-in visitors receive both `My bookmarks` and `All bookmarks` data.
- [ ] 2.2 Render the video URL and `Open video` action in one responsive row.
- [ ] 2.3 Move the bookmark surface directly below the video URL/action row.
- [ ] 2.4 Preserve anonymous read-only behavior without bookmark controls.

## 3. Bookmark Manager UI

- [ ] 3.1 Add a `My bookmarks` / `All bookmarks` switch to the bookmark manager.
- [ ] 3.2 Render bookmark lists chronologically by timestamp and then creation time in both views.
- [ ] 3.3 Show edit and delete controls only for bookmarks owned by the current user.
- [ ] 3.4 Move the bookmark creation form into a dialog opened from the bookmark surface.
- [ ] 3.5 Keep create, update, delete, empty, pending, and error states stable after switching views.

## 4. Validation

- [ ] 4.1 Run `openspec validate feature-007-video-detail-bookmark-polish --strict`.
- [ ] 4.2 Run `npm run tsc`.
- [ ] 4.3 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 4.4 Ask the user to run local `npm run build` and paste the result before completion.
- [ ] 4.5 Perform a manual browser check for desktop/mobile URL row layout, bookmark placement, my/all switching, dialog creation, owner-only controls, and anonymous read-only behavior.
