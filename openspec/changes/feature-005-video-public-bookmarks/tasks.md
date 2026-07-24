## 1. Data Model

- [x] 1.1 Add `VideoBookmark` to `prisma/schema.prisma` with relations to `User` and `Video`, owner/video indexes, and cascade deletion from user/video.
- [x] 1.2 Create the Prisma migration for the bookmark table using the existing project flow.
- [x] 1.3 Regenerate the Prisma client without editing `generated/prisma` manually.

## 2. Server Behavior

- [ ] 2.1 Add bookmark data helpers/actions under `app/_data` with authenticated create, update, delete, and current-user list behavior.
- [ ] 2.2 Validate bookmark inputs: public video id, non-negative integer timestamp seconds, bounded label/note text, and current-user ownership.
- [ ] 2.3 Revalidate `/videos/{id}` after bookmark create, update, and delete mutations.
- [ ] 2.4 Add timestamp URL formatting helper coverage for supported external video URLs.

## 3. Public Video Detail UI

- [ ] 3.1 Fetch the current session and current user's bookmarks in `app/videos/[id]/page.tsx` only after the video is confirmed public.
- [ ] 3.2 Add a client bookmark manager component for creating, listing, editing, and deleting bookmarks.
- [ ] 3.3 Keep anonymous visitors on the existing read-only video detail without bookmark mutation controls.
- [ ] 3.4 Render bookmark timestamps as links to the external video moment when supported, with stable empty/loading/error states.

## 4. Documentation And Validation

- [ ] 4.1 Update OpenSpec/backlog state or related feature checklist notes to reflect implementation progress.
- [ ] 4.2 Run `npm run tsc`.
- [ ] 4.3 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 4.4 Ask the user to run local `npm run build` and paste the result before completion.
- [ ] 4.5 Perform a manual browser check for signed-in bookmark management, anonymous read-only detail, private-video not-found behavior, and timestamp links.
