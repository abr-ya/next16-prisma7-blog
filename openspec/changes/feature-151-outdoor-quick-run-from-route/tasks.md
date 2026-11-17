# Tasks

## 1. Shared route-capable types

- [ ] 1.1 Add `QUICK_ROUTE_WORKOUT_ACTIVITY_KEYS` and `supportsQuickRouteWorkout(activityTypeKey)` to `lib/quick-workout.ts`, with a short comment that names walking and running and says a new type ships its own wording entries.
- [ ] 1.2 Replace the walking-only refusal in `createQuickRouteWorkout` (`app/_data/tracks.ts`) with the shared predicate and refresh the `feature-146` comment so it no longer claims a walking-only first slice.

## 2. Dialog

- [ ] 2.1 In `components/track-pages/quick-workout-upload-dialog.tsx`, replace `isWalking` with `supportsRouteMode` derived from the shared predicate, and update the two `feature-140` comments that state walking-only.
- [ ] 2.2 Read the route-mode title and empty gear hint from `quickWorkout.activities.<key>.routeMode.*` when that entry exists, falling back to the generic `quickWorkout.routeMode.*` copy, mirroring the existing `rememberGearLabel` lookup.

## 3. Wording

- [ ] 3.1 Add `routeMode.title` and `routeMode.gearEmpty` to `quickWorkout.activities.walking` and `quickWorkout.activities.running` in `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`.
- [ ] 3.2 Keep the generic `quickWorkout.routeMode` block unchanged as the fallback and confirm no other route-mode string names a walk.

## 4. Verification

- [ ] 4.1 Run `npm run tsc`.
- [ ] 4.2 Run `npm run lint` and targeted `npx eslint components/track-pages/quick-workout-upload-dialog.tsx lib/quick-workout.ts --quiet`.
- [ ] 4.3 Run `npx openspec validate --strict`.
- [ ] 4.4 Ask the owner to run `npm run build` locally and report the result.
- [ ] 4.5 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md` (running route mode, generated title/slug, preferred running gear, refusal matrix) and record the shipped slice in `openspec/feature-history.md` at archive time.
