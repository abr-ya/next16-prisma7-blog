# Design

## Context

See `proposal.md` for motivation. The relevant constraints:

- The `Comment` Prisma model currently has only `videoId`; we extend it with `photoId` rather than introduce a polymorphic target table.
- `components/comments/comment-list.tsx` and `comment-composer.tsx` (feature-085) already accept a `CommentListItem[]` plus optional `renderActions` and rely on target-agnostic server actions supplied by the consumer.
- `app/_data/photos.ts` is admin-only; photo reads needed by the public surface already exist in `app/_data/hikes.ts` (`HikePhotoGalleryItem`, `getHikePhotoDetail`).
- Visibility boundary for photos (feature-057, `outdoor-photos` requirement 4): guests see thumbnails; full-size photo image access requires authentication. We mirror that boundary for comments (signed-in only).
- Workspace access matrix (feature-073, `workspace-access-policy`) governs authenticated actions; the participant/owner/admin checks already exist in `app/_data/hikes.ts` (`isCreator`, `isAdmin`, `isAcceptedHikeParticipant`).
- `lib/comments.ts` already defines `CommentTargetType = "video" | "post" | "md-doc"`; we extend it with `"photo"`. No `CommentListItem` shape change.

## Goals / Non-Goals

**Goals:**

- Add `photoId` to `Comment` with a database-level single-target invariant.
- Provide signed-in photo-comment reads, create, update, delete via the shared comment UI foundation.
- Gate every read and mutation through a published-trip association lookup.
- Show a comment-count badge on each gallery card and a comments section inside the published-trip photo lightbox for authenticated viewers.

**Non-Goals (design-level):**

- New comment-list page, cross-target feed, or moderation tooling.
- Anonymous reads of photo comments.
- Admin-only `/admin/photos` photo-comment surface (admins can comment like any signed-in user; they do not get a separate manager in this slice).
- Re-validation of comment text rendering rules — we reuse the existing `CommentText` segments pipeline.
- Changes to the photo publication, trip association, full-size image, like, or coordinate-review flows.

## Decisions

### 1. Single nullable `photoId` column + PostgreSQL check constraint

- **Decision**: Add `photoId String?` + `photo Photo? @relation(...)` to `Comment`. Enforce `("videoId" IS NULL) <> ("photoId" IS NULL)` through a raw-SQL `ALTER TABLE` in the same migration. Add two indexes: `@@index([photoId, createdAt])` and `@@index([userId, photoId])`.
- **Why**: Matches the existing video-comment shape, keeps the schema flat, and lets us reuse the same `Comment` table for both targets. A database-level invariant prevents a future bug where a comment row has no target or both targets; the application layer would not catch a concurrent bug as reliably.
- **Alternatives considered**:
  - Polymorphic `targetType` + `targetId` columns: rejected because it breaks the existing `videoId` foreign key and `onDelete: Cascade` relations, and forces every read to cast through the target type.
  - Separate `PhotoComment` table with duplicated fields: rejected because it duplicates the `Comment` shape, splits the shared UI consumers, and complicates the future unified `/comments` feed candidate.

### 2. Visibility gate: `HikesToPhotos` join + `Hike.status = PUBLISHED`

- **Decision**: Every photo-comment read/write helper resolves a single `Hike` row joined through `HikesToPhotos` filtered to `status: PUBLISHED`. The helper returns `null` (or throws for mutations) when no such trip exists.
- **Why**: This is the same boundary already enforced for photo display, likes (feature-080), and EXIF/coordinate review access (`getPhotoDetailAccess` in `app/_data/hikes.ts`). Reusing it keeps the comment slice small and consistent.
- **Alternatives considered**:
  - Filter by `Photo.status === "PUBLISHED"` alone: rejected because public photo display is only via the linked published-trip surface, not via a standalone photo gallery.
  - Allow commenting when the photo is linked to any trip (including drafts): rejected because the candidate text explicitly names "the published trip association" as the visibility gate.

### 3. Published-trip-slug as the comment target href

