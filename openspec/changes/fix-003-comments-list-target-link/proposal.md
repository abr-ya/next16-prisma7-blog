# Proposal

## Why

The public `/comments` page (feature-087) renders comment cards through the shared `CommentList` building block, but `CommentList` currently ignores the `target` field on each `CommentListItem` — it never renders the target title or the link to the target page. The data is already there (`target.type`, `target.title`, `target.href`, `target.previewImageUrl` are populated by `getCommentListItems`), so cards on `/comments` show no indication of which video or trip the comment belongs to, and there is no way to navigate from a comment card to its target.

The `public-comments-unified-feed` spec already requires this: scenario "Each card links to the underlying target" says "the title is rendered as a link to that `href`". This fix closes that gap for the public feed page. Per-target pages (video detail, photo viewer) keep their existing in-context rendering and stay untouched — they do not use `CommentList`, and we do not introduce target links into their per-target comment lists.

## What Changes

- Render the target on each `CommentList` card only when the caller opts in via a new `showTarget?: boolean` prop (default `false`). When enabled, show the normalized target `title` as a link to `target.href` below the comment text. The target preview image, when present, is rendered as a small thumbnail inside the link.
- Enable the new prop on the `/comments` page (`app/comments/page.tsx`) by passing `showTarget`.
- Keep `CommentList` defaults unchanged for any future caller that does not opt in (no behavioural change to the current `VideoCommentComposer` / photo-gallery components, which do not use `CommentList`).

### Non-goals

- No new comment target domains, mutation controls, moderation, search, or filters.
- No change to per-target comment lists (video detail, trip photo viewer) — they continue to render comments in their own in-context components.
- No change to `CommentListItem`, the `target` shape, `getCommentListItems`, or any data helper.
- No new design language for the target link — reuse the existing muted-foreground / link styling already used by other target-style references in the codebase.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The existing `public-comments-unified-feed` capability already requires this behavior ("Each card links to the underlying target"); the change implements the missing rendering without changing the requirement. The change opts out of spec deltas via `skip_specs: true` in `.openspec.yaml`.

## Impact

- Affected code (read-mostly):
  - `components/comments/comment-list.tsx` — add `showTarget?: boolean` prop, optional target block under the comment text.
  - `app/comments/page.tsx` — pass `showTarget` to `CommentList`.
- Affected routes: `/comments` only. Per-target routes (`/videos/[id]`, `/hikes/[slug]`) are unchanged.
- Affected data: read-only. No Prisma schema change, no migration, no new models, no new indexes.
- No new dependencies, no env changes, no auth changes.
- Validation: `npm run tsc`, targeted ESLint for the changed files, `npm run build` for the public route.
- Manual smoke: open `/comments` and confirm each card shows the target title as a clickable link to `/videos/{id}` or `/trips/{slug}`, plus a thumbnail when the target has a `previewImageUrl`.
- Backlog bookkeeping: on completion, append a `fix-003 | fix-003-comments-list-target-link | comments/public | ...` row to the Fix History table in `openspec/feature-history.md`.