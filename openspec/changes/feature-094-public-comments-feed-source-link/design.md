# Design

## Context

The shared `CommentList` building block (in `components/comments/comment-list.tsx`) is a `"use client"` component that already accepts an optional `renderActions?: (comment: CommentListItem) => ReactNode` prop. It is consumed by both per-target surfaces (video detail page, trip photo viewer) and the public `/comments` feed. The `CommentListItem.target.href` field is already populated by `toCommentListItem` in `app/_data/comments.ts` (`/videos/{id}` for video, `/trips/{slug}` for photo).

The public `/comments` feed page (`app/(public)/comments/page.tsx`) currently passes only `comments` and `emptyState` to `CommentList`. There is no source link rendering. The candidate adds an opt-in `renderTarget` prop and uses it on the feed page only.

## Goals / Non-Goals

**Goals:**

- Render a clickable source link on every `/comments` card using the already-populated `comment.target.href`.
- Keep the change localised to UI: no schema, no data helper, no visibility rule changes.
- Preserve the existing `CommentList` API for the other two consumers (video detail page, trip photo viewer), which continue not to pass `renderTarget`.

**Non-Goals:**

- Wrapping the entire card in a `<Link>` is out of scope; this slice ships the small source-link element only.
- The trip-side deep-link upgrade (`/trips/{slug}?photo={photoId}`) belongs to the separate `public-trip-photo-deep-link` candidate.
- No `hash`/`#comment-{id}` anchor scroll behaviour.
- No owner-only variants, no no-JS fallback, no anchor/preview-image rendering.
- No changes to per-target comment lists.

## Decisions

**1. Add `renderTarget` as a sibling to `renderActions`.** Reusing the opt-in renderer pattern avoids forcing a fixed source-link UI on every consumer, lets the per-target lists stay untouched, and keeps the building block dumb. Alternative considered: always render a default link inside `CommentList` — rejected because that ships the source-link shape into the video detail page and trip photo viewer where it doesn't belong, and it locks down the label before we know it's right for every consumer.

**2. Render the link inside the existing actions row (`<div className="flex items-center gap-2">`)**, only when `renderTarget` is provided. This places the link in a predictable spot, matches the visual rhythm of the `renderActions` prop, and keeps the article shell unchanged. Alternative considered: a dedicated `mt-2` block under the comment text — rejected because the actions row already groups "secondary affordances" and source-link semantically belongs with them.

**3. The feed page uses an inline renderer returning `next/link` to `comment.target.href`.** `CommentList` is a client component and accepts function-typed props; the feed page (server component) can pass an inline factory because the returned React tree is fully client-side renderable. No server-only closure data is captured.

**4. Card stays non-clickable; only the small source link is interactive.** Keeps a single interactive region per card, avoids the well-known accessibility problem of nested links, and lets the future deep-link work upgrade `target.href` without touching card markup. Alternative considered: wrap the entire `<article>` in `<Link>` — rejected as out of scope for this slice and likely a separate UX decision.

**5. The shared capability `public-comments-unified-feed` requirement #1 is tightened** so its "each card links to the underlying target" scenario generalises from "the title is rendered as a link" to "a clickable source link visible on the card navigates to the target's normalized `href`". The candidate does not link the title; widening the scenario to cover a separate source-link element matches the implementation without introducing a second competing requirement.

## Risks / Trade-offs

- **Existing spec scenario wording drift.** Modifying the "title is rendered as a link" clause is a wording change in the live spec. Mitigation: the replacement language is the actual behaviour this slice ships, and it explicitly allows either the title-link or a separate source-link rendering so the field remains accurate.
- **Future deep-link follow-up must coordinate with the renderer.** The trip-side `public-trip-photo-deep-link` candidate will change `toCommentListItem` to write `/trips/{slug}?photo={photoId}` — at that point `/comments` automatically inherits the new URL with no `renderTarget` change. No risk for this slice.
- **Two opt-in renderers can drift.** `renderActions` and `renderTarget` are independent optional props. Per-call clarity matters but per-component reuse does not. Acceptable trade-off — the alternative (a single `renderExtras`) would over-couple unrelated UI pieces.

## Migration Plan

No data migration. No rollout flag. Pure client-side rendering. After merge, anonymous and authenticated visitors both see the new link on `/comments`. No rollback key needed; if the link were removed the existing `renderActions`-less feed card shell is the before-state.

## Open Questions

None. The trip-side deep-link upgrade and the "whole card clickable" UX change are tracked as separate candidates and are not needed to scope this slice.
