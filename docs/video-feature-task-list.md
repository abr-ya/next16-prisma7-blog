# Video Feature Task List

Use this file as the working checklist for `docs/video-feature-plan.md`.

Status markers:

- `[ ]` not started
- `[x]` done
- `[~]` in progress, replace with `[ ]` or `[x]` when updating

## Current Status

- Phase: 2
- Next task: V2-09
- Notes: Video visibility schema, migration, generated Prisma client, and server actions are in place. The next implementation priority is adding visibility controls to the admin UI.

## Phase 0: Planning

- [x] V0-01 Create high-level video feature plan.
- [x] V0-02 Save the plan in `docs/video-feature-plan.md`.
- [x] V0-03 Create this task checklist.
- [x] V0-04 Decide whether the MVP includes delete controls.
- [x] V0-05 Decide whether videos are private only or will also have public pages.
- [ ] V0-06 Decide whether public detail URLs should use `id` or `slug`.
- [ ] V0-07 Decide whether URL validation should be generic or provider-specific.

## Phase 1: MVP Admin Video Library

Goal: authenticated admin users can create, edit, list, and optionally delete saved video links.

### Database

- [x] V1-01 Add `Video` model to `prisma/schema.prisma`.
- [x] V1-02 Add `videos Video[]` relation to `User`.
- [x] V1-03 Add useful indexes for `userId` and `videoDate`.
- [x] V1-04 Create Prisma migration named `add-videos`.
- [x] V1-05 Regenerate Prisma client.

### Server Actions

- [x] V1-06 Create `app/_data/videos.ts`.
- [x] V1-07 Add `getAllVideos`.
- [x] V1-08 Add `getVideoById`.
- [x] V1-09 Add `createVideo`.
- [x] V1-10 Add `updateVideo`.
- [x] V1-11 Add `deleteVideo` if delete is included in MVP.
- [x] V1-12 Scope authenticated video queries by `session.user.id`.
- [x] V1-13 Add path revalidation for admin video routes where needed.
- [ ] V1-14 Add log events if useful with the existing logging flow.

### Admin UI

- [x] V1-15 Add `components/admin-pages/video-form.tsx`.
- [x] V1-16 Add Zod validation for title, URL, and video date.
- [x] V1-17 Add create mode to `VideoForm`.
- [x] V1-18 Add edit mode to `VideoForm`.
- [x] V1-19 Add `components/admin-pages/videos-table.tsx`.
- [x] V1-20 Add table columns for title, URL, video date, and added date.
- [x] V1-21 Add table action to open edit page.
- [x] V1-22 Add delete control if delete is included in MVP.
- [x] V1-23 Export video components from `components/index.ts`.

### Admin Routes

- [x] V1-24 Add `app/(admin)/videos/page.tsx`.
- [x] V1-25 Add `app/(admin)/videos/[id]/page.tsx`.
- [x] V1-26 Decide and implement a create route pattern, such as `/videos/new` or dialog-based creation.
- [x] V1-27 Add "Videos" item to `components/admin-pages/admin-sidebar.tsx`.
- [ ] V1-28 Confirm breadcrumbs match existing admin pages.

### Phase 1 Verification

- [ ] V1-29 Run `npm run tsc`.
- [ ] V1-30 Run `npm run lint`.
- [ ] V1-31 Manually verify `/videos` opens for a signed-in user.
- [ ] V1-32 Manually verify create flow.
- [ ] V1-33 Manually verify edit flow.
- [ ] V1-34 Manually verify delete flow if included.
- [ ] V1-35 Update this checklist and note any follow-up tasks.

## Phase 2: Video Visibility

Goal: add explicit private/public visibility before public video pages are built.

- [x] V2-01 Add `VideoVisibility` enum to `prisma/schema.prisma`.
- [x] V2-02 Add `visibility VideoVisibility @default(PRIVATE)` to `Video`.
- [x] V2-03 Add a useful `visibility` index.
- [x] V2-04 Create Prisma migration for video visibility.
- [x] V2-05 Regenerate Prisma client.
- [x] V2-06 Update video server action types to accept visibility.
- [x] V2-07 Persist visibility in `createVideo` and `updateVideo`.
- [x] V2-08 Keep admin video queries owner-scoped and include both private and public videos.
- [ ] V2-09 Add visibility control to `VideoForm`, defaulting new videos to private.
- [ ] V2-10 Add visibility display to `VideosTable`.
- [ ] V2-11 Update Zod validation for visibility.
- [ ] V2-12 Run `npm run tsc`.
- [ ] V2-13 Run `npm run lint`.
- [ ] V2-14 Manually verify create/edit visibility behavior.
- [ ] V2-15 Update this checklist and note any follow-up tasks.

