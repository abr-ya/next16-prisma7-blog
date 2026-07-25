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

## 3. Documentation And Validation

- [x] 3.1 Update OpenSpec/backlog state or related feature checklist notes to reflect implementation progress.
- [x] 3.2 Run `openspec validate feature-006-video-comments --strict`.
- [x] 3.3 Run `npm run tsc`.
- [x] 3.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [x] 3.5 Ask the user to apply the migration locally with the existing Prisma flow.
- [x] 3.6 Ask the user to run local `npm run build` and paste the result before completion.
