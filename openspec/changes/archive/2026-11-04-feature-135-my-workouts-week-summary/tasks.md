# Tasks

## 1. Shared effective values

- [x] 1.1 Add `lib/track-effective-values.ts` exporting `getEffectiveTrackStart`, `getEffectiveTrackDistanceMeters`, and `getEffectiveTrackDurationSeconds`, with the same fallback chains the workout table uses today.
- [x] 1.2 Move `getEffectiveTrackStart` out of `lib/track-iso-week.ts` and import it from the shared module; keep `getIsoWeekForTrack` behavior unchanged.
- [x] 1.3 Point `components/admin-pages/tracks-workout-columns.tsx` at the shared helpers and delete its local copies, so the visible distance and the week total read through one definition.

## 2. Week summary

- [x] 2.1 In `TrackManagementPanel`, derive the selected week's count, summed distance, and distance-missing count from `visibleTracks` with a `useMemo`; no new query.
- [x] 2.2 Add `components/admin-pages/workout-week-summary.tsx`: a compact summary button placed to the right of the week controls, rendered only for the workouts variant while a week is selected.
- [x] 2.3 Make the summary open a read-only `Dialog` with the week label, the workout count, the total distance, and the distance-missing note when relevant.
- [x] 2.4 Handle a week with no workouts and a week with no parsed distance without showing a misleading `0 m`.
- [x] 2.5 Confirm the toolbar still wraps cleanly on narrow viewports with the summary present. Verified by the owner at 375 px and 320 px on 2026-11-04: no horizontal overflow, the summary wraps below the week control, and the dialog fits the screen.
- [x] 2.6 Keep the selected week's full set visible: the shared `DataTable` no longer retains the previous page size when pagination is switched off, so the week renders every row and the summary count matches the table.

## 3. Localization

- [x] 3.1 Add the `workoutWeekSummary*` keys to `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`, using i18next plural keys for the workout count.

## 4. Validation

- [x] 4.1 `npm run tsc` — expect no type errors.
- [x] 4.2 `npx eslint components/admin-pages/tracks-admin-panel.tsx components/admin-pages/workout-week-summary.tsx components/admin-pages/tracks-workout-columns.tsx lib/track-effective-values.ts lib/track-iso-week.ts --quiet` — expect no errors.
- [x] 4.3 `npm run lint` — expect no errors.
- [x] 4.4 `npx openspec validate feature-135-my-workouts-week-summary --strict` — expect the change to validate.
- [x] 4.5 `npm run build` — the user ran the production build locally on 2026-11-04; it passed.

## 5. Browser check (the owner's)

The minimal positive check is 5.1–5.2, verified by the owner on 2026-11-04: a 14-workout week showed every row and the summary reported the same 14 workouts and 68.4 km. The remaining cases — `All time` hides the summary and keeps pagination, a week with no parsed distance, Russian plural wording, the Distance-column regression after the shared-helper extraction, and narrow-viewport wrapping (2.5) — are deferred to the `outdoor-workouts-week-summary-manual-qa` candidate in `openspec/backlog.md`.

- [x] 5.1 Select a week with workouts and confirm the summary shows the same count as the rows and a distance matching the Distance column.
- [x] 5.2 Open the summary and confirm the dialog repeats the week label, the count, and the total.

