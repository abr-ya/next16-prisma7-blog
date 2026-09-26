# Proposal

## Why

The public `/comments` feed (feature-087) is meant to expose a navigable source link on each card so visitors can jump from a comment to the underlying target — but the shared `CommentList` building block never renders that link. Today every card is a dead end at the feed level: visitors must recognise the comment text to guess which page the comment belongs to. The data layer already carries `comment.target.href` (set in `app/_data/comments.ts` for both video and trip-photo targets), so the gap is purely the missing UI hook.

This slice adds an opt-in `renderTarget` renderer to the shared `CommentList`, parallel to the existing `renderActions`, and uses it on `/comments` to render a small clickable source link using `comment.target.href`. The trip-side deep-link upgrade (`/trips/{slug}?photo={photoId}`) stays out of scope and is owned by the future `public-trip-photo-deep-link` candidate.

## What Changes

- Extend `components/comments/comment-list.tsx` with an optional `renderTarget?: (comment: CommentListItem) => ReactNode` prop rendered alongside `renderActions`.
- In `app/(public)/comments/page.tsx`, pass a `renderTarget` that returns a small `next/link` to `comment.target.href`, scoped to the current card only.
- Tighten the existing "each card links to the underlying target" scenario in the `public-comments-unified-feed` capability to match the now-implemented small source link rendering.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `public-comments-unified-feed`: make the source-link rendering on each card concrete — the card SHALL render a clickable source link visible on the card that navigates to the target's normalized `href` (for both video and trip-photo targets). The existing scenario that already promises "the title is rendered as a link" is generalised to the same source-link rendering that this slice actually ships.

## Impact

- **Components**: `components/comments/comment-list.tsx` (new optional prop, one render point). No call-site regression: existing consumers (video detail page, trip photo viewer) keep working without passing `renderTarget`.
- **Pages**: `app/(public)/comments/page.tsx` (new renderer passed to `CommentList`).
- **Data layer**: untouched — `app/_data/comments.ts` and `lib/comments.ts` already populate `target.href`.
- **Other surfaces**: per-target comment lists (video detail, trip photo lightbox) are unaffected because they continue not to pass `renderTarget`. The future `public-trip-photo-deep-link` candidate owns the trip-side upgrade to `/trips/{slug}?photo={photoId}`.
- **No new dependencies**, **no schema changes**, **no migration**, **no visibility rule changes**.
