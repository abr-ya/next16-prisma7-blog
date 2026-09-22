# Design

## Context

The shared comment domain foundation is already in place: `CommentListItem` and the `CommentTargetType` union live in `lib/comments.ts`; `CommentList` and `CommentComposer` UI building blocks live under `components/comments/`; and the per-domain data helpers `getPublicVideoCommentListItems` (in `app/_data/video-comments.ts`) and `getPhotoCommentListItems` (in `app/_data/photo-comments.ts`) define the normalized list-item shape and the row-to-item conversion logic. The placeholder `app/comments/page.tsx` hardcodes an empty list. See [proposal.md](proposal.md) for motivation.

The feed deliberately does **not** reuse the per-domain read helpers for filtering: those helpers filter by current target visibility (`video.visibility = PUBLIC`, `photo.hikes.some.hike.status = PUBLISHED`), and the feed wants to show every comment that was ever written on a public surface. It still reuses the per-domain row-to-item conversion so the rendered `CommentListItem` shape stays identical across the site.

## Goals / Non-Goals

**Goals:**

- Provide a single read-only server helper that returns a newest-first paginated slice of `CommentListItem[]` covering every supported comment target type, with no current-visibility filtering.
- Reuse the existing shared `CommentList` building block and `Pagination` UI; introduce at most one small client component for the `All` / `Mine` toggle.
- Make the feed read work for anonymous visitors without exposing per-user data; make the `Mine` filter an authenticated-only narrowing.

**Non-Goals:**

- New Prisma models, migrations, indexes, or schema changes.
- New shared UI primitives beyond the optional `All` / `Mine` toggle.
- New comment target domains — `post` and `md-doc` stay reserved but no data path is added in this slice.
- Feed-side visibility filtering (the feed trusts the creation-time gate and lets the target page enforce current visibility on click-through).
- Owner-specific or privileged views on this page.
- Caching strategy (ISR / `revalidate`) — the page renders on every request like other comment-bearing surfaces and can be revisited later if needed.
- Public comments search, filtering, grouping, or aggregate analytics.

## Decisions

### Decision: One unified `getCommentListItems` action (no current-visibility filtering)

The shared module `app/_data/comments.ts` exports a single read action `getCommentListItems(query)` that handles both the per-target and the feed use case. It issues a single `prisma.comment.findMany` that joins `user`, `video` (id/title/thumbnailUrl), and `photo` (id/title + first image fileAsset.url + most recent `hikesToPhotos.hike.slug`), with no current-visibility filters. Each row is normalized to `CommentListItem` via a local adapter.

```ts
getCommentListItems({
  videoId?,          // per-target: that video's comments
  photoId?,          // per-target: that photo's comments
  page?, pageSize?,  // pagination (feed)
  viewerId?, view?: "all" | "mine",  // author narrowing (feed)
  order?: "asc" | "desc",  // asc for per-target, desc for feed
}) → { items, total, page, pageSize, totalPages }
```

- **Why no visibility filter:** every existing `Comment` row was created under a per-domain creation-time gate that required a public surface (`createVideoComment` requires `video.visibility = PUBLIC`; `createPhotoComment` requires a `PUBLISHED` trip link). A comment in the table is therefore proof that the page was public at write time. If the target later became hidden, the link in the feed will simply not open on the target page; the feed does not need to second-guess this. The target page is responsible for showing an explicit "no longer available" message rather than redirecting.
- **Why one function, not fan-out through per-domain helpers:** the per-domain helpers filter by current visibility, so reusing them would silently apply the "drop if hidden now" rule we are explicitly not applying here. Inlining the same conversion shape (author + target.title/href/previewImageUrl) into a shared module is small, keeps visibility logic out of the read path, and lets future per-target callers opt into the same trust-creation-gate model without rewriting the join.
- **Photo href:** for photo comments we use the most recently assigned trip's slug (any status) — if no trip link exists at all (should not happen in practice given the creation gate), the item is skipped rather than rendered with a broken href.
- **`OR: [{ videoId: { not: null } }, { photoId: { not: null } }]`** (used when neither `videoId` nor `photoId` is supplied) keeps the result set to the two supported target types and silently drops any malformed legacy row that has both nulls.
- **Pagination default:** when neither `page` nor `pageSize` is supplied (per-target use case), the helper returns all matching rows in one call, with `total === items.length`, `totalPages === 1`, `page === 1`, and `pageSize === total`. Feed callers explicitly pass `page`/`pageSize` to opt into pagination.

### Decision: Existing per-target helpers stay as-is in this slice

For the duration of feature-087, `getPublicVideoCommentListItems` (in `app/_data/video-comments.ts`) and `getPhotoCommentListItems` (in `app/_data/photo-comments.ts`) are **not** refactored to call `getCommentListItems`. Reasons:

- Feature-086 callers (video detail page, trip photo viewer) already work; this slice must not silently change their behavior.
- The new shared module is intentionally additive — it ships the unified function and the feed page, and stops short of touching working code paths.
- Migrating callers and removing the old helpers is its own follow-up feature (see `openspec/backlog.md` → `comments-helper-refactor`). That slice will (a) update the per-target callers to call `getCommentListItems({ videoId })` / `getCommentListItems({ photoId })`, (b) drop the per-domain `*ListItems` exports, and (c) clean up unused imports/select shapes.

