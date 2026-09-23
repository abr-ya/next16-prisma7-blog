# Design

## Context

Feature-087 introduced `getCommentListItems` in [app/_data/comments.ts](../../app/_data/comments.ts) as a single read helper that serves both the public `/comments` feed and the per-target use case (`{ videoId }`, `{ photoId }`). It already includes the same `user`/`video`/`photo` joins, the same `toCommentListItem` adapter, and the same `CommentListItem` output shape that the per-target helpers used to produce.

Two per-target callers still use the legacy helpers:
- [app/videos/[id]/page.tsx](../../app/videos/[id]/page.tsx) → `getPublicVideoCommentListItems(video.id)` from [app/_data/video-comments.ts](../../app/_data/video-comments.ts)
- [app/(site-top-nav)/hikes/[slug]/page.tsx](../../app/(site-top-nav)/hikes/[slug]/page.tsx) → `getPhotoCommentListItems(photo.id)` from [app/_data/photo-comments.ts](../../app/_data/photo-comments.ts)

Both legacy helpers also apply a current-visibility filter on top of the join (`video.visibility = PUBLIC`; `photo.hikes.some.hike.status = PUBLISHED`). The unified helper does not — it trusts the creation-time gate (per the design-087 decision).

See [proposal.md](proposal.md) for motivation.

## Goals / Non-Goals

**Goals:**

- Replace both per-target read calls with `getCommentListItems({ videoId | photoId, order: "asc" }).items`.
- Remove the now-orphan per-target list helpers, their row helpers, their types, and their unused row-to-item adapters.
- Confirm that the per-target callers do not rely on the current-visibility filter the legacy helpers applied.
- Keep the per-target pages' rendered comment list unchanged from the user's perspective.

**Non-Goals:**

- No change to comment mutations, auth, or visibility rules.
- No change to `/comments` (already uses `getCommentListItems`).
- No new spec deltas (the change declares `skip_specs: true`; externally observable behavior is unchanged).
- No new helper module, no new types — reuse the unified helper's `CommentListResult`.

## Decisions

### Decision: Caller swap shape — `.items` accessor on `CommentListResult`

Per-target callers consume the unified helper as:

```ts
const { items: comments } = await getCommentListItems({ videoId, order: "asc" });
```

- **Why this shape:** `getCommentListItems` returns `CommentListResult` (with `items`, `total`, `page`, `pageSize`, `totalPages`). When `page` and `pageSize` are both undefined, the helper returns the full ascending set in one slice (`totalPages = 1`, `pageSize = total`, `items` is the full `CommentListItem[]`) — identical to what `getPublicVideoCommentListItems` / `getPhotoCommentListItems` returned before.
- **Why no per-target wrapper helper:** adding a thin `getVideoCommentListItems(videoId)` wrapper around `getCommentListItems` would re-create the per-target surface we are trying to delete and push the same `getCommentListItems({ videoId, order: "asc" }).items` pattern one layer down. Callers own the shape directly.
- **Alternatives considered:** a separate top-level `getAllCommentsForTarget(target)` helper — rejected because it adds a second read API for the same use case, which is exactly what we are consolidating.

### Decision: Keep `videoCommentSelect` and `photoCommentSelect`; drop the list-only row helpers and types

`app/_data/video-comments.ts` keeps:
- `videoCommentSelect` — still used by `createVideoComment`, `updateVideoComment` (and by `getPublicVideoComments`, which is being removed in this slice).
- `VideoCommentActionValues`, `createVideoComment`, `updateVideoComment`, `deleteVideoComment`, `getRequiredUserId`, `getPublicVideoOrThrow`, `normalizeCommentContent` — all unrelated to the list path.

`app/_data/video-comments.ts` drops:
- `getPublicVideoCommentListItems` — replaced by caller swap.
- `getPublicVideoComments` — only consumed by `getPublicVideoCommentListItems`.
- `toVideoCommentListItem` — only consumed by `getPublicVideoCommentListItems`.
- `PublicVideoComment` type — only referenced by `getPublicVideoComments` and `toVideoCommentListItem`.

