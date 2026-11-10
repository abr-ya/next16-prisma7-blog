# Tasks

## 1. Server action

- [x] 1.1 Add `createQuickRouteWorkout(input)` in `app/_data/tracks.ts`: trust gate, track quota, owned route, walking activity type, gear compatibility, wall-clock start plus timezone, duration seconds, unique slug, `PUBLISHED` + `TRAINING` + `MANUAL`, route primary, no own file; verify each refusal returns the documented code.
- [x] 1.2 Reuse `ensureUniqueTrackSlug` so a same-minute second walk gets a numeric suffix instead of a slug failure; verify two saves with the same start both succeed.

## 2. Quick dialog route mode

- [x] 2.1 Pass the owner's routes from `TrackManagementPanel` into `QuickWorkoutUploadDialog`; verify the GPX mode still renders unchanged when no routes exist.
- [x] 2.2 Add the `mode` state, the secondary **Create with route** action next to Save, the **Back to GPX upload** action, and the in-place content switch; verify no second modal opens.
- [x] 2.3 Disable the route action while a GPX is uploaded or uploading, with a short hint; verify the GPX Save still works in that state.
- [x] 2.4 Build the route form with a parsed-route select, start date-time, duration in minutes (decimal allowed), and walking gear with the preferred pair preselected; verify only `hasMetadata` routes are offered.
- [x] 2.5 Add the empty state when no parsed routes exist, with Save disabled and a pointer to `/my/routes`; verify the GPX mode remains usable.
- [x] 2.6 Generate the title and slug like the quick upload, submit the wall clock plus device timezone, and map the action's refusals to the existing error copy; verify a refused save keeps the form values.

## 3. Copy

- [x] 3.1 Add `quickWorkout.routeMode.*` labels in English and Russian for the action, route form, back action, empty state, success, and errors; verify both locale files parse and no raw keys render.

## 4. Validation

- [x] 4.1 Run `npm run tsc` and confirm it passes.
- [x] 4.2 Run targeted ESLint on the changed components and `app/_data/tracks.ts`, and confirm it passes.
- [x] 4.3 Run `openspec validate "feature-146-outdoor-quick-walk-from-route" --strict` and confirm it passes.
- [x] 4.4 Ask the owner to run `npm run build` locally and confirm it passes.
  - The owner ran the build on 2026-11-10 and it passed.

## 5. Browser check

The browser checks of this section are the owner's — the agent does not open a browser. They are filed as the candidate `feature-146-quick-route-workout-manual-qa` in the Manual QA Follow-ups table of `openspec/backlog.md` — see task 5.1 — and are not tasks of this change anymore:

Verified by the owner on 2026-11-10, in the browser on `/my/workouts`:

- The dialog switches its content in place to the route form and back, and no second modal opens.
- The **Create with route** action is disabled once a GPX is uploaded, and the source hint appears.

Still to check:

- Confirm that only routes with parsed metadata are offered, that the empty state points to `/my/routes`, and that the route mode's Save stays disabled without a route, a start, or a duration.
- Save a route walk with a start, a fractional duration (`90.5` minutes → `5430` seconds), and a pair of shoes; confirm the workout is published as a `TRAINING` track whose map and distance come from the route, and that its title and slug follow the quick upload's conventions.
- Save a second walk with the same start and confirm it succeeds with a `-2` slug suffix instead of a slug refusal.
- Refuse a save (a foreign route, a missing start or duration, gear that does not fit walking) and confirm the dialog stays open with the entered values.

- [x] 5.1 File the deferred browser checks as a candidate in `openspec/backlog.md` rather than leave them open here.
  - Filed as `feature-146-quick-route-workout-manual-qa` in the Manual QA Follow-ups table of `openspec/backlog.md` on 2026-11-10; it carries the deferred checks of sections 1, 2, and 4.

## Workflow follow-up

- Sync the `outdoor-quick-route-workout` delta into the main spec and archive the change after review.
- Move `feature-146-outdoor-quick-walk-from-route` to the feature history on archive.
