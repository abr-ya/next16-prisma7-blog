# Tasks

## 1. Schema and migration

- [x] 1.1 Add `photoId String?`, `photo Photo? @relation(fields: [photoId], references: [id], onDelete: Cascade)`, and indexes `@@index([photoId, createdAt])` and `@@index([userId, photoId])` to the `Comment` model in `prisma/schema.prisma`, and add `comments Comment[]` to the `Photo` model; verify `npx prisma format` succeeds and `npx prisma validate` reports no errors.
- [x] 1.2 Generate a migration scaffold via `npx prisma migrate dev --create-only --name add_photo_comments` and hand-edit `prisma/migrations/20260920HHMMSS_add_photo_comments/migration.sql` to add the raw-SQL `ALTER TABLE ... ADD CONSTRAINT comment_single_target_chk CHECK (("videoId" IS NULL) <> ("photoId" IS NULL))` plus both index `CREATE INDEX` statements and the `FOREIGN KEY` clause; verify by reading the final `migration.sql` and confirming every existing row satisfies the constraint (existing rows have `videoId` non-null).
- [x] 1.3 Apply the migration locally via `npx prisma migrate dev` and run `npx prisma generate`; verify the generated client under `generated/prisma/` exposes `photoId` on `Comment` and that `psql` or the Prisma Studio view shows the new column, indexes, and `comment_single_target_chk` constraint.

## 2. Shared comment target type

- [x] 2.1 Extend `CommentTargetType` in `lib/comments.ts` from `"video" | "post" | "md-doc"` to `"video" | "post" | "md-doc" | "photo"`; verify `npm run tsc` passes and no other module needs updating (the `CommentListItem.target.type` union flows automatically).

## 3. Photo-comment server actions

- [x] 3.1 Add a `getPhotoWithPublishedTripOrThrow(photoId)` helper in `app/_data/photo-comments.ts` that returns `{ photoId, tripSlug, photoTitle, previewImageUrl }` for the photo's first published linked trip (ordered by `HikesToPhotos.assignedAt desc, id desc`) or throws `AuthorizationError` when none exists; verify the helper is unreachable from anonymous paths (it never runs without a server-side caller that already gated session).
- [x] 3.2 Add `getPhotoCommentListItems(photoId)` in `app/_data/photo-comments.ts` that calls the helper, then `prisma.comment.findMany` with the photo-comment select (id, content, createdAt, user, photo with title + first image) and maps each row to a `CommentListItem` with `target: { type: "photo", title, href: "/trips/[slug]", previewImageUrl }`; verify it returns `[]` (never throws) when the photo is missing or has no published linked trip.
- [x] 3.3 Add `createPhotoComment({ photoId, content })` that calls `requireActionUser`, the published-trip helper, normalizes content (trim, non-empty, ≤2000 chars), and writes a `Comment` row with `photoId`; verify it calls `revalidatePath("/trips/[slug]")` and `revalidatePath("/hikes/[slug]")` for the resolved trip slug and rethrows on auth failure without redirecting.
- [x] 3.4 Add `updatePhotoComment({ id, photoId, content })` that calls `requireActionUser`, looks up the comment scoped to the caller (`userId` equals session) plus the photo's published-trip association, normalizes content, updates the row, and revalidates both trip paths; verify the same-row ownership constraint is part of the `where` clause so non-authors cannot mutate.
- [x] 3.5 Add `deletePhotoComment(id)` that calls `requireActionUser`, finds the comment by `id` + caller `userId` + the photo's published-trip association, deletes the row, and revalidates both trip paths; verify the function returns `{ success: false }` (rather than throws) when no matching row is found and throws otherwise.

## 4. Shared comment UI consumer

