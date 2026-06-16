# Video Thumbnail Feature Task List

Use this file as the working checklist for `docs/video-thumbnail-feature-plan.md`.

Status markers:

- `[ ]` not started
- `[x]` done
- `[~]` in progress, replace with `[ ]` or `[x]` when updating

## Current Status

- Phase: 3
- Next task: VT-10
- Notes: The nullable `thumbnailUrl` schema change, migration, generated Prisma Client, YouTube URL helper, and admin table thumbnail fetch action are ready. Applying the migration to the development database remains tracked by VT-29.

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

- [ ] VT-10 Add `thumbnailUrl?: string | null` to `VideoActionValues`.
- [ ] VT-11 Normalize and validate optional thumbnail URLs.
- [ ] VT-12 Persist `thumbnailUrl` in `createVideo`.
- [ ] VT-13 Persist and clear `thumbnailUrl` in `updateVideo`.
- [ ] VT-14 Keep owner scoping and path revalidation unchanged.

## Phase 4: Admin Form

- [ ] VT-15 Add `thumbnailUrl` to the `VideoForm` Zod schema and default values.
- [ ] VT-16 Add a `Fetch thumbnail` button that uses the YouTube helper.
- [ ] VT-17 Show success/error feedback without submitting the form.
- [ ] VT-18 Show the resolved thumbnail preview.
- [ ] VT-19 Add manual thumbnail upload using the existing UploadThing flow.
- [ ] VT-20 Allow the current thumbnail to be cleared or replaced.
- [ ] VT-21 Ensure changing the video URL does not silently overwrite a custom thumbnail.
- [ ] VT-22 Pass `thumbnailUrl` through the admin create/edit route.

## Phase 5: Rendering

- [ ] VT-23 Add the required YouTube image hostname to `next.config.ts`.
- [ ] VT-24 Add thumbnail rendering to `VideosTable`.
- [ ] VT-25 Add thumbnail rendering to the public videos list.
- [ ] VT-26 Decide whether the public detail page benefits from a larger thumbnail and implement it if useful.
- [ ] VT-27 Add a stable fallback for videos without a thumbnail or with an image load error.
- [ ] VT-28 Add title-based thumbnail `alt` text.

## Phase 6: Verification

- [ ] VT-29 Run the Prisma migration against the development database.
- [ ] VT-30 Run `npm run postinstall`.
- [ ] VT-31 Run `npm run tsc`.
- [ ] VT-32 Run `npm run lint`.
- [ ] VT-33 Run targeted ESLint for changed files under `components/` and shared helpers.
- [ ] VT-34 Manually verify thumbnail fetch for each supported YouTube URL format.
- [ ] VT-35 Manually verify manual upload, replacement, and clearing.
- [ ] VT-36 Manually verify a generic non-YouTube video can still be saved without a thumbnail.
- [ ] VT-37 Manually verify thumbnail failure does not block create/edit.
- [ ] VT-38 Manually verify admin and public thumbnail fallbacks.
- [ ] VT-39 Update this checklist and the main video task list after completion.

## Follow-up Backlog

- [ ] VTF-01 Evaluate the YouTube Data API when duration or richer metadata is implemented.
- [ ] VTF-02 Add `provider` and `providerVideoId` only when multiple provider adapters or embeds need persisted normalized data.
- [ ] VTF-03 Add UploadThing file-key tracking and old-file deletion as a general storage lifecycle feature.
- [ ] VTF-04 Add a metadata refresh strategy before storing additional YouTube API data long term.
- [ ] VTF-05 Consider copying thumbnails to owned storage only if reliability requirements outweigh storage and cleanup costs.
