# Tasks

## 1. Effective finish helper

- [x] 1.1 Add `getEffectiveTrackFinish` to `lib/track-effective-values.ts`: parsed summary end first, then `start + duration` for MANUAL tracks, otherwise `undefined`.
- [x] 1.2 Add `scripts/check-track-recording-finish.ts` covering parsed end, derived MANUAL finish, and a missing start.

## 2. Full table columns

- [x] 2.1 Merge the Kind and Type columns into one Classification column with both badges, capped at `max-w-48`.
- [x] 2.2 Replace the standalone Timezone column with a Recording column that shows the effective start, the finish, and the recording-timezone badge; render `—` for missing values.
- [x] 2.3 Make Recording sortable with `accessorFn: getEffectiveTrackStart`, `sortingFn: "datetime"`, `sortUndefined: "last"`, and `meta.sortLabel: "Recording"`.
- [x] 2.4 Keep the Recording cell at a fixed width so different rows cannot change the table width.
- [x] 2.5 Remove the standalone GPX file column; move the draft/published status badge into the title cell.
- [x] 2.6 Add a download action to the actions column using the resolved GPX file (own or route), with the file size beneath the button and a disabled state when no file exists.

## 3. GPX summary cleanup

- [x] 3.1 Remove the recording range, manual start, and manual duration from `TrackParseStatus`; keep parse state, timezone evidence, distance, point count, and timeline.

## 4. Validation

- [x] 4.1 `npx tsx scripts/check-track-recording-finish.ts` — expect all assertions to pass.
- [x] 4.2 `npm run tsc` — expect no type errors.
- [x] 4.3 `npx eslint components/admin-pages/tracks-admin-columns.tsx components/admin-pages/tracks-admin-panel-parse-cell.tsx lib/track-effective-values.ts scripts/check-track-recording-finish.ts --quiet` — expect no errors.
- [x] 4.4 `npm run lint` — expect no new errors.
- [x] 4.5 `npx openspec validate feature-133-track-table-column-model --strict` — expect the change to validate.
- [x] 4.6 `npm run build` — run locally by the owner.

## 5. Browser check (the owner's)

- [x] 5.1 On `/my/tracks` and `/admin/tracks`, confirm the merged Classification column and the new Recording column with start, finish, and timezone badge; no standalone Timezone column remains.
- [x] 5.2 Sort by Recording in both directions and confirm the order matches the visible starts with missing starts last.
- [x] 5.4 Confirm the GPX summary no longer repeats the recording time, and `/my/workouts` still shows its short column set.
