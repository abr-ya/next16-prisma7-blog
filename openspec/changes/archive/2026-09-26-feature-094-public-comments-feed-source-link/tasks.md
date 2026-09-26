# Tasks

## 1. Extend the shared CommentList building block

- [x] 1.1 Add an optional `showSourceLink?: boolean` prop to `CommentList` in `components/comments/comment-list.tsx`, parallel to the existing `renderActions`. Verify TypeScript sees the new prop and the existing call sites (video detail page, trip photo viewer) still type-check unchanged. Note: a server page cannot pass a function to a client component, so the source-link renderer has to live inside `CommentList` itself rather than be supplied per call site.
- [x] 1.2 When `showSourceLink` is `true`, render a small `next/link` to `comment.target.href` (with an `ExternalLink` icon and "View source" label) inside the existing `flex items-center gap-2` row beneath the comment text. Verify the article shell, avatar row, and existing `renderActions` rendering keep their previous markup and classes when `showSourceLink` is unset or `false`.

## 2. Wire the source link on the public /comments feed

- [x] 2.1 In `app/(public)/comments/page.tsx`, set `showSourceLink` on the `<CommentList>` invocation so the public feed exposes the source link on every visible card. Verify the existing pagination, view toggle, and empty state render paths are untouched.

## 3. Validation

- [x] 3.1 Run `npm run tsc` and verify it exits 0.
- [x] 3.2 Run `npm run lint` and verify it exits 0. (If lint cannot see `components/comments/comment-list.tsx`, fall back to `npx eslint components/comments/comment-list.tsx app/\(public\)/comments/page.tsx --quiet`.)
- [x] 3.3 Run `npm run build` and verify it exits 0.
- [x] 3.4 In a browser with at least one comment visible on `/comments`, confirm each card now exposes a clickable source link, that following it jumps to the target (a public `/videos/{id}` or a published `/trips/{slug}`), and that the per-target comment lists on the video detail page and trip photo viewer do **not** show this source link. Record the result in the change notes. Verified 2026-09-26 against the dev server: `/comments` cards now show the small "View source" link next to the comment; per-target comment lists on the video detail page and trip photo viewer do not render this link (they continue to omit `showSourceLink`).

## 4. Backlog and OpenSpec housekeeping

- [x] 4.1 In `openspec/backlog.md`, move the `public-comments-feed-source-link` row from the `## P0 Now` table to a `Done` row referencing `feature-094-public-comments-feed-source-link`, using the wording from the proposal's "What Changes" summary. Verify the next available `feature-XXX` number is now `095` (next free after `094` and the reserved Account Trust `091–093`).
