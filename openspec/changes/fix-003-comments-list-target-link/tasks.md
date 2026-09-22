# Tasks

## 1. Render the target on `CommentList` when opted in

- [ ] 1.1 In `components/comments/comment-list.tsx`, add a new optional `showTarget?: boolean` prop to `CommentListProps` (default `false`). When `true` and `comment.target` is set, render a target block under the `<CommentText>` line: a small `<Link href={comment.target.href}>` containing the target title, prefixed by a thumbnail `<img>` when `comment.target.previewImageUrl` is non-null. Reuse the existing muted-foreground link styling used elsewhere in the codebase; do not introduce new primitives. When `showTarget` is `false` or `comment.target` is missing, render nothing new.

## 2. Wire the new prop into the `/comments` page

- [ ] 2.1 In `app/comments/page.tsx`, pass `showTarget` to the `<CommentList comments={items} emptyState={emptyState} />` call. Confirm the prop is enabled on this page only; do not touch per-target comment lists or other callers of `CommentList` (none exist today, but keep the default `false` so future callers are unaffected).

## 3. Validation

- [ ] 3.1 Run `npm run tsc` and confirm zero TypeScript errors.
- [ ] 3.2 Run `npx eslint components/comments/comment-list.tsx app/comments/page.tsx --quiet` and confirm zero warnings.
- [ ] 3.3 Run `npm run build` and confirm `/comments` still appears in the public route list.
- [ ] 3.4 Manual smoke check in a local browser: open `/comments` and confirm every card with a video target shows a clickable link to `/videos/{id}`, every card with a photo target shows a clickable link to `/trips/{slug}`, the link text matches the target title, and a small thumbnail renders when `previewImageUrl` is non-null. Cards on per-target pages (video detail, photo viewer) are unchanged.

## 4. Backlog and documentation bookkeeping

- [ ] 4.1 Append a `fix-003 | fix-003-comments-list-target-link | comments/public | ...` row to the Fix History table in `openspec/feature-history.md`, summarising the new `showTarget` prop and the `/comments` opt-in.
- [ ] 4.2 Run `openspec validate fix-003-comments-list-target-link --strict` and confirm the change is ready to archive.