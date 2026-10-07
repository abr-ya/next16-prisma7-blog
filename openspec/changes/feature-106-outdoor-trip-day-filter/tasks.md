# Tasks

## 1. Visibility-safe day assignments

- [ ] 1.1 Extend the public linked-photo projection with an inclusive-trip UTC day key derived only from the reliable stored capture instant; apply the same assignment to public photo map markers and verify no EXIF/GPX reparse, timezone guess, schema change, or visibility expansion occurs.
- [ ] 1.2 Preserve existing stored `dayKeys` behavior for tracks and notes, and verify photos with missing, ambiguous, invalid, or out-of-range capture time have no selected-day assignment while remaining eligible for `All days`.

## 2. Shared public trip-media filter

- [ ] 2.1 Move the multi-day selector state to the public trip-media composition and make the map selector controlled; verify one selected day filters map layers, linked track cards, and gallery cards, while a single-day trip has no selector.
- [ ] 2.2 Move or extract public linked-track-card rendering into the shared client media boundary without changing card content, track links, recording-time display, or public visibility; verify selected-day cards use the existing chronological track order.
- [ ] 2.3 Filter the gallery before applying its capture/manual ordering so cards and lightbox previous/next use the same selected-day set; verify changing day closes an ineligible open viewer and removes only `photo` through native history replacement while preserving `photoOrder` and unrelated query parameters.

## 3. Validation and workflow records

- [ ] 3.1 Run `npm run tsc` and targeted ESLint for every changed TypeScript/TSX file; verify both exit successfully.
- [ ] 3.2 Ask the user to run `npm run build` locally and report the result, because sandbox builds may fail while fetching external fonts; record the result in the change handoff.
- [ ] 3.3 Manually verify a published multi-day trip: `All days`, each selected day across map/tracks/photos/lightbox, undated-photo all-days-only behavior, map empty state, and no day URL/history entries.
- [ ] 3.4 Keep `openspec/backlog.md` and this checklist current; verify the feature remains `In Progress` until implementation and manual validation complete.
