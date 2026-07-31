## 1. Planning State

- [x] 1.1 Mark `feature-014-video-comments-list-rendering` as in progress in `openspec/backlog.md`.

## 2. Comment List Data Flow

- [x] 2.1 Pass the existing public video comments from `/videos/{id}` into the video comment UI.
- [x] 2.2 Keep comment count behavior derived from the same comment set after initial render.

## 3. Comment List UI

- [x] 3.1 Render a public comment list showing comment text, creation date, author display name, and avatar/fallback.
- [x] 3.2 Replace the "comment list coming soon" copy with real empty and populated list states.
- [x] 3.3 Keep signed-in comment creation and anonymous sign-in prompt behavior unchanged.
- [x] 3.4 Keep the component layout responsive and consistent with the existing bookmark/comment section styling.

## 4. Validation

- [x] 4.1 Run `openspec validate feature-014-video-comments-list-rendering --strict`.
- [x] 4.2 Run `npm run tsc`.
- [x] 4.3 Run `npm run lint`.
- [x] 4.4 Run targeted ESLint for changed files outside the root lint scope.
- [x] 4.5 Run `git diff --check`.
- [x] 4.6 Confirm `npm run build` and browser comment-list rendering through user-provided local validation.
