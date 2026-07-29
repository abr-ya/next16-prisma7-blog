## 1. Data Wiring

- [x] 1.1 Fetch public video comments in `app/videos/[id]/page.tsx` through the accepted public comment helper.
- [x] 1.2 Derive the initial public video comment count from the fetched comments.
- [x] 1.3 Pass authenticated/anonymous state into the video comment composer without exposing the form to anonymous visitors.

## 2. Comment Components

- [x] 2.1 Add a `VideoCommentComposer` client component under `components/video-pages`.
- [x] 2.2 Show the current comment count with a clear zero-comment state.
- [x] 2.3 Add a plain-text textarea form with submit pending state and empty-content prevention for authenticated users.
- [x] 2.4 Create comments through `createVideoComment`, clear the form after success, update the visible count, and refresh the route.
- [x] 2.5 Show anonymous read-only comment count state with a sign-in prompt.

## 3. Page Integration

- [x] 3.1 Render the comment composer/count section on public video detail pages below the existing video action/bookmark area.
- [x] 3.2 Keep bookmark and comment composer spacing consistent on desktop and mobile.
- [x] 3.3 Export the new video comment component through existing component module boundaries only if needed by local patterns.
- [x] 3.4 Update `openspec/backlog.md` so `feature-014-video-comments-list-management` tracks the deferred comment list and own-comment edit/delete UI.

## 4. Validation

- [x] 4.1 Run `openspec validate feature-010-video-comments-public-ui --strict`.
- [x] 4.2 Run TypeScript validation with `npm run tsc`.
- [x] 4.3 Run root lint with `npm run lint`.
- [x] 4.4 Run targeted ESLint for changed `components/video-pages` files.
- [x] 4.5 Hand off `npm run build` and a browser check for authenticated/anonymous comment creation plus count display if sandbox limits make local validation unreliable.