Same shape in `app/_data/photo-comments.ts`:
- Keeps `photoCommentSelect`, `getPhotoCommentTargetContext`, `getPhotoWithPublishedTripOrThrow`, `revalidatePhotoTripPaths`, `revalidateFromTargetContext`, `normalizeCommentContent`, `PhotoCommentActionValues`, and the three mutations.
- Drops `getPhotoCommentListItems`, `getPhotoComments`, `toPhotoCommentListItem`, `PhotoCommentListRecord`.

### Decision: Drop the per-domain current-visibility filter

The legacy helpers applied `where: { video: { visibility: "PUBLIC" } }` and `where: { photo: { hikes: { some: { hike: { status: "PUBLISHED" } } } } }`. The unified helper applies neither — it trusts that any row in `Comment` was created under the per-domain creation-time gate.

- **Why safe:** the per-target callers' pages already gate by current visibility themselves.
  - `app/videos/[id]/page.tsx` only renders the public video detail page when the video is `PUBLIC`; for a private video the page shows a not-found state, so its `comments` are never read.
  - `app/(site-top-nav)/hikes/[slug]/page.tsx` only renders a photo in the viewer when the photo is linked to a `PUBLISHED` trip (`canViewFullPhotos`); otherwise it does not call `getPhotoCommentListItems` for that photo.
- **Why consistent:** feature-087 already adopted this model for `/comments` (the feed trusts creation-time visibility; the destination page enforces current visibility on click-through). The per-target readers now match that contract.
- **Alternatives considered:** keeping a thin `where: { video: { visibility: "PUBLIC" } }` in a per-target wrapper — rejected because it would re-introduce the divergence the consolidation is meant to remove.

### Decision: No changes to `getPhotoCommentTargetContext`

`getPhotoCommentTargetContext(photoId)` is still used by the photo comment mutations (`getPhotoWithPublishedTripOrThrow` calls it; `deletePhotoComment` also calls it for revalidation). It is not a read-helper; it is a small lookup that the mutations need. Keep it.

## Risks / Trade-offs

- **Per-target page now reads from `Comment` regardless of current target visibility** → if either caller ever forgets its current-visibility gate and renders comments on a hidden target, those comments could surface on the target page. Mitigation: the migration step that touches each caller explicitly verifies the gate is in place above the `getCommentListItems({ ... })` call. If the gate is missing, the caller fix is in scope of this refactor.
- **`/comments` and the per-target readers now agree on the "no current-visibility filter" model** → this is intentional, but it does mean a stale comment whose target was hidden after creation will still appear in the feed AND in the target page if the page ever loses its gate. The mitigation is the same as feature-087's: the destination page is responsible for showing a not-available state.
- **`videoCommentSelect` / `photoCommentSelect` stay in their respective files** → the helpers are now read-side orphans but mutation-side still uses them. Mitigation: this is acceptable; the helper modules already group mutations + shared types together. A future rename to `videoCommentMutationSelect` is out of scope here.
- **No dedicated test suite** → validation is `tsc`, ESLint over the changed files, and `npm run build`. Mitigation: add a manual smoke check in tasks (open a public video detail page and a published-trip photo viewer; confirm the comment list is identical to what it was before).

## Migration Plan

None. No Prisma schema change, no env change, no auth change, no data migration. Deployment is a series of in-place file edits:

1. `app/_data/video-comments.ts` — drop the list-only helpers/types.
2. `app/_data/photo-comments.ts` — drop the list-only helpers/types.
3. `app/videos/[id]/page.tsx` — swap import + call.
4. `app/(site-top-nav)/hikes/[slug]/page.tsx` — swap import + call.

Rollback is a single `git revert` of the feature-088 commit.

## Open Questions

None.