# Design

## Context

The shared `CommentList` building block (in `components/comments/comment-list.tsx`) is a `"use client"` component that already accepts an optional `renderActions?: (comment: CommentListItem) => ReactNode` prop. It is consumed by both per-target surfaces (video detail page, trip photo viewer) and the public `/comments` feed. The `CommentListItem.target.href` field is already populated by `toCommentListItem` in `app/_data/comments.ts` (`/videos/{id}` for video, `/trips/{slug}` for photo).

The public `/comments` feed page (`app/(public)/comments/page.tsx`) currently passes only `comments` and `emptyState` to `CommentList`. There is no source link rendering. The candidate adds an opt-in `showSourceLink?: boolean` flag and turns it on for the feed page only.

## Goals / Non-Goals

**Goals:**

- Render a clickable source link on every `/comments` card using the already-populated `comment.target.href`.
- Keep the change localised to UI: no schema, no data helper, no visibility rule changes.
- Preserve the existing `CommentList` API for the other two consumers (video detail page, trip photo viewer), which continue not to set `showSourceLink`.

**Non-Goals:**

- Wrapping the entire card in a `<Link>` is out of scope; this slice ships the small source-link element only.
- The trip-side deep-link upgrade (`/trips/{slug}?photo={photoId}`) belongs to the separate `public-trip-photo-deep-link` candidate.
- No `hash`/`#comment-{id}` anchor scroll behaviour.
- No owner-only variants, no no-JS fallback, no anchor/preview-image rendering.
- No changes to per-target comment lists.

## Decisions

**1. Use an opt-in `showSourceLink?: boolean` prop with inline source-link rendering inside `CommentList`.** Earlier drafts considered an opt-in `renderTarget?: (comment) => ReactNode` function prop, but a Server Component cannot pass a plain function to a Client Component (Next.js RSC boundary rejects it unless the function is marked `"use server"`, which only fits server actions). With a single consumer (`/comments`) and one shape (small link + icon + "View source" label), a boolean flag is enough — the data needed for the link already lives on `CommentListItem.target.href`, so `CommentList` can render the link itself. Alternative considered: keep the `renderTarget` function and add a thin `"use client"` wrapper component the feed page imports — rejected as unnecessary indirection for one consumer.

**2. Render the link inside the existing actions row (`<div className="flex items-center gap-2">`)**, only when `showSourceLink` is `true`. This places the link in a predictable spot, matches the visual rhythm of the `renderActions` prop, and keeps the article shell unchanged. Alternative considered: a dedicated `mt-2` block under the comment text — rejected because the actions row already groups "secondary affordances" and source-link semantically belongs with them.

**3. Hardcode the link shape (small inline `next/link` + `ExternalLink` icon + "View source" label) in `CommentList` rather than externalising it.** Only one consumer needs this shape today; if a future consumer needs a different label or icon, we add a follow-up slice rather than over-flexible props now. Alternative considered: a `sourceLinkLabel?: string` prop — rejected because the label is shaped to match the link's role ("View source"), and exposing the string invites UI drift across consumers.

**4. Card stays non-clickable; only the small source link is interactive.** Keeps a single interactive region per card, avoids the well-known accessibility problem of nested links, and lets the future deep-link work upgrade `target.href` without touching card markup. Alternative considered: wrap the entire `<article>` in `<Link>` — rejected as out of scope for this slice and likely a separate UX decision.

**5. The shared capability `public-comments-unified-feed` requirement #1 is tightened** so its "each card links to the underlying target" scenario generalises from "the title is rendered as a link" to "a clickable source link visible on the card navigates to the target's normalized `href`". The candidate does not link the title; widening the scenario to cover a separate source-link element matches the implementation without introducing a second competing requirement.

## Risks / Trade-offs

- **Existing spec scenario wording drift.** Modifying the "title is rendered as a link" clause is a wording change in the live spec. Mitigation: the replacement language is the actual behaviour this slice ships, and it explicitly allows either the title-link or a separate source-link rendering so the field remains accurate.
- **Source-link shape is owned by `CommentList`.** Hardcoding the label/icon in the building block means a future consumer wanting a different shape will need a follow-up slice. Acceptable trade-off for the current scope — flagged here so the next reader knows where to land.
- **Future deep-link follow-up must not break the link shape.** The trip-side `public-trip-photo-deep-link` candidate will change `toCommentListItem` to write `/trips/{slug}?photo={photoId}` — at that point `/comments` automatically inherits the new URL with no `CommentList` change. No risk for this slice.

## Migration Plan

No data migration. No rollout flag. Pure client-side rendering. After merge, anonymous and authenticated visitors both see the new link on `/comments`. No rollback key needed; if the link were removed the existing `renderActions`-less feed card shell is the before-state.

## Open Questions

None. The trip-side deep-link upgrade and the "whole card clickable" UX change are tracked as separate candidates and are not needed to scope this slice.
