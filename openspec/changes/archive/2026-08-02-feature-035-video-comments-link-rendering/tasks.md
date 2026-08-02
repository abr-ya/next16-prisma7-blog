## 1. OpenSpec

- [x] 1.1 Create the implementation change for video comment link rendering.
- [x] 1.2 Update the backlog with `feature-035-video-comments-link-rendering`.
- [x] 1.3 Add spec requirements for supported URL rendering and safe fallbacks.

## 2. Implementation

- [x] 2.1 Add a shared comment text segmentation helper for text and link segments.
- [x] 2.2 Add a reusable comment text renderer for escaped text plus safe anchors.
- [x] 2.3 Apply the renderer to public video comment list items.
- [x] 2.4 Preserve existing comment creation, count, empty state, and author/date rendering behavior.

## 3. Validation

- [x] 3.1 Run `openspec validate feature-035-video-comments-link-rendering --strict`.
- [x] 3.2 Run `npm run tsc`.
- [x] 3.3 Run targeted ESLint for changed component/helper files.
- [x] 3.4 Run `git diff --check`.
- [x] 3.5 Run `npm run build`.
- [x] 3.6 Ask for or perform a browser check covering supported URLs, unsupported schemes, trailing punctuation, and long URLs in video comments.
