# Tasks

## 1. Durations

- [ ] 1.1 Update `formatTrackDuration` in `lib/track-gpx-metadata.ts` to include seconds when the remainder is non-zero, omitting zero units and keeping `0 min` for zero.
- [ ] 1.2 Confirm every caller (public header, `/tracks`, workouts table, trip card, quick-upload preview) renders through the helper with no local rounding.

## 2. Labels and badges

- [ ] 2.1 Add `getPublicTrackRecordingLabel` to `lib/track-effective-values.ts`: `Logged` for `MANUAL`, `Recorded` for `GPX`, `Time` for `null`.
- [ ] 2.2 Change the unknown sentence in `formatTrackRecordingLine` to `Time not recorded` and export the text.
- [ ] 2.3 On `/tracks/[slug]`, render the label only when the line is not the unknown sentence.
- [ ] 2.4 Make the kind badge follow `hasPrimaryRoute` on the detail header and the `/tracks` list card: `Route track` or `GPX track`.

## 3. Trip card

- [ ] 3.1 Change the English `trackRecordingStartLabel` / `trackRecordingDurationLabel` values to `Start` / `Duration` and the Russian ones to `Начало` / `Длительность`.
- [ ] 3.2 Confirm no other surface reads those two keys and the admin form's input labels stay untouched.

## 4. Verification

- [ ] 4.1 Add `scripts/check-track-duration-format.ts` with zero, `45`, `60`, `61`, `5310`, `3630`, `3600`, and `null`.
- [ ] 4.2 Run `npm run tsc`.
- [ ] 4.3 Run `npm run lint` and targeted `npx eslint` for the touched `lib`, `app`, and `components` files.
- [ ] 4.4 Run `npx tsx scripts/check-track-duration-format.ts` and `npx openspec validate --changes --strict`.
- [ ] 4.5 Run a production build in the sandbox, or ask the owner to run it locally when the sandbox network is restricted.
- [ ] 4.6 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`; verification creates no data.
