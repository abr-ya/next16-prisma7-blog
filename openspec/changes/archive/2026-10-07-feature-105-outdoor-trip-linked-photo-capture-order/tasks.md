# Tasks

## 1. Stored capture-order projection

- [x] 1.1 Extend the public trip photo projection with a nullable reliable stored capture-instant sort key derived from existing parsed EXIF metadata and confirmed normalization only; verify no EXIF reparse, timezone guessing, Prisma schema change, or visibility expansion is introduced.
- [x] 1.2 Preserve the existing manual association order and expose sufficient photo-order data to the public media client; verify dated photos can sort ascending and undated photos retain relative manual order after them.

## 2. Gallery ordering and URL state

- [x] 2.1 Add a client-side `Capture time` / `Manual order` selector that is always rendered, defaults to capture order, disables when computed sequences match, and keeps one selected ordered array for cards and lightbox previous/next navigation; verify a selected photo remains selected by ID across an order change.
- [x] 2.2 Synchronize validated `photoOrder` and existing `photo` query state with native `history.replaceState`, preserving unrelated parameters and avoiding Next route navigation; verify malformed or missing `photoOrder` falls back to capture order and browser history receives no per-control entries.
- [x] 2.3 Add the persistent accessible red unavailable-date indicator before undated card titles in both modes; verify it does not overlap thumbnails, likes, or owner/admin controls.

## 3. Localized Trips UI

- [x] 3.1 Add the `trips` i18n namespace to settings, configuration, root-provider resources, and EN/RU resource files; verify the gallery selector, disabled explanation, alert label, and unavailable-date tooltip use translated strings with English fallback.

## 4. Validation and workflow records

- [x] 4.1 Run `npm run tsc` and targeted ESLint for every changed file; verify both exit successfully.
- [x] 4.2 Ask the user to run `npm run build` locally and report the result, because sandbox builds may fail while fetching external fonts; record the result in the change notes or handoff. User reported a successful local production build on 2026-10-07.
- [x] 4.3 Manually verify a published trip in EN and RU: default chronology, manual-mode card/lightbox sequence, persistent undated alert, disabled selector state, and `photo` plus `photoOrder` URL replacement with no visible route reload. User verified the available gallery sorting in dev on 2026-10-07; no current photo lacks a reliable date, so the undated-card case remains data-unavailable rather than synthesized.
- [x] 4.4 Keep `openspec/backlog.md` and the feature task checklist current through implementation; verify the feature remains `In Progress` until completion.
