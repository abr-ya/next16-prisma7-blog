# Tasks

## 1. Server data helper

- [ ] 1.1 Add `app/_data/comments.ts` exporting `FEED_PAGE_SIZE = 20`, `CommentListQuery`, `CommentListResult`, and a unified `getCommentListItems(query)` action that handles both the per-target and the feed use case; implementation: (a) export a shared `commentIncludeForListItem` (`user` id/name/image, `video` id/title/thumbnailUrl, `photo` id/title + first image fileAsset.url + most recent `hikesToPhotos.hike.slug`) and a local `toCommentListItem` adapter (returns `CommentListItem` or `null` when the row cannot be normalized — e.g. photo with no trip link); (b) build the `where` clause from the query: `videoId` → `{ videoId }`, `photoId` → `{ photoId }`, neither → `{ OR: [{ videoId: { not: null } }, { photoId: { not: null } }] }`; add `{ userId: viewerId }` when `view === "mine"` and `viewerId` is set; (c) call `prisma.comment.findMany` with the shared include, `orderBy: { createdAt: order ?? "asc" }`; (d) normalize rows, dropping the ones the adapter rejects; (e) compute `total = items.length`, default `pageSize` to `FEED_PAGE_SIZE` when `page` is set else to `total`, clamp `page` to `>= 1`, slice to `pageSize`, compute `totalPages`; return `{ items, total, page, pageSize, totalPages }`. No current-visibility joins (no `video.visibility = PUBLIC`, no `hike.status = PUBLISHED`) — the action trusts the creation-time gate. The `/comments` page calls `getCommentListItems({ page, pageSize: FEED_PAGE_SIZE, viewerId, view, order: "desc" })`.
- [ ] 1.2 Verify the new module type-checks under `npm run tsc` (no new errors) and that an empty result, a single-page result, an out-of-range `page`, and a per-target call (`{ videoId }` / `{ photoId }`) return the documented shapes.

## 2. View toggle component

- [ ] 2.1 Add `components/comments/feed/feed-view-toggle.tsx` (client component) rendering an `All` / `Mine` segmented control as two `Link`s to `/comments` and `/comments?view=mine`, preserving the active `?page=` value and applying an `aria-current` attribute to the active view.
- [ ] 2.2 Verify the toggle renders correctly when no `viewerId` is present (the page should not mount it for anonymous viewers), when `viewerId` is present, and across pages `1` and `2`.

## 3. Rewrite the `/comments` page

- [ ] 3.1 Replace the contents of `app/comments/page.tsx` with a server component that: parses `searchParams` (`page`, `view`); reads the session via `authSession()` to obtain `viewerId`; calls `getPublicCommentsFeed({ viewerId, page, view })`; renders `PageLayout` with the `Comments` title, an authenticated-only `<FeedViewToggle />`, a `<CommentList comments={items} emptyState={...} />` reusing the shared empty-state messaging, and a `<Pagination currentPage page totalPages pageUrl="/comments" />` only when there is more than one page; preserve the existing `buildPageMetadata` call. Remove the unused `CommentForm` and the "todo: AuthButton" stub from the placeholder.
- [ ] 3.2 Verify the rewritten page type-checks under `npm run tsc`, lint-clean under `npm run lint` (or targeted ESLint for the changed `app/` file), and that the placeholder-only imports (`CommentForm`) are no longer referenced anywhere in `app/comments/`.

## 4. Validation

- [ ] 4.1 Run `npm run tsc` and confirm no new TypeScript errors.
- [ ] 4.2 Run targeted ESLint over the changed files (`app/comments/page.tsx`, `app/_data/public-comments-feed.ts`, `components/comments/feed/feed-view-toggle.tsx`) and confirm zero warnings.
- [ ] 4.3 Run `npm run build` and confirm the route compiles without errors and `/comments` appears in the build output as a public route.
- [ ] 4.4 Manually verify in a local browser: anonymous `/comments` lists newest-first video and trip-photo comments; `/comments?page=2` paginates; `/comments?view=mine` for an authenticated user filters to own comments; anonymous `/comments?view=mine` falls back to the default feed; an empty `/comments` shows the empty state without the pagination control; no comment creation, edit, delete, reply, or moderation controls are rendered on any card or anywhere on the page.

## 5. Backlog and documentation bookkeeping

- [ ] 5.1 Remove or update the `public-comments-unified-feed-mvp` row in the `## P0 Now` section of `openspec/backlog.md` (it is now implemented and ready for archival; move its follow-up candidates — additional target domains, full moderation, search/filters — into `P1 Soon` or `P2 Later` if not already covered elsewhere).
- [ ] 5.2 Append a `feature-087 | feature-087-public-comments-unified-feed-mvp | comments/public | ...` row to the Completed Features table in `openspec/feature-history.md`, summarising the new public read-only `/comments` feed with the `Mine` view and per-domain visibility preserved.
- [ ] 5.3 Run `openspec validate feature-087-public-comments-unified-feed-mvp --strict` and confirm the change is ready to archive.