- [ ] 4.1 Create `components/hike-pages/hike-photo-comment-composer.tsx` exporting `HikePhotoCommentComposer` with props `{ photoId, initialComments, isAuthenticated }`; mirror the `VideoCommentComposer` Card layout (MessageCircle title, count description, optional "Sign in to comment" CTA, shared `CommentList`, shared `CommentComposer` with id `hike-photo-comment-content`, label `Add a comment`, placeholder, max length `2000`, submit label `Add comment`) and call the new `createPhotoComment` / `updatePhotoComment` / `deletePhotoComment` actions from `renderActions`; verify the file compiles under `npm run tsc` and imports resolve.
- [ ] 4.2 Wire `HikePhotoCommentComposer` into a small `HikePhotoCommentSection` wrapper (same file) that exposes an `onChanged` callback triggering `router.refresh()` and accepts a `canViewFullPhotos` flag to short-circuit rendering for anonymous viewers; verify the section renders nothing when `canViewFullPhotos === false`.

## 5. Lightbox integration

- [ ] 5.1 Extend `HikePhotoGalleryItem` in `components/hike-pages/hike-photo-gallery.tsx` with `commentCount: number` and add a small MessageCircle + count badge below each card's description line (only when `canViewFullPhotos`); verify the badge appears only for authenticated viewers and reads e.g. `3 comments` using the same formatter as the video composer.
- [ ] 5.2 Add a `showComments` local state alongside the existing `showDetails` state in `HikePhotoGallery`; add a "Show comments" button next to the existing "Photo details" button at the bottom-right of the image area, and ensure the two toggles are mutually exclusive (clicking one hides the other); verify the existing "Photo details" / "Hide details" buttons still work.
- [ ] 5.3 When `showComments` is true, render the new `HikePhotoCommentSection` for the active photo in the same overlay slot used by the details panel (positioned `inset-x-3 bottom-3`, scrollable, semi-transparent backdrop) so only one overlay is visible at a time; verify the overlay scrolls independently of the image and that `router.refresh()` updates both the count badge and the comment list.
- [ ] 5.4 Fetch initial photo comments server-side in `app/_data/hikes.ts` (or in the trip detail page) for each gallery item when `canViewFullPhotos` is true, via `getPhotoCommentListItems(photoId)`; verify the helper is only called server-side and the resulting `CommentListItem[]` plus `commentCount` flow into `HikePhotoGalleryItem`.
- [ ] 5.5 In the trip detail page (`app/(site-top-nav)/hikes/[slug]/page.tsx` and the `/trips/[slug]` re-export), pass the new `commentCount` and initial `initialComments` for the active photo down to the gallery, and verify anonymous visitors never receive them by guarding the loader with `session ? await getPhotoCommentListItems : null`.

## 6. Validation

- [ ] 6.1 Run `npm run tsc` and verify zero TypeScript errors across the changed files.
- [ ] 6.2 Run `npm run lint` and verify zero ESLint errors; if any non-`app/` file requires lint, run `npx eslint <path> --quiet` on it directly.
- [ ] 6.3 Run `npm run build` and verify the production build succeeds with the new migration applied (including a fresh Prisma client and the raw-SQL `CHECK` constraint present in the database).
- [ ] 6.4 Manually verify in the browser: as an authenticated viewer, open a published trip with linked photos, confirm the comment count badge appears on each card, open a photo lightbox, post a comment, see the count increment and the new comment in the overlay, edit and delete the comment; then sign out and confirm no count badge or comment UI is rendered on the same trip page.

## 7. Docs and checklist updates

- [ ] 7.1 Move the `outdoor-photo-comments` backlog entry from `P0 Now` to `Done` in `openspec/backlog.md` once the implementation merges, and reference `feature-086` in the summary cell; verify the backlog file still parses as markdown and no candidate number is reused.
- [ ] 7.2 Add a short note to `docs/workspace-access-policy.md` (or the relevant checklist) recording the new photo-comment boundary under the "authenticated personal workspace" section if the existing access matrix does not already cover it; verify the doc renders without broken cross-references.