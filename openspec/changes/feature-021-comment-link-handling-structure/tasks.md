## 1. Link Handling Structure

- [x] 1.1 Inventory the existing video comment storage and rendering boundary.
- [x] 1.2 Confirm this slice is planning-only and does not require Prisma, route, or runtime UI changes.
- [x] 1.3 Define which plain URL forms should become clickable links.
- [x] 1.4 Define unsupported URL schemes and invalid candidates as plain-text fallback behavior.
- [x] 1.5 Define safe anchor rendering attributes for user-generated comment links.

## 2. Future Implementation Boundary

- [x] 2.1 Define the future shared comment text segmentation helper contract.
- [x] 2.2 Keep storage as existing plain `Comment.content`.
- [x] 2.3 Keep link previews, rich text, markdown, moderation, and spam controls out of this feature.
- [x] 2.4 Document the first implementation target as public video comment list rendering.

## 3. Spec and Backlog

- [x] 3.1 Add an OpenSpec delta for comment link handling structure.
- [x] 3.2 Update the backlog row for `feature-021-comment-link-handling-structure` to `Proposed`.

## 4. Validation

- [ ] 4.1 Run `openspec validate feature-021-comment-link-handling-structure --strict`.
- [x] 4.2 Run `git diff --check`.