There is therefore a brief overlap where two helpers cover overlapping functionality; this is acceptable and bounded.

### Decision: Page size and pagination semantics

Page size is a constant exported from the feed helper (`FEED_PAGE_SIZE = 20`). The page reads `searchParams.page` as an integer, clamps it to `>= 1`, and treats any page beyond the total as an empty feed rather than an error (matches the existing public-list pattern).

- **Alternatives considered:** cursor-based pagination — rejected for MVP simplicity; the current dataset is small and `?page=` matches the existing `components/blog-pages/pagination.tsx` contract.

### Decision: `Mine` filter is server-side

The feed helper accepts an optional `viewerId` plus a `view` argument (`"all" | "mine"`). When `view === "mine"` and `viewerId` is set, the helper filters the list to `item.author.id === viewerId` before pagination.

- **Why server-side:** keeps the auth boundary in one place, avoids exposing the full unified list to the client for client-side filtering, and prevents viewer-id spoofing.
- **Anonymous + `view=mine`:** the helper ignores `viewerId` when null and behaves as `view === "all"` (matches the spec requirement that anonymous `?view=mine` shows the same default feed).

### Decision: View toggle is a small client component using Link navigation

A single client component `FeedViewToggle` (`components/comments/feed/feed-view-toggle.tsx`) renders the `All` / `Mine` segmented control as two `Link` components to `/comments` and `/comments?view=mine`, preserving the current `?page=` query.

- **Why client:** the existing public-navbar pattern uses `<Link>` for navigation; this component is small enough to keep client-side without splitting the page.
- **Alternatives considered:** server `<a>` only — would work, but a small interactive segmented control matches the existing video/photo comment UIs that already use `<Button>` with `onClick` for client actions.

### Decision: Component layout

- Rewrite `app/comments/page.tsx` as a server component: read `searchParams`, fetch the feed page, render `PageLayout`, the view toggle (when an authenticated viewer is present), the `CommentList` with an empty state, and the `Pagination`.
- No changes to `(site-top-nav)` route group — moving `/comments` under it belongs to the separate `public-navbar-route-coverage-rollout` slice.
- No changes to the shared `CommentList` or `CommentComposer` components.

### Decision: No owner-specific or privileged view in this feed

The `/comments` page is one uniform feed for every viewer. There is no separate owner view, no admin variant, no privileged list of "your own comments across hidden targets" — those surfaces, if needed, belong to dedicated routes (likely under `/admin` or a separate "my comments" page) and to their own numbered features. This keeps the public feed predictable: everyone sees the same list given the same `?view=` and `?page=`.

## Risks / Trade-offs

- **A stale card may link to a now-hidden target** → a comment whose video later goes PRIVATE or whose trip later goes DRAFT remains in the feed; the click-through target page is responsible for showing a not-found / not-available page in that case. This is acceptable for MVP and matches the user's chosen "trust the creation-time gate" model. Mitigation: a future "remove stale comments" follow-up can prune them if it becomes noisy.
- **No caching on the feed page** → matches existing per-target comment surfaces, which always render dynamic content. Mitigation: revisit when the per-request cost becomes a measured problem.
- **`post` and `md-doc` exist in `CommentTargetType` but are not in this feed** → a future spec adds those target domains, not this slice. The feed helper queries only the supported per-domain columns (`video`, `photo`) so a new domain is an explicit, opt-in addition.
- **`CommentForm` is still imported in the placeholder page** → must be removed in the rewrite so the page does not render an unusable form. Mitigation: covered in tasks as part of the placeholder rewrite.
- **Deep-link to a specific photo inside a trip is not in scope** → a feed card for a photo currently links to `/trips/{slug}` (the trip root), not to a specific photo. A `?photo={photoId}` deep-link on the trip page is its own follow-up feature (see `openspec/backlog.md` → `public-trip-photo-deep-link`). The feed ships with the existing `href` shape and the deep-link feature can later update the photo href format if/when both pieces are ready.

## Security, Auth, and Visibility

- **Feed-side visibility:** intentionally none. The feed trusts the creation-time gate (`video.visibility = PUBLIC` at write for video comments; `hike.status = PUBLISHED` at write for photo comments) and renders every existing comment. There is no current-visibility join in the feed query.
- **Click-through visibility:** the destination page (`app/videos/[id]/page.tsx` and `app/(site-top-nav)/hikes/[slug]/page.tsx`) enforces current visibility independently. If a video later goes PRIVATE or a trip later goes DRAFT, the link from the feed lands on a not-found / not-available page — the feed does not need to mirror that check.
- **Anonymous viewers** receive the same data as authenticated `all` viewers; no per-user information is added, removed, or derived for anonymous requests.
- **The `Mine` filter** relies on `authSession()` from `lib/auth-utils.ts`; the page never trusts a client-supplied viewer id. When the session is null and `view=mine`, the helper degrades to the default `all` view with no error.
- **No CSRF surface** (read-only page), no cookies written, no auth state mutated.
- **Owner-specific view:** explicitly out of scope for this feed. Owners, admins, and other privileged audiences do not get a different feed on this page; if such a surface is wanted, it belongs to a dedicated route under its own feature number.

## Migration Plan

None. No Prisma schema change, no env change, no auth change, no data migration. Deployment is a single-file route rewrite plus one new helper module.

## Open Questions

None that would change the specs, the approach, or the task breakdown.
