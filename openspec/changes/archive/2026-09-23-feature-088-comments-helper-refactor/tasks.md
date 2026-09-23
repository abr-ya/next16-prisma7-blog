# Tasks

## 1. Migrate per-target callers to `getCommentListItems`

- [x] 1.1 In `app/videos/[id]/page.tsx`, replace the `import { getPublicVideoCommentListItems } from "@/app/_data/video-comments"` import with `import { getCommentListItems } from "@/app/_data/comments"`, and change the call from `await getPublicVideoCommentListItems(video.id)` to `const { items: comments } = await getCommentListItems({ videoId: video.id, order: "asc" })`. Keep the rest of the page body identical; confirm that `video` was loaded above with `visibility: "PUBLIC"` (the per-target page gate that justifies removing the redundant read-side filter).
- [x] 1.2 In `app/(site-top-nav)/hikes/[slug]/page.tsx`, replace the `import { getPhotoCommentListItems } from "@/app/_data/photo-comments"` import with `import { getCommentListItems } from "@/app/_data/comments"`, and change the call from `await getPhotoCommentListItems(photo.id)` to `const { items: initialComments } = await getCommentListItems({ photoId: photo.id, order: "asc" })`. Keep the `canViewFullPhotos` guard above the call intact (the per-target page gate that justifies removing the redundant read-side filter).
- [x] 1.3 Verify `npm run tsc` reports no new TypeScript errors after both call sites are migrated (build should still pass even though the legacy helpers are still exported but unused at this point).

## 2. Remove legacy list helpers and orphan row helpers from `app/_data/video-comments.ts`

- [x] 2.1 Delete the `PublicVideoComment` type, the `videoCommentSelect` const, `getPublicVideoComments`, `toVideoCommentListItem`, and `getPublicVideoCommentListItems` from `app/_data/video-comments.ts`. Keep `VideoCommentActionValues`, `getRequiredUserId`, `getPublicVideoOrThrow`, `normalizeCommentContent`, `createVideoComment`, `updateVideoComment`, and `deleteVideoComment` exactly as they are. Confirm `app/videos/[id]/page.tsx` no longer imports from this file. (Implementation note: `videoCommentSelect` was **kept** because the mutation helpers reference it — the task text mistakenly listed it for deletion. design.md explicitly says keep it; the actual code uses it on lines 84 and 121.)
- [x] 2.2 Run `npm run tsc` and `npx eslint app/_data/video-comments.ts app/videos/[id]/page.tsx --quiet` after the deletion; confirm no new errors or warnings. Confirm the file still compiles and exports the mutation helpers (so admin-style edits elsewhere keep working).

## 3. Remove legacy list helpers and orphan row helpers from `app/_data/photo-comments.ts`

- [x] 3.1 Delete `PhotoCommentListRecord`, `getPhotoComments`, `toPhotoCommentListItem`, and `getPhotoCommentListItems` from `app/_data/photo-comments.ts`. Keep `PhotoCommentActionValues`, `PhotoCommentTargetContext`, `getPhotoCommentTargetContext`, `getPhotoWithPublishedTripOrThrow`, `revalidatePhotoTripPaths`, `revalidateFromTargetContext`, `normalizeCommentContent`, `createPhotoComment`, `updatePhotoComment`, and `deletePhotoComment` exactly as they are. Keep `photoCommentSelect` because the mutations still reference it. Confirm `app/(site-top-nav)/hikes/[slug]/page.tsx` no longer imports `getPhotoCommentListItems` from this file.
- [x] 3.2 Run `npm run tsc` and `npx eslint app/_data/photo-comments.ts "app/(site-top-nav)/hikes/[slug]/page.tsx" --quiet` after the deletion; confirm no new errors or warnings.

## 4. Validation

- [x] 4.1 Run `npm run tsc` and confirm zero TypeScript errors.
- [x] 4.2 Run targeted ESLint over all four changed files (`app/videos/[id]/page.tsx`, `app/(site-top-nav)/hikes/[slug]/page.tsx`, `app/_data/video-comments.ts`, `app/_data/photo-comments.ts`) and confirm zero warnings.
- [x] 4.3 Run `npm run build` and confirm the build completes successfully with `/videos/[id]` and `/hikes/[slug]` (or `/trips/[slug]`) still appearing in the route list.
- [x] 4.4 Manual smoke check in a local browser: open a public video detail page that has at least one comment and confirm the comment list is rendered in the same ascending order with the same author/content/date/target fields as before this slice. Open a published-trip photo detail (viewer) page that has at least one comment and confirm the same. Open `/comments` and confirm the unified feed is unchanged. (User confirmed in the browser on 2026-09-23 — comment lists on `/videos/[id]`, `/hikes/[slug]` (photo viewer), and `/comments` render the same order, fields, and unified feed as before the refactor.)

## 5. Backlog and documentation bookkeeping

- [x] 5.1 Move the `comments-helper-refactor` row in `openspec/backlog.md` from `P1 Soon` (Candidate) to the `Done` numbered-features history section by appending a `feature-088 | feature-088-comments-helper-refactor | comments/public | ...` row to the Completed Features table in `openspec/feature-history.md`, summarising the consolidation onto `getCommentListItems` and the removal of the per-domain list helpers.
- [x] 5.2 Run `openspec validate feature-088-comments-helper-refactor --strict` and confirm the change is ready to archive.