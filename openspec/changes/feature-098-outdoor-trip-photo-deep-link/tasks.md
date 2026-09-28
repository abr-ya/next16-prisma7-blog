# Tasks

## 1. Deep-link viewer coordination

- [x] 1.1 Add validated `photo` query-parameter handling at the trip media boundary; verify a linked gallery photo opens through the existing viewer and an unknown or cross-trip ID leaves the viewer closed.
- [x] 1.2 Expose gallery selection and close notifications to the media boundary; update the `photo` query through the native History API so Previous/Next and closing do not initiate route navigation or reset page scroll.
- [x] 1.3 Preserve existing guest sign-in guidance and authenticated viewer behavior when a deep link requests a photo; verify no full-size URL or protected details are added for guests.

## 2. Validation and tracking

- [x] 2.1 Run `npm run tsc`, targeted ESLint for the changed trip-media/gallery files, and `npm run lint`; verify each applicable command passes.
- [ ] 2.2 Run `openspec validate feature-098-outdoor-trip-photo-deep-link --strict`, ask the user to run `npm run build` locally, and manually verify valid direct opening, Previous/Next URL updates without route refresh, close behavior, invalid/cross-trip IDs, guest behavior, and browser back/forward navigation. Strict validation passed; local `npm run build` passed before the History API change on 2026-09-28 and should be rerun. Browser verification remains.
- [x] 2.3 Keep `feature-098-outdoor-trip-photo-deep-link` marked In Progress in `openspec/backlog.md` until implementation is complete.
