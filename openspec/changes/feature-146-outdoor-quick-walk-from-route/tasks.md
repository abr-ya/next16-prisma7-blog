# Tasks

## 1. Server action

- [ ] 1.1 Add `createQuickRouteWorkout(input)` in `app/_data/tracks.ts`: trust gate, track quota, owned route, walking activity type, gear compatibility, wall-clock start plus timezone, duration seconds, unique slug, `PUBLISHED` + `TRAINING` + `MANUAL`, route primary, no own file; verify each refusal returns the documented code.
- [ ] 1.2 Reuse `ensureUniqueTrackSlug` so a same-minute second walk gets a numeric suffix instead of a slug failure; verify two saves with the same start both succeed.

## 2. Quick dialog route mode

- [ ] 2.1 Pass the owner's routes from `TrackManagementPanel` into `QuickWorkoutUploadDialog`; verify the GPX mode still renders unchanged when no routes exist.
- [ ] 2.2 Add the `mode` state, the secondary **Create with route** action next to Save, the **Back to GPX upload** action, and the in-place content switch; verify no second modal opens.
- [ ] 2.3 Disable the route action while a GPX is uploaded or uploading, with a short hint; verify the GPX Save still works in that state.
- [ ] 2.4 Build the route form with a parsed-route select, start date-time, duration in minutes (decimal allowed), and walking gear with the preferred pair preselected; verify only `hasMetadata` routes are offered.
- [ ] 2.5 Add the empty state when no parsed routes exist, with Save disabled and a pointer to `/my/routes`; verify the GPX mode remains usable.
- [ ] 2.6 Generate the title and slug like the quick upload, submit the wall clock plus device timezone, and map the action's refusals to the existing error copy; verify a refused save keeps the form values.

## 3. Copy

- [ ] 3.1 Add `quickWorkout.routeMode.*` labels in English and Russian for the action, route form, back action, empty state, success, and errors; verify both locale files parse and no raw keys render.

## 4. Validation

- [ ] 4.1 Run `npm run tsc` and confirm it passes.
- [ ] 4.2 Run targeted ESLint on the changed components and `app/_data/tracks.ts`, and confirm it passes.
- [ ] 4.3 Run `openspec validate "feature-146-outdoor-quick-walk-from-route" --strict` and confirm it passes.
- [ ] 4.4 Browser-check: open the quick walk dialog, confirm the route action is disabled after a GPX upload, switch to the route form and back, save a parsed route with start/duration/gear, and confirm the published workout uses the route geometry.
- [ ] 4.5 Ask the owner to run `npm run build` locally and confirm it passes.

## Workflow follow-up

- Sync the `outdoor-quick-route-workout` delta into the main spec and archive the change after review.
- Move `feature-146-outdoor-quick-walk-from-route` to the feature history on archive.
