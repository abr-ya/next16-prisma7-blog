# Tasks

## 1. Dictionary entries

- [ ] 1.1 Add `quickWorkout.activities.running` to `app/i18n/locales/en/trips.json` with `addLabel: "Add a run"`, `noun: "run"`, `rememberGearLabel: "Remember this gear for runs"`, and the four dayparts `Morning`, `Daytime`, `Evening`, `Night`; verify the file parses as JSON.
- [ ] 1.2 Add `quickWorkout.activities.running` to `app/i18n/locales/ru/trips.json` with `addLabel: "Добавить пробежку"`, `noun: "пробежка"`, `rememberGearLabel: "Запоминать это снаряжение для пробежек"`, and the four dayparts `Утренняя`, `Дневная`, `Вечерняя`, `Ночная`; verify the file parses as JSON.
- [ ] 1.3 Confirm the `running` activity type exists and is active in the target environment; if it was deactivated, activate it through the existing admin activity-type page without changing the seed or migrations.
- [ ] 1.4 Add a `QUICK_ACTIVITY_VISUALS` map in `components/admin-pages/tracks-admin-panel.tsx` keyed by activity type `key`: walking renders `Footprints` with the `outline` variant, running renders `Activity` with the primary variant, and unknown keys fall back to `Plus` with `outline`; verify both buttons render their own icon and variant.

## 2. Verification

- [ ] 2.1 Open `/my/workouts` in both interface languages and verify the running button appears next to the walking button with the localized label, a different icon, and a different button variant; verify the walking dialog itself is unchanged.
- [ ] 2.2 Open the running dialog, upload a GPX with a morning recording start, and verify the suggested title is `Morning run` / `Утренняя пробежка`; verify the title remains editable and the preview shows distance, duration, and start.
- [ ] 2.3 Save a running upload and verify the created track is a published workout with the running activity type, a slug beginning with `running-`, and the parsed distance, duration, and recording timezone.
- [ ] 2.4 With running-tagged gear and a saved running gear preference, reopen the dialog and verify the preferred gear is preselected; verify gear that does not fit running is not offered.
- [ ] 2.5 Run `npm run tsc`, targeted ESLint on `components/admin-pages/tracks-admin-panel.tsx`, and `openspec validate "feature-140-outdoor-quick-run-upload" --strict`, and confirm all pass.
- [ ] 2.6 Ask the owner to run `npm run build` locally and confirm it passes.

## Workflow follow-up

- Sync the `outdoor-quick-workout-upload` delta into the main spec and archive the change after review.
- Add the completed `feature-140-outdoor-quick-run-upload` entry to the feature history on archive.