- **Decision**: Each photo comment's `CommentListItem.target.href` is `/trips/[slug]` of the photo's first published linked trip (most recent `HikesToPhotos.assignedAt` desc, then `hikeId` desc as a stable tiebreaker — `HikesToPhotos` has composite PK `[hikeId, photoId]` and no scalar `id`).
- **Why**: The photo lives inside a trip page; the trip page is the canonical public surface that re-resolves comments on revalidation. A photo-only anchor (`/trips/[slug]#photo-[id]`) was considered but rejected for this slice — the lightbox surface already lives inside `/trips/[slug]`, and a plain trip href is enough for the shared comment list item contract.
- **Alternative considered**: Anchor-based href `#photo-[id]` so deep-linking opens the lightbox at a specific photo. Deferred to a follow-up because it requires lightbox open-from-hash logic that is out of scope here.

### 4. Server-action module mirrors video-comments shape

- **Decision**: New `app/_data/photo-comments.ts` exporting `getPhotoCommentListItems`, `createPhotoComment`, `updatePhotoComment`, `deletePhotoComment`. Same signature style, same content-length limit (`MAX_COMMENT_CONTENT_LENGTH = 2000`), same `revalidatePath` pattern, same `authSession` / `requireActionUser` usage.
- **Why**: Feature-018 ("comments-domain-structure") says to keep target-specific server actions behind callbacks rather than a polymorphic data layer; feature-085 leaves that contract explicit. Mirroring the video file keeps the two slices visually and structurally identical, which makes the future unified feed diff small.
- **Alternative considered**: A single shared `comments.ts` data module parameterized by target. Rejected because Prisma query shape diverges per target (video joins `Video`, photo joins `Photo` + `HikesToPhotos`), and a polymorphic helper would either leak the join shape to callers or hide it behind fragile string-keyed dispatch.

### 5. Shared comment UI consumer pattern: same Card + Composer as video

- **Decision**: New `components/hike-pages/hike-photo-comment-composer.tsx` exporting `HikePhotoCommentComposer` with props `{ photoId, initialComments, isAuthenticated }`. Renders the same Card layout as `VideoCommentComposer` (MessageCircle title, count description, optional "Sign in" CTA, `CommentList`, `CommentComposer`).
- **Why**: Visual parity with the existing video surface keeps the shared comment UI "shared" in practice. A photographer opening a trip photo and a viewer opening a public video land on the same comment shell.
- **Alternative considered**: Inline the comments directly inside `HikePhotoGallery`. Rejected because it couples the gallery's heavy state machine (active index, EXIF, coordinate review) to comment I/O and revalidation; keeping a sibling component keeps responsibilities split.

### 6. Lightbox presentation: comments section as a toggleable overlay

- **Decision**: Add a "Show comments" button next to the existing "Photo details" toggle in the photo lightbox. Clicking it sets a local `showComments` state and renders an overlay panel (same shape and position as the details panel) containing the `HikePhotoCommentComposer`. Toggling one hides the other. On a gallery card, render a small comment-count badge below the description line (MessageCircle icon + number).
- **Why**: The lightbox already reserves vertical space for an optional bottom overlay; reusing that pattern keeps the dialog height bounded and consistent with the EXIF/coordinate review overlays. A per-card badge is enough to invite interaction without expanding the card layout.
- **Alternative considered**: Always-visible comments scroll below the image inside the same dialog. Rejected because the dialog's `max-h-[calc(100dvh-2rem)]` already struggles to fit the image plus overlay on smaller screens; adding an always-on list would compete for vertical space and break the photo-first focus.

### 7. Anonymous boundary: hide the section, not just disable the composer

