## 1. Planning State

- [ ] 1.1 Mark `feature-014-video-comments-list-rendering` as in progress in `openspec/backlog.md`.

## 2. Comment List Data Flow

- [ ] 2.1 Pass the existing public video comments from `/videos/{id}` into the video comment UI.
- [ ] 2.2 Keep comment count behavior derived from the same comment set after initial render.

## 3. Comment List UI

- [ ] 3.1 Render a public comment list showing comment text, creation date, author display name, and avatar/fallback.
- [ ] 3.2 Replace the "comment list coming soon" copy with real empty and populated list states.
- [ ] 3.3 Keep signed-in comment creation and anonymous sign-in prompt behavior unchanged.
- [ ] 3.4 Keep the component layout responsive and consistent with the existing bookmark/comment section styling.

## 4. Validation

- [ ] 4.1 Run `openspec validate feature-014-video-comments-list-rendering --strict`.
- [ ] 4.2 Run `npm run tsc`.
- [ ] 4.3 Run `npm run lint`.
- [ ] 4.4 Run targeted ESLint for changed files outside the root lint scope.
- [ ] 4.5 Run `git diff --check`.
- [ ] 4.6 Hand off `npm run build` and a browser check for anonymous/signed-in public video comment list rendering if sandbox limits make local validation unreliable.
