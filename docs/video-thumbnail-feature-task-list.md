# Video Thumbnail Feature Task List

Use this file as the working checklist for `docs/video-thumbnail-feature-plan.md`.

Status markers:

- `[ ]` not started
- `[x]` done
- `[~]` in progress, replace with `[ ]` or `[x]` when updating

## Current Status

- Phase: Paused after accepted MVP
- Next task: None. The current thumbnail behavior is accepted as-is.
- Notes: The nullable `thumbnailUrl` schema change, migration, generated Prisma Client, YouTube URL helper, admin table thumbnail fetch action, admin form thumbnail save flow, and public detail thumbnail are ready. Manual upload, list/table thumbnails, and broader fallback polish are paused under "Could Do Later".

## Phase 0: Decisions and Planning

- [x] VT-00 Compare external YouTube URL, UploadThing copy, and dynamic-only strategies.
- [x] VT-00A Select external URL storage with manual upload override.
- [x] VT-00B Keep video save failure-tolerant and independent from metadata availability.
- [x] VT-00C Limit automatic thumbnail resolution to YouTube for the MVP.
- [x] VT-00D Save the implementation plan and task list.

## Phase 1: Data Model

- [x] VT-01 Add optional `thumbnailUrl String?` to `Video` in `prisma/schema.prisma`.
- [x] VT-02 Create a Prisma migration for the thumbnail field.
- [x] VT-03 Regenerate the Prisma client.
- [x] VT-04 Confirm existing videos remain valid with `thumbnailUrl = null`.

## Phase 2: YouTube Helper

- [x] VT-05 Add a small provider helper for parsing supported YouTube URLs.
- [x] VT-06 Support `watch`, `youtu.be`, `shorts`, and `embed` URL formats.
- [x] VT-07 Validate YouTube hostnames and video IDs.
- [x] VT-08 Add a helper that returns the conservative YouTube thumbnail URL.
- [x] VT-09 Add focused tests for valid, invalid, and unsupported URLs if a suitable test setup exists. No test runner is configured yet; covered by TypeScript and targeted ESLint for now.

## Phase 3: Server Actions and Validation

- [x] VT-10 Add `thumbnailUrl?: string | null` to `VideoActionValues`.
- [x] VT-11 Normalize and validate optional thumbnail URLs.
- [x] VT-12 Persist `thumbnailUrl` in `createVideo`.
- [x] VT-13 Persist and clear `thumbnailUrl` in `updateVideo`.
- [x] VT-14 Keep owner scoping and path revalidation unchanged.

## Phase 4: Admin Form

- [x] VT-15 Add `thumbnailUrl` to the `VideoForm` Zod schema and default values.
- [x] VT-16 Add a `Fetch thumbnail` button that uses the YouTube helper.
- [x] VT-17 Show success/error feedback without submitting the form.
- [x] VT-18 Show the resolved thumbnail preview.
- [x] VT-20 Allow the current thumbnail to be cleared or replaced.
- [x] VT-21 Ensure changing the video URL does not silently overwrite a custom thumbnail.
- [x] VT-22 Pass `thumbnailUrl` through the admin create/edit route.

## Phase 5: Rendering

- [x] VT-23 Add the required YouTube image hostname to `next.config.ts`.
- [x] VT-26 Decide whether the public detail page benefits from a larger thumbnail and implement it if useful.

## Phase 6: Verification

- [ ] VT-29 Run the Prisma migration against the development database.
- [ ] VT-30 Run `npm run postinstall`.
- [ ] VT-31 Run `npm run tsc`.
- [ ] VT-32 Run `npm run lint`.
- [ ] VT-33 Run targeted ESLint for changed files under `components/` and shared helpers.
- [ ] VT-34 Manually verify thumbnail fetch for each supported YouTube URL format.
- [ ] VT-36 Manually verify a generic non-YouTube video can still be saved without a thumbnail.
- [ ] VT-37 Manually verify thumbnail failure does not block create/edit.
- [ ] VT-39 Update this checklist and the main video task list after completion.

## Could Do Later

- [ ] VTC-01 Add manual thumbnail upload using the existing UploadThing flow.
- [ ] VTC-02 Add thumbnail rendering to `VideosTable`.
- [ ] VTC-03 Add thumbnail rendering to the public videos list.
- [ ] VTC-04 Add a stable fallback for videos without a thumbnail or with an image load error in list and table views.
- [ ] VTC-05 Add title-based thumbnail `alt` text to list and table views.
- [ ] VTC-06 Manually verify manual upload, replacement, and clearing if manual upload is implemented.
- [ ] VTC-07 Manually verify admin and public thumbnail fallbacks if list/table thumbnail rendering is implemented.

## Follow-up Backlog

- [ ] VTF-01 Evaluate the YouTube Data API when duration or richer metadata is implemented.
- [ ] VTF-02 Add `provider` and `providerVideoId` only when multiple provider adapters or embeds need persisted normalized data.
- [ ] VTF-03 Add UploadThing file-key tracking and old-file deletion as a general storage lifecycle feature.
- [ ] VTF-04 Add a metadata refresh strategy before storing additional YouTube API data long term.
- [ ] VTF-05 Consider copying thumbnails to owned storage only if reliability requirements outweigh storage and cleanup costs.
