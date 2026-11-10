# Tasks

## 1. Dictionary entries

- [ ] 1.1 Add `quickWorkout.activities.running` to `app/i18n/locales/en/trips.json` with `addLabel: "Add a run"`, `noun: "run"`, `rememberGearLabel: "Remember this gear for runs"`, and the four dayparts `Morning`, `Daytime`, `Evening`, `Night`; verify the file parses as JSON.
- [ ] 1.2 Add `quickWorkout.activities.running` to `app/i18n/locales/ru/trips.json` with `addLabel: "Добавить пробежку"`, `noun: "пробежка"`, `rememberGearLabel: "Запоминать это снаряжение для пробежек"`, and the four dayparts `Утренняя`, `Дневная`, `Вечерняя`, `Ночная`; verify the file parses as JSON.
- [ ] 1.3 Confirm the `running` activity type exists and is active in the target environment; if it was deactivated, activate it through the existing admin activity-type page without changing the seed or migrations.

## 2. Quick-add buttons

- [ ] 2.1 Add a `QUICK_ACTIVITY_VISUALS` map in `components/admin-pages/tracks-admin-panel.tsx` keyed by activity type `key`: walking renders `Footprints` with the primary variant, running renders `Zap` with the `outline` variant, and unknown keys fall back to `Plus` with `outline`; verify both buttons render their own icon and variant.
- [ ] 2.2 Render the walking quick-add button first and every other active type after it in alphabetical order by name; verify the order on `/my/workouts`.
- [ ] 2.3 Hide the route mode in `components/track-pages/quick-workout-upload-dialog.tsx` for every activity type but walking — the **Create with route** action and the source hint; verify the walking dialog still offers both and the running dialog offers neither.

## 3. Verification

- [ ] 3.1 Open `/my/workouts` in both interface languages and verify the running button appears next to the walking button with the localized label, a different icon, and a different button variant; verify the walking dialog itself is unchanged.
- [ ] 3.2 Open the running dialog, upload a GPX with a morning recording start, and verify the suggested title is `Morning run` / `Утренняя пробежка`; verify the title remains editable and the preview shows distance, duration, and start.
- [ ] 3.3 Save a running upload and verify the created track is a published workout with the running activity type, a slug beginning with `running-`, and the parsed distance, duration, and recording timezone.
- [ ] 3.4 With running-tagged gear and a saved running gear preference, reopen the dialog and verify the preferred gear is preselected; verify gear that does not fit running is not offered.
- [ ] 3.5 Run `npm run tsc`, targeted ESLint on `components/admin-pages/tracks-admin-panel.tsx` and `components/track-pages/quick-workout-upload-dialog.tsx`, and `openspec validate "feature-140-outdoor-quick-run-upload" --strict`, and confirm all pass.
- [ ] 3.6 Ask the owner to run `npm run build` locally and confirm it passes.

## 4. Browser check

The browser checks of this section are the owner's — the agent does not open a browser. They are filed as a candidate in the Manual QA Follow-ups table of `openspec/backlog.md` — see task 4.1 — and are not tasks of this change anymore:

- The walking quick-add button comes first and keeps its primary look; the running button stands after it with its own icon and the outline style; both carry their localized labels.
- The running dialog offers no **Create with route** action and no source hint, and the walking dialog still offers both.
- The running dialog suggests `Morning run` / `Утренняя пробежка` for a morning file, and the title stays editable.
- A saved run is a published workout with the running activity type, a `running-…` slug, and the parsed distance, duration, and recording timezone.
- The preferred running gear is preselected, and gear that does not fit running is not offered.

- [ ] 4.1 File the deferred browser checks as a candidate in `openspec/backlog.md` rather than leave them open here.

## Workflow follow-up

- Sync the `outdoor-quick-workout-upload` and `outdoor-quick-route-workout` deltas into the main specs and archive the change after review.
- Add the completed `feature-140-outdoor-quick-run-upload` entry to the feature history on archive.
