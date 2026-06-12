# Video Feature Plan

## Context

The project already has a Next.js App Router structure with Prisma models for posts, markdown docs, links, categories, users, and logs. Videos should be a separate entity rather than an extension of `Link`, because they need a video-specific date, future detail pages, folders, tags, comments, and timestamp notes.

## Goal

Add a video library where an authenticated user can save video links with:

- title
- URL
- video date
- added date

Later phases should support folders, tags, a public/admin detail page, comments, and timestamp notes.

## Data Model Direction

### MVP model

Add a new `Video` model:

```prisma
model Video {
  id        String   @id @default(uuid())
  title     String
  url       String
  videoDate DateTime
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  @@index([userId])
  @@index([videoDate])
}
```

Also add `videos Video[]` to `User`.

Notes:

- `createdAt` is the added date.
- `videoDate` is the date of the video itself.
- Keep URL as plain `String` for the first version, validated in the form with Zod.
- Do not add folders/tags/comments yet in the first migration.

### Future models

Folder support:

```prisma
model VideoFolder {
  id        String   @id @default(uuid())
  name      String
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  videos    Video[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Tags:

- Prefer normalized tags over `String[]` if tags will be reused, filtered, renamed, or colored.
- Use `VideoTag` plus a join model like `TagsToVideos`.

Comments and timestamp notes:

- Use a dedicated `VideoNote` model.
- Store optional timestamp in seconds, for example `timestampSeconds Int?`.
- Keep general comments as notes with `timestampSeconds = null`.

### Priority visibility model

Before public video pages are added, extend `Video` with an explicit visibility field:

```prisma
enum VideoVisibility {
  PRIVATE
  PUBLIC
}

