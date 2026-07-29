## 1. Detail Media Component

- [x] 1.1 Add a client `VideoDetailMedia` component under `components/video-pages`.
- [x] 1.2 Render preview mode by default using the existing thumbnail/fallback behavior.
- [x] 1.3 Render player mode with the existing iframe attributes when `embedUrl` is available.
- [x] 1.4 Show preview/player toggle controls with player mode disabled when `embedUrl` is missing.
- [x] 1.5 Show a short unavailable-player reason for videos without embed playback.

## 2. Public Detail Integration

- [x] 2.1 Replace the current iframe-or-thumbnail conditional in `app/videos/[id]/page.tsx` with the new detail media component.
- [x] 2.2 Keep the existing open-video action and metadata/bookmark/comment sections unchanged.
- [x] 2.3 Keep the media area responsive and stable on mobile and desktop.

## 3. Validation

- [x] 3.1 Run `openspec validate feature-011-video-preview-player-toggle --strict`.
- [x] 3.2 Run TypeScript validation with `npm run tsc`.
- [x] 3.3 Run root lint with `npm run lint`.
- [x] 3.4 Run targeted ESLint for changed `components/video-pages` files.
- [x] 3.5 Hand off `npm run build` and browser checks for preview/player states if sandbox limits make full validation unreliable.
