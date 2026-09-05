## 1. GPX Time Provenance

- [ ] 1.1 Inspect current GPX time parsing and identify where raw timestamp strings are available before ISO normalization.
- [ ] 1.2 Extend track GPX metadata types/readers with backward-compatible timezone evidence for parsed time ranges.
- [ ] 1.3 Update GPX parsing to classify UTC/offset-present, missing, mixed, or unknown timezone evidence from raw `<time>` values.
- [ ] 1.4 Keep existing parsed tracks readable when timezone evidence is absent.

## 2. Track Time Display

- [ ] 2.1 Add formatting helpers for recording start, finish, duration, and timezone evidence labels.
- [ ] 2.2 Show recording start/finish and timezone evidence in `/admin/tracks` rows/edit summary.
- [ ] 2.3 Show recording start/finish and timezone evidence on public `/tracks` cards.
- [ ] 2.4 Show recording start/finish and timezone evidence on public `/tracks/[slug]` details.
- [ ] 2.5 Show recording start/finish and timezone evidence on linked-track cards under `/hikes/[slug]`.
- [ ] 2.6 Omit or gracefully label unavailable time values without breaking pages.

## 3. Follow-Through And Validation

- [ ] 3.1 Update backlog notes to mark `feature-063-outdoor-track-recording-time-summary` as the promoted recording-time visibility slice.
- [ ] 3.2 Run `openspec validate feature-063-outdoor-track-recording-time-summary --strict`.
- [ ] 3.3 Run `npm run tsc`.
- [ ] 3.4 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 3.5 Ask the user to run `npm run build` locally.
- [ ] 3.6 Manually verify parsed tracks with `Z`, explicit offset, timezone-free timestamps, old metadata with no evidence field, and no timestamps.
