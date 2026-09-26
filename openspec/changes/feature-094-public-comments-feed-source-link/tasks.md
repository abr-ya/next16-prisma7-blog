# Tasks

## 1. Extend the shared CommentList building block

- [x] 1.1 Add an optional `renderTarget?: (comment: CommentListItem) => ReactNode` prop to `CommentList` in `components/comments/comment-list.tsx`, parallel to the existing `renderActions`. Verify TypeScript sees the new prop and the existing call sites still type-check unchanged.
- [x] 1.2 Render the `renderTarget` output inside the existing `flex items-center gap-2` row beneath the comment text, only when a renderer is provided. Verify the article shell, avatar row, and existing `renderActions` rendering keep their previous markup and classes.

## 2. Wire the source link on the public /comments feed

- [x] 2.1 In `app/(public)/comments/page.tsx`, pass a `renderTarget` to `CommentList` that returns a `next/link` (`Link` from `next/link`) pointing at `comment.target.href` with a short, accessible label such as `View on {type}`. Verify the existing pagination, view toggle, and empty state render paths are untouched.

## 3. Validation

- [x] 3.1 Run `npm run tsc` and verify it exits 0.
- [x] 3.2 Run `npm run lint` and verify it exits 0. (If lint cannot see `components/comments/comment-list.tsx`, fall back to `npx eslint components/comments/comment-list.tsx app/\(public\)/comments/page.tsx --quiet`.)
- [x] 3.3 Run `npm run build` and verify it exits 0.
- [ ] 3.4 In a browser with at least one comment visible on `/comments`, confirm each card now exposes a clickable source link, that following it jumps to the target (a public `/videos/{id}` or a published `/trips/{slug}`), and that the per-target comment lists on the video detail page and trip photo viewer do **not** show this source link. Record the result in the change notes.

## 4. Backlog and OpenSpec housekeeping

- [x] 4.1 In `openspec/backlog.md`, move the `public-comments-feed-source-link` row from the `## P0 Now` table to a `Done` row referencing `feature-094-public-comments-feed-source-link`, using the wording from the proposal's "What Changes" summary. Verify the next available `feature-XXX` number is now `095` (next free after `094` and the reserved Account Trust `091–093`).