model Video {
  id         String          @id @default(uuid())
  title      String
  url        String
  videoDate  DateTime
  visibility VideoVisibility @default(PRIVATE)
  userId     String
  user       User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt  DateTime        @default(now())
  updatedAt  DateTime        @default(now()) @updatedAt

  @@index([userId])
  @@index([videoDate])
  @@index([visibility])
}
```

Notes:

- New videos should default to `PRIVATE`.
- Admin pages should show both `PRIVATE` and `PUBLIC` videos for the signed-in owner.
- Public pages should only query videos with `visibility: PUBLIC`.
- A private video must not be reachable through public routes, even by direct URL.
- Keep this as a two-value enum for now; add `UNLISTED` later only if the product needs shareable-but-hidden links.

## Phase 1: MVP Admin Video Library

Deliver a private admin-only video list and create form.

Tasks:

- Add Prisma `Video` model and `User.videos` relation.
- Create a Prisma migration.
- Regenerate Prisma client.
- Add server actions in `app/_data/videos.ts`:
  - `getAllVideos`
  - `getVideoById`
  - `createVideo`
  - `updateVideo`
  - `deleteVideo`
- Scope video queries by the authenticated user where appropriate.
- Add `components/admin-pages/video-form.tsx`.
- Add `components/admin-pages/videos-table.tsx`.
- Export new components from `components/index.ts`.
- Add admin routes:
  - `app/(admin)/videos/page.tsx`
  - `app/(admin)/videos/[id]/page.tsx`
- Add "Videos" to `components/admin-pages/admin-sidebar.tsx`.
- Add basic logging with existing `createLogEvent` if useful.

Acceptance criteria:

- Signed-in user can open `/videos`.
- Signed-in user can create a video with title, URL, and video date.
- Created videos appear in the admin table sorted by newest added first.
- Signed-in user can edit an existing video.
- Signed-in user can delete an existing video if we include delete controls in this phase.
- Unauthenticated access follows the app's existing admin/auth behavior.

## Phase 2: Video Visibility

First-priority follow-up after the admin CRUD MVP: add explicit private/public visibility before building public pages.

Tasks:

- Add `VideoVisibility` enum to `prisma/schema.prisma`.
- Add `visibility VideoVisibility @default(PRIVATE)` to `Video`.
- Add an index for `visibility`.
- Create a Prisma migration for video visibility.
- Regenerate Prisma client.
- Update video server action types to accept and persist visibility.
- Keep admin queries owner-scoped and return both private and public videos.
- Add visibility control to `VideoForm`, defaulting new videos to private.
- Add visibility display/filtering to `VideosTable` if useful for scanning.
- Update validation so only known visibility values are accepted.
- Run `npm run tsc`.
- Run `npm run lint`.
- Manually verify create/edit keeps the selected visibility.

Acceptance criteria:

- New videos are private by default.
- Signed-in users can switch a video between private and public.
- Admin list clearly shows the visibility state.
- Existing videos remain private after migration.
- No public route exposes private videos.

## Phase 3: Public Video Pages

Add read-only video browsing outside the admin area after explicit visibility exists.

Tasks:

- Add public route `app/videos/page.tsx`.
- Add detail route `app/videos/[id]/page.tsx`.
- Public video details should use the existing `id`; do not add a video slug field for this phase.
- Query only videos with `visibility: PUBLIC`.
- Render title, video date, added date, and outbound link.
- Optionally embed supported providers later; first version can open the URL.
- Add navbar/link entry only if public videos are meant to be discoverable.

Acceptance criteria:

- Public list loads without admin UI.
- Public detail page shows one video by `id`.
- Private videos return `notFound()` from public detail routes.
- Dates are formatted consistently.
- Missing videos render a `notFound()` state.

## Phase 4: Folders

Add organization by folder after the core video CRUD is stable.

Tasks:

- Add `VideoFolder` model.
- Add optional `folderId` relation on `Video`.
- Add folder CRUD actions and admin page.
- Add folder selector to `VideoForm`.
- Add table/list filtering by folder.
- Decide how to handle deleting a folder:
  - set videos to no folder, or
  - cascade delete folder contents.

Recommended behavior:

- Use `onDelete: SetNull` for `Video.folderId` so deleting a folder does not delete saved videos.

## Phase 5: Tags

Add metadata after folders, because tags introduce many-to-many filtering and management UX.

Tasks:

- Add `VideoTag` and `TagsToVideos` models.
- Add tag creation/selection in `VideoForm`.
- Add tag badges in the table and detail pages.
- Add filters by tag.
- Optionally add tag colors later.

Acceptance criteria:

- A video can have multiple tags.
- A tag can be reused across many videos.
- Video list can filter by tag.

## Phase 6: Detail Notes and Timestamp Comments

Add the deeper annotation workflow.

Tasks:

- Add `VideoNote` model with:
  - `content String`
  - `timestampSeconds Int?`
  - `videoId String`
  - `userId String`
  - `createdAt DateTime @default(now())`
  - `updatedAt DateTime @updatedAt`
- Add notes section to video detail page.
- Add form for regular comments.
- Add form for timestamp notes.
- Format timestamp seconds as `HH:MM:SS` or `MM:SS`.
- Add sorting by timestamp and creation date.

Acceptance criteria:

- User can add a general note to a video.
- User can add a note tied to a timestamp.
- Detail page shows timestamp notes in useful order.

## Implementation Order

1. Create Prisma model and migration for `Video`.
2. Add server actions in `app/_data/videos.ts`.
3. Build admin table and form.
4. Wire admin routes and sidebar navigation.
5. Run typecheck/lint and fix issues.
6. Add explicit private/public video visibility.
7. Add public pages only after visibility exists.
8. Add folders.
9. Add tags.
10. Add notes/timestamp comments.

## Suggested First PR Scope

Keep the first implementation intentionally small:

- Prisma `Video` model
- admin `/videos` list
- create/edit form
- user-scoped server actions
- sidebar link
- typecheck/lint verification

Avoid in the first PR:

- folders
- tags
- public embed logic
- comments
- timestamp notes

## Verification Commands

Use the project scripts:

```bash
npm run tsc
npm run lint
```

For Prisma changes, also run the normal migration/generation flow used for the local database:

```bash
npx prisma migrate dev --name add-videos
npx prisma generate
```

## Open Decisions

- Videos should support both private and public visibility, with new videos private by default.
- Public video details should use `id`; a generated `slug` is not needed for this phase.
- The first admin CRUD version includes delete.
- Should video URL support be generic, or should YouTube/Vimeo validation and embeds be added early?
- Should video date store date only semantically, even though Prisma stores it as `DateTime`?
