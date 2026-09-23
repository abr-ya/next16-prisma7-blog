# Design

## Context

The public `/comments` page (feature-087) renders cards through the shared `CommentList` building block in [components/comments/comment-list.tsx](../../components/comments/comment-list.tsx). Each `CommentListItem` already carries a populated `target: { type, title, href, previewImageUrl }`, but `CommentList` never renders any of it — cards show only author, date, text, and optional `renderActions`. The public `/comments` page does not pass `renderActions`. The `public-comments-unified-feed` spec already requires this rendering; this fix closes the gap.

Per-target pages (video detail, trip photo viewer) do not use `CommentList` — they render comments through their own components, so they are out of scope.

See [proposal.md](proposal.md) for motivation.

## Goals / Non-Goals

**Goals:**

- Render the target on each card on `/comments` only.
- Keep `CommentList` generic — no behavioural change for future callers that do not opt in.
- Minimal diff: one new optional prop on `CommentList`, one new prop pass-through on the `/comments` page.

**Non-Goals:**

- No change to `CommentListItem`, the `target` shape, or any data helper.
- No change to per-target comment lists.
- No new shared UI primitives; reuse existing `Link`, muted-foreground link styling, and a small thumbnail.

## Decisions

### Decision: New optional `showTarget?: boolean` prop on `CommentList` (default `false`)

Add a single new prop. When `true`, render a target block under the comment text: a small thumbnail (if `target.previewImageUrl` is non-null) followed by the target `title` rendered as a `<Link href={target.href}>` with the existing muted-foreground link styling.

- **Why a boolean prop:** the simplest opt-in that keeps the component generic. Future callers that do not want the target (none today, but possible later) can leave it `false`.
- **Why not a `renderTarget` slot like `renderActions`:** the target has a single canonical shape and is intrinsic data, not an action. A boolean matches that.
- **Alternatives considered:** always render the target (simpler but couples `CommentList` to the `/comments` use case); a `renderTarget` slot (more flexible but more code for a single canonical shape).

## Risks / Trade-offs

- **Per-target pages still do not use `CommentList`** → no risk of accidentally surfacing target links there. The new prop defaults to `false`; nothing is enabled until `/comments` opts in.
- **`target.previewImageUrl` may be `null`** → render the link without a thumbnail in that case (already the design's intent — the title alone is sufficient).
- **No automated browser test** → mitigation: a small manual smoke check (open `/comments`, confirm a card with a video target clicks through to the video, and a card with a photo target clicks through to the trip).

## Migration Plan

None. No Prisma schema change, no env change, no auth change, no data migration. Deployment is two in-place edits. Rollback is a single `git revert`.

## Open Questions

None.