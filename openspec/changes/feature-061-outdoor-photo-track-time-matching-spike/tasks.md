## 1. Matching Spike Helpers

- [ ] 1.1 Inventory current photo capture-time and track `time.start`/`time.end` availability for hike-linked published photos without direct EXIF GPS.
- [ ] 1.2 Implement a pure helper that proposes inside-track-window candidates from existing stored metadata.
- [ ] 1.3 Extend the helper with between-adjacent-tracks candidates using a small configurable time-gap threshold and optional endpoint nearness check.
- [ ] 1.4 Ensure candidates never invent precise along-track lat/lng from start/end-only summaries.
- [ ] 1.5 Document timezone assumptions used by the spike in helper/UI copy comments.

## 2. Admin Spike UI

- [ ] 2.1 Add an admin-only button for eligible photos (capture time present, no direct EXIF GPS).
- [ ] 2.2 Open a modal listing candidate explanations; handle the empty-candidate case clearly.
- [ ] 2.3 On accept, log structured candidate details only (no DB write, no public map marker).
- [ ] 2.4 Keep the control hidden from guests and non-admin users.

## 3. Follow-Through And Validation

- [ ] 3.1 Note spike learnings that affect `outdoor-photo-track-time-inferred-coordinates` (timeline retention needs, thresholds, timezone).
- [x] 3.2 Run `openspec validate feature-061-outdoor-photo-track-time-matching-spike --strict`.
- [ ] 3.3 Run `npm run tsc`.
- [ ] 3.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 3.5 Ask the user to run `npm run build` locally if UI/routes changed.
- [ ] 3.6 Manually verify admin-only access and accept→log behavior with inside-window, between-tracks, and missing-time cases.
