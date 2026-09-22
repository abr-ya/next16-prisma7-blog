# Proposal

## Why

The shared public navbar already lists **Comments** as a primary link, and the comment domain foundation is in place (`comments-domain-structure`), but `/comments` is still a placeholder page that hardcodes `const comments = []`. This slice turns the link into a real, read-only MVP feed of all visible comments on the site so visitors can discover recent conversation without picking a target first, while the deeper per-domain UI (creation, mutation, moderation, additional domains) stays out of scope for follow-ups.

## What Changes

- Replace the placeholder `app/comments/page.tsx` with a real public feed page that lists comments across every supported visible target.
- Add a server-side read helper that returns a paginated, newest-first `CommentListItem[]` across all currently visible targets — initially public videos and photos linked to a published trip — and reuses the existing normalized `target` shape (type, title, href, previewImageUrl) so per-domain writers stay unchanged.
- Render the feed through the existing shared `CommentList` building block (from feature-085); each card shows the comment body, author, date, and a target label that links to the underlying public page.
- Support a `Mine` view for authenticated visitors that filters the same feed to their own comments.
- Reuse the existing `Pagination` component with `?page=` query-param semantics; default page size is small (e.g. 20) and stays consistent between views.
- Keep server reads visible-only: anonymous visitors and authenticated viewers see only comments on supported visible targets (public videos; photos linked to a published trip). Visibility is enforced server-side, not client-side.

### Non-goals

- Creating, editing, deleting, or moderating comments from the `/comments` page (those already exist on the per-domain surfaces and are unchanged).
- Adding new comment target domains (posts, md-docs, future types) — the normalized type union already reserves the slots but the feed stays limited to what each per-domain read helper already supports.
- Public counts of "comments by user", aggregate analytics, search, filters by target type, sort options, or per-target grouping.
- Real-time updates, notifications, mentions, or email integration.
- Moving `/comments` into the `(site-top-nav)` shared shell — that's the responsibility of `public-navbar-route-coverage-rollout` (P1) and stays a separate slice.

## Capabilities

### New Capabilities

- `public-comments-unified-feed`: Public read-only `/comments` page that lists a newest-first, paginated feed of comments across supported visible targets, plus an authenticated `Mine` view, built on the existing normalized shared comment list item shape.

### Modified Capabilities

None. `comments-domain-structure` already defines `/comments` as a unified feed and the normalized list-item contract; this slice implements that contract without changing its requirements. `video-comments` and `outdoor-photo-comments` per-domain contracts are unchanged — the feed only consumes their already-published normalized list items.

## Impact

- Affected routes: public `GET /comments` (with optional `?page=N` and `?view=all|mine` query params). No new public routes, no admin routes, no API routes.
- Affected data: read-only. No Prisma schema change, no migration, no new models, no new indexes.
- Affected code:
  - Rewrite `app/comments/page.tsx` (currently a placeholder using `PageLayout` + hardcoded empty list).
  - New read helper under `app/_data/` (e.g. `public-comments-feed.ts`) that fans out to existing per-domain selectors (`getPublicVideoCommentListItems`, `getPhotoCommentListItems`) and merges + sorts + paginates server-side.
  - Optional small client component under `components/comments/feed/` for the `All` / `Mine` segmented control when the view is not driven by a plain link.
- Reused building blocks: `CommentList` from `components/comments/comment-list.tsx`, `Pagination` from `components/blog-pages/pagination.tsx`, `CommentListItem` type from `lib/comments.ts`, `CommentText` from `components/common/comment-text.tsx`, `PageLayout`, auth helpers from `lib/auth-utils.ts`.
- No new dependencies, no env changes, no auth changes.
- Validation: `npm run tsc`, targeted ESLint for changed non-`app` files, `npm run lint` for changed `app` files, `npm run build` for the route change.
- Backlog bookkeeping: on completion, mark this entry `Done` in `openspec/backlog.md` and append a row to `openspec/feature-history.md`.
