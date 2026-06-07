# Video Feature Task List

Use this file as the working checklist for `docs/video-feature-plan.md`.

Status markers:

- `[ ]` not started
- `[x]` done
- `[~]` in progress, replace with `[ ]` or `[x]` when updating

## Current Status

- Phase: 0
- Next task: V0-01
- Notes: Planning documents are prepared. Implementation has not started yet.

## Phase 0: Planning

- [x] V0-01 Create high-level video feature plan.
- [x] V0-02 Save the plan in `docs/video-feature-plan.md`.
- [x] V0-03 Create this task checklist.
- [ ] V0-04 Decide whether the MVP includes delete controls.
- [ ] V0-05 Decide whether videos are private only or will also have public pages.
- [ ] V0-06 Decide whether public detail URLs should use `id` or `slug`.
- [ ] V0-07 Decide whether URL validation should be generic or provider-specific.

## Phase 1: MVP Admin Video Library

Goal: authenticated admin users can create, edit, list, and optionally delete saved video links.

### Database

- [ ] V1-01 Add `Video` model to `prisma/schema.prisma`.
- [ ] V1-02 Add `videos Video[]` relation to `User`.
- [ ] V1-03 Add useful indexes for `userId` and `videoDate`.
- [ ] V1-04 Create Prisma migration named `add-videos`.
- [ ] V1-05 Regenerate Prisma client.

### Server Actions

- [ ] V1-06 Create `app/_data/videos.ts`.
- [ ] V1-07 Add `getAllVideos`.
- [ ] V1-08 Add `getVideoById`.
- [ ] V1-09 Add `createVideo`.
- [ ] V1-10 Add `updateVideo`.
- [ ] V1-11 Add `deleteVideo` if delete is included in MVP.
- [ ] V1-12 Scope authenticated video queries by `session.user.id`.
- [ ] V1-13 Add path revalidation for admin video routes where needed.
- [ ] V1-14 Add log events if useful with the existing logging flow.

### Admin UI

- [ ] V1-15 Add `components/admin-pages/video-form.tsx`.
- [ ] V1-16 Add Zod validation for title, URL, and video date.
- [ ] V1-17 Add create mode to `VideoForm`.
- [ ] V1-18 Add edit mode to `VideoForm`.
- [ ] V1-19 Add `components/admin-pages/videos-table.tsx`.
- [ ] V1-20 Add table columns for title, URL, video date, and added date.
- [ ] V1-21 Add table action to open edit page.
- [ ] V1-22 Add delete control if delete is included in MVP.
- [ ] V1-23 Export video components from `components/index.ts`.

### Admin Routes

- [ ] V1-24 Add `app/(admin)/videos/page.tsx`.
- [ ] V1-25 Add `app/(admin)/videos/[id]/page.tsx`.
- [ ] V1-26 Decide and implement a create route pattern, such as `/videos/new` or dialog-based creation.
- [ ] V1-27 Add "Videos" item to `components/admin-pages/admin-sidebar.tsx`.
- [ ] V1-28 Confirm breadcrumbs match existing admin pages.

### Phase 1 Verification

- [ ] V1-29 Run `npm run tsc`.
- [ ] V1-30 Run `npm run lint`.
- [ ] V1-31 Manually verify `/videos` opens for a signed-in user.
- [ ] V1-32 Manually verify create flow.
- [ ] V1-33 Manually verify edit flow.
- [ ] V1-34 Manually verify delete flow if included.
- [ ] V1-35 Update this checklist and note any follow-up tasks.

## Phase 2: Public Video Pages

Goal: users can browse and open read-only video pages outside the admin area.

- [ ] V2-01 Decide whether public video pages are needed.
- [ ] V2-02 Decide whether to add `slug` to `Video`.
- [ ] V2-03 Add slug generation if public details use slugs.
- [ ] V2-04 Add public list route `app/videos/page.tsx`.
- [ ] V2-05 Add public detail route, either `app/videos/[id]/page.tsx` or `app/videos/[slug]/page.tsx`.
- [ ] V2-06 Render title, video date, added date, and outbound URL.
- [ ] V2-07 Add `notFound()` handling for missing videos.
- [ ] V2-08 Add navigation entry only if public videos should be discoverable.
- [ ] V2-09 Run `npm run tsc`.
- [ ] V2-10 Run `npm run lint`.
- [ ] V2-11 Manually verify public list and detail pages.

## Phase 3: Folders

Goal: allow videos to be grouped without deleting videos when a folder is removed.

- [ ] V3-01 Add `VideoFolder` model.
- [ ] V3-02 Add optional `folderId` to `Video`.
- [ ] V3-03 Use `onDelete: SetNull` for the video-folder relation.
- [ ] V3-04 Create Prisma migration.
- [ ] V3-05 Regenerate Prisma client.
- [ ] V3-06 Add folder server actions.
- [ ] V3-07 Add folder admin list.
- [ ] V3-08 Add folder create/edit UI.
- [ ] V3-09 Add folder selector to `VideoForm`.
- [ ] V3-10 Add folder display to video table/detail views.
- [ ] V3-11 Add folder filtering to video list.
- [ ] V3-12 Run `npm run tsc`.
- [ ] V3-13 Run `npm run lint`.
- [ ] V3-14 Manually verify folder create/edit/filter flows.

## Phase 4: Tags

Goal: add reusable tags and filtering for videos.

- [ ] V4-01 Add `VideoTag` model.
- [ ] V4-02 Add video/tag join model, such as `TagsToVideos`.
- [ ] V4-03 Create Prisma migration.
- [ ] V4-04 Regenerate Prisma client.
- [ ] V4-05 Add tag server actions.
- [ ] V4-06 Add tag create/select UI.
- [ ] V4-07 Add tag selector to `VideoForm`.
- [ ] V4-08 Add tag badges to video table/detail views.
- [ ] V4-09 Add tag filtering to video list.
- [ ] V4-10 Run `npm run tsc`.
- [ ] V4-11 Run `npm run lint`.
- [ ] V4-12 Manually verify multi-tag assignment and filtering.

## Phase 5: Detail Notes and Timestamp Comments

Goal: add comments and timestamped notes on video detail pages.

- [ ] V5-01 Add `VideoNote` model.
- [ ] V5-02 Add optional `timestampSeconds Int?`.
- [ ] V5-03 Create Prisma migration.
- [ ] V5-04 Regenerate Prisma client.
- [ ] V5-05 Add note server actions.
- [ ] V5-06 Add notes section to video detail page.
- [ ] V5-07 Add regular comment form.
- [ ] V5-08 Add timestamp note form.
- [ ] V5-09 Add timestamp parsing and formatting helper.
- [ ] V5-10 Sort timestamp notes in a useful order.
- [ ] V5-11 Run `npm run tsc`.
- [ ] V5-12 Run `npm run lint`.
- [ ] V5-13 Manually verify regular notes.
- [ ] V5-14 Manually verify timestamp notes.

## Backlog

- [ ] VB-01 Add provider-specific metadata extraction for YouTube/Vimeo.
- [ ] VB-02 Add video embeds.
- [ ] VB-03 Add thumbnails.
- [ ] VB-04 Add search across title, URL, tags, folders, and notes.
- [ ] VB-05 Add import/export for video links.
- [ ] VB-06 Add bulk actions in the video table.
