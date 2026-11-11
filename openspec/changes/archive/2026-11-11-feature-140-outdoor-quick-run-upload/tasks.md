# Tasks

## 1. Dictionary entries

- [x] 1.1 Add `quickWorkout.activities.running` to `app/i18n/locales/en/trips.json` with `addLabel: "Add a run"`, `noun: "run"`, `rememberGearLabel: "Remember this gear for runs"`, and the four dayparts `Morning`, `Daytime`, `Evening`, `Night`; verify the file parses as JSON.
  - Added on 2026-11-11; both locale files parse as JSON.
- [x] 1.2 Add `quickWorkout.activities.running` to `app/i18n/locales/ru/trips.json` with `addLabel: "Добавить пробежку"`, `noun: "пробежка"`, `rememberGearLabel: "Запоминать это снаряжение для пробежек"`, and the four dayparts `Утренняя`, `Дневная`, `Вечерняя`, `Ночная`; verify the file parses as JSON.
  - Added on 2026-11-11; both locale files parse as JSON.
- [x] 1.3 Confirm the `running` activity type exists and is active in the target environment; if it was deactivated, activate it through the existing admin activity-type page without changing the seed or migrations.
  - Checked on 2026-11-11: the `running` type exists and is active (`isActive: true`), so no activation was needed.

## 2. Quick-add buttons

- [x] 2.1 Add a `QUICK_ACTIVITY_VISUALS` map in `components/admin-pages/tracks-admin-panel.tsx` keyed by activity type `key`: walking renders `Footprints` with the primary variant, running renders `Zap` with the `outline` variant, and unknown keys fall back to `Plus` with `outline`; verify both buttons render their own icon and variant.
  - Added on 2026-11-11; the browser rendering is covered by the deferred checks in section 4.
- [x] 2.2 Render the walking quick-add button first and every other active type after it in alphabetical order by name; verify the order on `/my/workouts`.
  - Added on 2026-11-11: the quick-add list sorts walking first, then the remaining types by `nameEn`.
- [x] 2.3 Hide the route mode in `components/track-pages/quick-workout-upload-dialog.tsx` for every activity type but walking — the **Create with route** action and the source hint; verify the walking dialog still offers both and the running dialog offers neither.
  - Added on 2026-11-11: both the action and the source hint are rendered for walking only.

## 3. Validation

- [x] 3.1 Run `npm run tsc`, targeted ESLint on `components/admin-pages/tracks-admin-panel.tsx` and `components/track-pages/quick-workout-upload-dialog.tsx`, and `openspec validate "feature-140-outdoor-quick-run-upload" --strict`, and confirm all pass.
  - `npm run tsc` passed on 2026-11-11; the targeted ESLint run passed; `openspec validate --strict` reports the change as valid.
- [x] 3.2 Ask the owner to run `npm run build` locally and confirm it passes.
  - The owner ran the build on 2026-11-11 and it passed.

## 4. Browser check

The browser checks of this section are the owner's — the agent does not open a browser. They are filed as a candidate in the Manual QA Follow-ups table of `openspec/backlog.md` — see task 4.1 — and are not tasks of this change anymore:

Verified by the owner on 2026-11-11, in the browser on `/my/workouts`:

- A run was created through the quick-add button: the button opens the dialog, the GPX is uploaded, and saving publishes the workout.

Still to check:

- The walking quick-add button comes first and keeps its primary look with a footprints icon; the running button stands after it as an outline button with a lightning icon; both carry their localized labels in English and Russian.
- The running dialog offers no **Create with route** action and no source hint, and the walking dialog still offers both.
- The running dialog suggests `Morning run` / `Утренняя пробежка` for a morning file, and the title stays editable with the distance, duration, and start in the preview.
- The created run is a published workout with the running activity type, a `running-…` slug, and the parsed distance, duration, and recording timezone.
- The preferred running gear is preselected, and gear that does not fit running is not offered.

- [x] 4.1 File the deferred browser checks as a candidate in `openspec/backlog.md` rather than leave them open here.
  - Filed as `feature-140-quick-run-upload-manual-qa` in the Manual QA Follow-ups table of `openspec/backlog.md` on 2026-11-11; it carries the deferred browser checks listed above.

## Workflow follow-up

- Sync the `outdoor-quick-workout-upload` and `outdoor-quick-route-workout` deltas into the main specs and archive the change after review.
- Add the completed `feature-140-outdoor-quick-run-upload` entry to the feature history on archive.
