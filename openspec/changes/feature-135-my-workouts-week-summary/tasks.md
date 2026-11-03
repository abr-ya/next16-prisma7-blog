# Tasks

## 1. Shared effective values

- [ ] 1.1 Add `lib/track-effective-values.ts` exporting `getEffectiveTrackStart`, `getEffectiveTrackDistanceMeters`, and `getEffectiveTrackDurationSeconds`, with the same fallback chains the workout table uses today.
- [ ] 1.2 Move `getEffectiveTrackStart` out of `lib/track-iso-week.ts` and import it from the shared module; keep `getIsoWeekForTrack` behavior unchanged.
- [ ] 1.3 Point `components/admin-pages/tracks-workout-columns.tsx` at the shared helpers and delete its local copies, so the visible distance and the week total read through one definition.

## 2. Week summary

- [ ] 2.1 In `TrackManagementPanel`, derive the selected week's count, summed distance, and distance-missing count from `visibleTracks` with a `useMemo`; no new query.
- [ ] 2.2 Add `components/admin-pages/workout-week-summary.tsx`: a compact summary button placed to the right of the week controls, rendered only for the workouts variant while a week is selected.
- [ ] 2.3 Make the summary open a read-only `Dialog` with the week label, the workout count, the total distance, and the distance-missing note when relevant.
- [ ] 2.4 Handle a week with no workouts and a week with no parsed distance without showing a misleading `0 m`.
- [ ] 2.5 Confirm the toolbar still wraps cleanly on narrow viewports with the summary present.

## 3. Localization

- [ ] 3.1 Add the `workoutWeekSummary*` keys to `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`, using i18next plural keys for the workout count.

## 4. Validation

- [ ] 4.1 `npm run tsc` — expect no type errors.
- [ ] 4.2 `npx eslint components/admin-pages/tracks-admin-panel.tsx components/admin-pages/workout-week-summary.tsx components/admin-pages/tracks-workout-columns.tsx lib/track-effective-values.ts lib/track-iso-week.ts --quiet` — expect no errors.
- [ ] 4.3 `npm run lint` — expect no errors.
- [ ] 4.4 `npx openspec validate feature-135-my-workouts-week-summary --strict` — expect the change to validate.
- [ ] 4.5 `npm run build` — the user runs the build locally; the agent records the result here.

## 5. Browser check (the owner's)

- [ ] 5.1 Select a week with workouts and confirm the summary shows the same count as the rows and a distance matching the Distance column.
- [ ] 5.2 Open the summary and confirm the dialog repeats the week label, the count, and the total.
- [ ] 5.3 Return to `All time` and confirm the summary disappears and pagination is unchanged.
- [ ] 5.4 Select a week whose workouts have no parsed distance and confirm the summary says no distance is recorded.
- [ ] 5.5 Switch the interface to Russian and confirm the count wording and the labels read naturally.
- [ ] 5.6 After the shared-helper extraction, confirm the Distance column still renders and sorts exactly as before.
