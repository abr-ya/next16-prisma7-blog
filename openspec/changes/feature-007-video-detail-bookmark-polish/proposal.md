## Why

Public video detail pages should make the video action and bookmark workflow faster to scan before the comment UI lands. This change improves the existing bookmark experience first, including a deliberate shift from strictly personal bookmark lists to a signed-in view that can also show all bookmarks for the public video.

## What Changes

- Keep the external video URL and `Open video` action in one horizontal row on `/videos/{id}` when space allows.
- Move the bookmark surface directly below the video URL/action row so saved moments appear before later discussion UI.
- Add a `My bookmarks` / `All bookmarks` switch for signed-in visitors.
- Show bookmarks in chronological order by timestamp, with stable created-time ordering for equal timestamps.
- Keep edit and delete actions limited to the current user's bookmarks, even in the `All bookmarks` view.
- Move bookmark creation into a dialog opened from the bookmark surface.
- Defer the public comments UI to `feature-008-video-comments-public-ui`.
- Non-goals: public comments UI, anonymous bookmark viewing, bookmark privacy settings, moderation, reactions, notifications, search, or schema changes unless implementation discovers the current model cannot support the read efficiently.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `video-bookmarks`: Bookmark read and UI behavior changes from only current-user lists to signed-in `My bookmarks` and `All bookmarks` views, while preserving mutation ownership.
- `video-library`: Public video detail layout changes the placement and grouping of the video URL, open action, and bookmark surface.

## Impact

- Affected routes: `/videos/{id}` public video detail page.
- Affected components: `components/video-pages/video-bookmark-manager.tsx` and any small supporting components needed for dialog/tabs.
- Affected data helpers: `app/_data/video-bookmarks.ts` needs an all-bookmarks read helper or equivalent query for public videos.
- Affected data models: expected none; existing `VideoBookmark` ownership remains intact.
- Public surface: signed-in public video visitors can see all bookmark entries for a public video, but only mutate their own.
- Admin impact: none.
- Validation: `npm run tsc`, `npm run lint`, targeted ESLint for changed component/helper files if needed, local `npm run build`, and a manual browser check for desktop/mobile layout and bookmark modes.
