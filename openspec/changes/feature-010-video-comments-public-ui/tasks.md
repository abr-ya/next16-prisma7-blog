## 1. Data Wiring

- [ ] 1.1 Fetch public video comments in `app/videos/[id]/page.tsx` through the accepted public comment helper.
- [ ] 1.2 Pass current user ownership context into the video comments UI without exposing mutation controls to anonymous visitors.

## 2. Comment Components

- [ ] 2.1 Add a `VideoCommentManager` client component under `components/video-pages`.
- [ ] 2.2 Add a comment form with plain-text textarea, submit pending state, and empty-content prevention.
- [ ] 2.3 Add a comment list item UI with author, creation date, readable multiline content, and own-comment edit/delete controls.
- [ ] 2.4 Support inline or dialog-based editing for owned comments with cancel/save states.
- [ ] 2.5 Support deleting owned comments with pending and failure states.
- [ ] 2.6 Show anonymous read-only empty/comment states with a sign-in prompt.

## 3. Page Integration

- [ ] 3.1 Render the comments section on public video detail pages below the existing video action/bookmark area.
- [ ] 3.2 Keep bookmark and comment UI spacing consistent on desktop and mobile.
- [ ] 3.3 Export new video comment components through existing component module boundaries only if needed by local patterns.

## 4. Validation

- [ ] 4.1 Run `openspec validate feature-010-video-comments-public-ui --strict`.
- [ ] 4.2 Run TypeScript validation with `npm run tsc`.
- [ ] 4.3 Run root lint with `npm run lint`.
- [ ] 4.4 Run targeted ESLint for changed `components/video-pages` files.
- [ ] 4.5 Hand off `npm run build` and a browser check for authenticated/anonymous public video comments if sandbox limits make local validation unreliable.
