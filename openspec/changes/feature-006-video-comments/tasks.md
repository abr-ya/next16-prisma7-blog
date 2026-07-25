## 1. Data Model

- [x] 1.1 Extend `prisma/schema.prisma` so `Comment` can be linked to a `Video` while preserving existing generic comments.
- [x] 1.2 Add indexes for public video comment reads and current-user mutation checks.
- [x] 1.3 Create the Prisma migration with the existing project flow.
- [x] 1.4 Regenerate the Prisma client without editing `generated/prisma` manually.

## 2. Server Behavior

- [x] 2.1 Add video comment data helpers/actions under `app/_data`.
- [x] 2.2 Validate comment inputs: public video id, authenticated user for mutations, non-empty trimmed content, and bounded comment length.
- [x] 2.3 Enforce current-user ownership for update and delete mutations.
- [x] 2.4 Keep comments unavailable through public workflows for private or missing videos.
- [x] 2.5 Revalidate `/videos/{id}` after create, update, and delete mutations.

## 3. Public Video Detail UI

- [ ] 3.1 Fetch public video comments in `app/videos/[id]/page.tsx` only after the video is confirmed public.
- [ ] 3.2 Add a dedicated video comments client component for creating, listing, editing, and deleting comments.
- [ ] 3.3 Show existing comments to anonymous visitors without mutation controls.
- [ ] 3.4 Show create controls to signed-in users and edit/delete controls only for comments owned by the current user.
- [ ] 3.5 Render stable empty, pending, and error states without disrupting the existing video detail and bookmark sections.

## 4. Documentation And Validation

- [x] 4.1 Update OpenSpec/backlog state or related feature checklist notes to reflect implementation progress.
- [x] 4.2 Run `openspec validate feature-006-video-comments --strict`.
- [x] 4.3 Run `npm run tsc`.
- [x] 4.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 4.5 Ask the user to run local `npm run build` and paste the result before completion.
- [ ] 4.6 Perform a manual browser check for signed-in comment management, anonymous read-only comments, private-video not-found behavior, and coexistence with bookmark controls.
