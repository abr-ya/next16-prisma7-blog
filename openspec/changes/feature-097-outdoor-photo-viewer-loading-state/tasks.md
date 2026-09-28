# Tasks

## 1. Viewer image lifecycle

- [x] 1.1 Add selected full-size photo lifecycle state in `HikePhotoGallery` and reset it for opening, keyboard navigation, and previous/next controls; verify a new selection cannot render the previous selection's image.
- [x] 1.2 Render compact loading and generic error states in the fixed viewer image area; wire image load/error events to the active photo identity and verify stale events cannot replace a later selection's state.
- [x] 1.3 Keep previous/next controls and existing title, ordinal, details, comments, and authenticated access behavior usable throughout loading and error states; verify no file/provider URL or internal error is added to the UI.

## 2. Validation and tracking

- [x] 2.1 Run `npm run tsc`, targeted ESLint for `components/hike-pages/hike-photo-gallery.tsx`, and `npm run lint`; verify each applicable command passes.
- [ ] 2.2 Run `openspec validate feature-097-outdoor-photo-viewer-loading-state --strict`, ask the user to run `npm run build` locally, and manually verify first-open loading, rapid previous/next changes, and image-load failure as an authenticated user. Strict validation passed; local `npm run build` passed on 2026-09-28. Browser verification remains.
- [ ] 2.3 Keep `feature-097-outdoor-photo-viewer-loading-state` marked In Progress in `openspec/backlog.md` until implementation is complete.
