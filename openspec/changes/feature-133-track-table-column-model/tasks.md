# Tasks

## 1. Effective finish helper

- [ ] 1.1 Add `getEffectiveTrackFinish` to `lib/track-effective-values.ts`: parsed summary end first, then `start + duration` for MANUAL tracks, otherwise `undefined`.
- [ ] 1.2 Add `scripts/check-track-recording-finish.ts` covering parsed end, derived MANUAL finish, and a missing start.

## 2. Full table columns

- [ ] 2.1 Merge the Kind and Type columns into one Classification column with both badges, capped at `max-w-48`.
- [ ] 2.2 Replace the standalone Timezone column with a Recording column that shows the effective start, the finish, and the recording-timezone badge; render `—` for missing values.
- [ ] 2.3 Make Recording sortable with `accessorFn: getEffectiveTrackStart`, `sortingFn: "datetime"`, `sortUndefined: "last"`, and `meta.sortLabel: "Recording"`.
- [ ] 2.4 Keep the Recording cell at a fixed width so different rows cannot change the table width.

## 3. GPX summary cleanup

- [ ] 3.1 Remove the recording range, manual start, and manual duration from `TrackParseStatus`; keep parse state, timezone evidence, distance, point count, and timeline.

## 4. Validation

- [ ] 4.1 `npx tsx scripts/check-track-recording-finish.ts` — expect all assertions to pass.
- [ ] 4.2 `npm run tsc` — expect no type errors.
- [ ] 4.3 `npx eslint components/admin-pages/tracks-admin-columns.tsx components/admin-pages/tracks-admin-panel-parse-cell.tsx lib/track-effective-values.ts scripts/check-track-recording-finish.ts --quiet` — expect no errors.
- [ ] 4.4 `npm run lint` — expect no new errors.
- [ ] 4.5 `npx openspec validate feature-133-track-table-column-model --strict` — expect the change to validate.
- [ ] 4.6 `npm run build` — run locally by the owner.

## 5. Browser check (the owner's)

- [ ] 5.1 On `/my/tracks` and `/admin/tracks`, confirm the merged Classification column and the new Recording column with start, finish, and timezone badge; no standalone Timezone column remains.
- [ ] 5.2 Sort by Recording in both directions and confirm the order matches the visible starts with missing starts last.
- [ ] 5.3 Open a MANUAL track with start + duration and confirm the derived finish; open a track with no recording values and confirm an empty value.
- [ ] 5.4 Confirm the GPX summary no longer repeats the recording time, and `/my/workouts` still shows its short column set.
