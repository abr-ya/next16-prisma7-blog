## Implementation Notes

This change applies the accepted comment link handling structure to public video comment list rendering.

## Runtime Changes

- Added `lib/comment-text-segments.ts` to split comment text into ordered text and safe web-link segments.
- Added `components/common/comment-text.tsx` to render comment text with escaped text nodes and generated safe anchors.
- Updated `components/video-pages/video-comment-composer.tsx` to render public video comment content through the reusable comment text renderer.

## Behavior

- `https://`, `http://`, and `www.` URLs in public video comments render as inline clickable links.
- `www.` links normalize to `https://` hrefs while preserving the visible text.
- Unsupported schemes and invalid URL candidates remain plain text.
- Generated anchors use `target="_blank"` and `rel="nofollow ugc noopener noreferrer"`.
- Comment storage, mutations, counts, empty states, author display, date display, and ordering remain unchanged.

## Validation Evidence

- `openspec validate feature-035-video-comments-link-rendering --strict` passed.
- TypeScript check passed through the local TypeScript binary.
- Targeted ESLint passed for the changed component and helper files.
- Root app ESLint passed.
- `git diff --check` passed.
- User-provided `npm run build` output passed.
- User-provided dev browser check confirmed links work.
