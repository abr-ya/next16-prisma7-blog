## 1. Lightbox orientation

- [ ] 1.1 Render the active-photo ordinal and linked-photo total from the existing gallery navigation state, including the one-photo case.
- [ ] 1.2 Preserve the existing stored-order previous/next navigation and keyboard behavior while updating the position label for every active photo.

## 2. Stable authorized details overlay

- [ ] 2.1 Recompose the existing authorized photo detail summary and map-focus action as a bounded, semi-transparent overlay within the large-photo viewer.
- [ ] 2.2 Ensure toggling the overlay does not resize the dialog or introduce dialog-level scrolling, while keeping close and previous/next controls usable on narrow viewports.
- [ ] 2.3 Preserve the existing owner/creator/accepted-participant/admin detail boundary and image-only behavior for every other viewer.

## 3. Verification and documentation

- [ ] 3.1 Update the feature checklist and relevant backlog/history documentation to reflect implementation status and any deferred QA.
- [ ] 3.2 Run `openspec validate feature-078-outdoor-trip-photo-lightbox-overlay-polish --strict`, `npm run tsc`, targeted ESLint for changed non-`app` files, and `npm run lint` for changed `app` files.
- [ ] 3.3 Ask the user to run `npm run build` locally and manually verify the single/multi-photo counter, navigation, authorized overlay toggle without layout shift or dialog scrolling, narrow viewport controls, and unauthorized image-only behavior.