## Phase 3: Public Video Pages

Goal: users can browse and open read-only video pages outside the admin area.

- [ ] V3-01 Decide whether to add `slug` to `Video`.
- [ ] V3-02 Add slug generation if public details use slugs.
- [ ] V3-03 Add public list route `app/videos/page.tsx`.
- [ ] V3-04 Add public detail route, either `app/videos/[id]/page.tsx` or `app/videos/[slug]/page.tsx`.
- [ ] V3-05 Query only videos with `visibility: PUBLIC`.
- [ ] V3-06 Render title, video date, added date, and outbound URL.
- [ ] V3-07 Add `notFound()` handling for missing, private, or unauthorized videos.
- [ ] V3-08 Add navigation entry only if public videos should be discoverable.
- [ ] V3-09 Run `npm run tsc`.
- [ ] V3-10 Run `npm run lint`.
- [ ] V3-11 Manually verify public list and detail pages.
- [ ] V3-12 Manually verify private videos are not exposed publicly.

## Phase 4: Folders

Goal: allow videos to be grouped without deleting videos when a folder is removed.

- [ ] V4-01 Add `VideoFolder` model.
- [ ] V4-02 Add optional `folderId` to `Video`.
- [ ] V4-03 Use `onDelete: SetNull` for the video-folder relation.
- [ ] V4-04 Create Prisma migration.
- [ ] V4-05 Regenerate Prisma client.
- [ ] V4-06 Add folder server actions.
- [ ] V4-07 Add folder admin list.
- [ ] V4-08 Add folder create/edit UI.
- [ ] V4-09 Add folder selector to `VideoForm`.
- [ ] V4-10 Add folder display to video table/detail views.
- [ ] V4-11 Add folder filtering to video list.
- [ ] V4-12 Run `npm run tsc`.
- [ ] V4-13 Run `npm run lint`.
- [ ] V4-14 Manually verify folder create/edit/filter flows.

## Phase 5: Tags

Goal: add reusable tags and filtering for videos.

- [ ] V5-01 Add `VideoTag` model.
- [ ] V5-02 Add video/tag join model, such as `TagsToVideos`.
- [ ] V5-03 Create Prisma migration.
- [ ] V5-04 Regenerate Prisma client.
- [ ] V5-05 Add tag server actions.
- [ ] V5-06 Add tag create/select UI.
- [ ] V5-07 Add tag selector to `VideoForm`.
- [ ] V5-08 Add tag badges to video table/detail views.
- [ ] V5-09 Add tag filtering to video list.
- [ ] V5-10 Run `npm run tsc`.
- [ ] V5-11 Run `npm run lint`.
- [ ] V5-12 Manually verify multi-tag assignment and filtering.

## Phase 6: Detail Notes and Timestamp Comments

Goal: add comments and timestamped notes on video detail pages.

- [ ] V6-01 Add `VideoNote` model.
- [ ] V6-02 Add optional `timestampSeconds Int?`.
- [ ] V6-03 Create Prisma migration.
- [ ] V6-04 Regenerate Prisma client.
- [ ] V6-05 Add note server actions.
- [ ] V6-06 Add notes section to video detail page.
- [ ] V6-07 Add regular comment form.
- [ ] V6-08 Add timestamp note form.
- [ ] V6-09 Add timestamp parsing and formatting helper.
- [ ] V6-10 Sort timestamp notes in a useful order.
- [ ] V6-11 Run `npm run tsc`.
- [ ] V6-12 Run `npm run lint`.
- [ ] V6-13 Manually verify regular notes.
- [ ] V6-14 Manually verify timestamp notes.

## Backlog

- [ ] VB-01 Add provider-specific metadata extraction for YouTube/Vimeo.
- [ ] VB-02 Add video embeds.
- [ ] VB-03 Add thumbnails.
- [ ] VB-04 Add search across title, URL, tags, folders, and notes.
- [ ] VB-05 Add import/export for video links.
- [ ] VB-06 Add bulk actions in the video table.