- **Decision**: The trip photo gallery only mounts the comment-related UI when the page renders for an authenticated viewer. The lightbox's `canViewFullPhotos` flag (already controls the heart button and full-image rendering) is the single switch: when false, no count badge, no comments overlay, no composer.
- **Why**: Mirrors the existing pattern for likes (feature-080) and avoids leaking comment counts to anonymous visitors (the spec's anonymous-visibility scenario).
- **Alternative considered**: Mount the section with a disabled composer and a "Sign in" CTA. Rejected because it exposes the count and would force a separate hide path for the badge.

### 8. Authentication in server actions: `requireActionUser`, not `requireAuth`

- **Decision**: Photo-comment mutations call `requireActionUser()` (which throws `AuthorizationError`) rather than `requireAuth()` (which redirects). The lightbox surface is interactive; a redirect would replace the page mid-flow.
- **Why**: Matches the `video-comments` mutation pattern (which uses `getRequiredUserId` wrapping `authSession`). The action throws and the client composer surfaces the error through the existing `onSubmitError` toast path.
- **Alternative considered**: Use `requireAuth()` for consistency with the auth-roles plugin. Rejected because the action consumer is already a client component that shows a toast on error; redirecting would break that UX and bypass the shared composer's error path.

### 9. Migration approach

- **Decision**: A single new migration `prisma/migrations/20260920HHMMSS_add_photo_comments/migration.sql` containing:
  1. `ALTER TABLE "comment" ADD COLUMN "photoId" TEXT;`
  2. `CREATE INDEX "comment_photoId_createdAt_idx" ON "comment"("photoId", "createdAt");`
  3. `CREATE INDEX "comment_userId_photoId_idx" ON "comment"("userId", "photoId");`
  4. `ALTER TABLE "comment" ADD CONSTRAINT "comment_single_target_chk" CHECK (("videoId" IS NULL) <> ("photoId" IS NULL));`
  5. `ALTER TABLE "comment" ADD CONSTRAINT "comment_photoId_fk" FOREIGN KEY ("photoId") REFERENCES "photo"("id") ON DELETE CASCADE;`
- **Why**: All existing rows already have `videoId` non-null, so they automatically satisfy the new constraint — no backfill needed. The raw-SQL `CHECK` is the cleanest way to add the invariant in one migration; the existing photo-likes migration (`20260917175441_add_photo_likes`) demonstrates the project pattern of issuing raw SQL after `prisma migrate dev --create-only` for non-trivial schema additions.
- **Alternatives considered**:
  - Application-level invariant only (no DB check): rejected because a future migration or direct SQL could violate it silently.
  - Two migrations (one for the column, one for the constraint): rejected because the constraint depends on the column and splitting adds deployment risk for zero benefit.

## Risks / Trade-offs

- **Risk**: PostgreSQL `CHECK` constraint naming collision if the constraint name already exists → Mitigation: use a uniquely named constraint (`comment_single_target_chk`) and document it in the migration; verify with `psql \d comment` after the first apply.
- **Risk**: Existing video-comment helper paths might inadvertently accept a `photoId` and bypass the visibility gate → Mitigation: keep the new photo-comment helpers in a separate file and never pass them through any video-comments function; the DB constraint catches double-target bugs but the helpers themselves should never write both columns.
- **Risk**: A photo linked to multiple published trips could resolve to different slugs depending on order → Mitigation: deterministic ordering by `HikesToPhotos.assignedAt desc, hikeId desc` and treat the resolved slug as the single revalidation target; the comment's `target.href` is informational for the shared list and does not affect revalidation.
- **Risk**: Mounting the comment section inside the lightbox increases dialog render work for trips with many photos → Mitigation: only render the section when `activeIndex !== null` and only fetch comments for the active photo; existing `router.refresh()` pattern keeps counts in sync without re-fetching all photos.
- **Trade-off**: Adding the second overlay (comments) inside the same dialog makes the bottom-right toggle area busier → Accepted: two-button toggle ("Photo details" / "Show comments") is cleaner than always-visible panels inside the constrained dialog height; matches the existing EXIF/Coordinate dialog pattern at the gallery level.
- **Trade-off**: The check constraint increases migration write cost marginally on Postgres → Accepted: negligible at this scale; constraint validation runs once on apply.
- **Trade-off**: Anonymous users see no count badge — small loss of social signal → Accepted: matches the feature-057 full-size-photo boundary and the candidate's signed-in framing.

## Migration Plan

1. Generate migration scaffold via `npx prisma migrate dev --create-only --name add_photo_comments`.
2. Append the `CHECK` constraint and both indexes by hand-editing `migration.sql` (Prisma will not emit these automatically).
3. Run `npx prisma migrate dev` locally to apply, then `npx prisma generate` to refresh the generated client.
4. Rollback strategy: the migration is a single forward change; rollback is a single `ALTER TABLE ... DROP COLUMN/DROP CONSTRAINT` script kept alongside it. No data is moved or backfilled because the new column is nullable and existing rows already satisfy the constraint.

## Open Questions

None. The candidate text and feature-085 foundation fix the design surface; remaining unknowns (anchor href, moderation, expiry) are explicit non-goals in this slice and map to separate backlog candidates.