# Proposal

## Why

Feature-087 added a unified server-side read helper, `getCommentListItems`, in `app/_data/comments.ts`, that already covers the per-target use case (`{ videoId }`, `{ photoId }`) on top of the same normalized `CommentListItem` shape used by `/comments`. The two legacy per-target helpers — `getPublicVideoCommentListItems` in `app/_data/video-comments.ts` and `getPhotoCommentListItems` in `app/_data/photo-comments.ts` — are now dead code that duplicates the same join, the same row-to-item conversion, and the same `CommentListItem` contract. Migrating the two remaining callers (video detail page and trip photo viewer) to the unified helper removes the duplication and consolidates future comment-read changes into one place.

## What Changes

- Migrate the video detail page (`app/videos/[id]/page.tsx`) from `getPublicVideoCommentListItems(video.id)` to `getCommentListItems({ videoId: video.id, order: "asc" }).items`.
- Migrate the trip photo viewer (`app/(site-top-nav)/hikes/[slug]/page.tsx`) from `getPhotoCommentListItems(photo.id)` to `getCommentListItems({ photoId: photo.id, order: "asc" }).items`.
- Remove `getPublicVideoCommentListItems` from `app/_data/video-comments.ts` together with its now-orphan row helpers (`getPublicVideoComments`, `toVideoCommentListItem`) and types (`PublicVideoComment`, `videoCommentSelect` is kept; it is still used by the video comment mutations).
- Remove `getPhotoCommentListItems` from `app/_data/photo-comments.ts` together with its now-orphan row helpers (`getPhotoComments`, `toPhotoCommentListItem`) and types (`PhotoCommentListRecord`; `photoCommentSelect` is kept; it is still used by the photo comment mutations).
- Keep the per-domain visibility filter out of the unified helper: both target pages already gate by current visibility (`video.visibility = PUBLIC` on the video detail page; photo linked to a `PUBLISHED` trip on the photo viewer), so removing the redundant per-domain filter at the data layer is safe and matches the trust-creation-gate model feature-087 adopted for `/comments`.
- No user-visible behavior change. No new routes, no schema change, no auth change, no new dependencies.

### Non-goals

- Changing the per-target list ordering, pagination, or target-page behavior (those stay as they are today; the per-target callers continue to receive a flat, ascending `CommentListItem[]` in one slice).
- Touching the comment mutation helpers (`createVideoComment`, `updateVideoComment`, `deleteVideoComment`, `createPhotoComment`, `updatePhotoComment`, `deletePhotoComment`) — their visibility filters, server-action behavior, and shared `select` shapes stay as-is.
- Touching the `/comments` feed page itself (already calls `getCommentListItems`).
- Adding new comment target domains, search, filters, or moderation.
- Updating unrelated video/photo detail pages or the public-navbar search.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. This slice is a pure refactor; the externally observable behavior of the video detail page, the trip photo viewer, and the `/comments` feed page does not change. The proposal opts out of spec deltas via `skip_specs: true` in `.openspec.yaml`. Existing `video-comments` and `outdoor-photo-comments` capabilities keep their current requirements unchanged.

## Impact

- Affected code (read-only):
  - `app/_data/video-comments.ts` — drop `getPublicVideoCommentListItems`, `getPublicVideoComments`, `toVideoCommentListItem`, `PublicVideoComment` type.
  - `app/_data/photo-comments.ts` — drop `getPhotoCommentListItems`, `getPhotoComments`, `toPhotoCommentListItem`, `PhotoCommentListRecord` type. `getPhotoCommentTargetContext` stays (still used by the mutations).
  - `app/videos/[id]/page.tsx` — swap import + call shape.
  - `app/(site-top-nav)/hikes/[slug]/page.tsx` — swap import + call shape.
- Affected data: read-only. No Prisma schema change, no migration, no new models, no new indexes.
- Affected routes: none. Same public URL (`/videos/[id]`, `/hikes/[slug]`) renders the same comment list.
- Reused building blocks: `getCommentListItems` from `app/_data/comments.ts` (feature-087); `CommentListItem` type from `lib/comments.ts`; no new helpers required.
- No new dependencies, no env changes, no auth changes.
- Validation: `npm run tsc`, targeted ESLint over the changed files, `npm run build` for the per-target pages.
- Backlog bookkeeping: on completion, mark this candidate `Done` in `openspec/backlog.md` and append a row to `openspec/feature-history.md`.