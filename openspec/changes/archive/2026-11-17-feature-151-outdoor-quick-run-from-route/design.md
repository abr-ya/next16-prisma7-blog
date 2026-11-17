# Design

## Context

`feature-146` added a route mode to the quick workout dialog and `feature-140` made the running quick-add button generic. Both shipped, and the two halves have not met yet:

- `components/track-pages/quick-workout-upload-dialog.tsx` computes `isWalking = activityType.key === "walking"` and shows the **Create with route** action and the source hint only for that type.
- `app/_data/tracks.ts` refuses the route save with `VALIDATION` for any activity type other than `walking`, with a comment that names the first slice.
- The route-mode copy (`quickWorkout.routeMode.title`, `.gearEmpty`) names a walk: `Walk an existing route`, `No shoes for walking`, `Прогулка по готовому маршруту`, `Нет обуви для прогулок`.

Everything else is already type-agnostic: the dialog passes `activityType` through, `createQuickRouteWorkout` stores `normalizedActivityTypeId`, and the title, slug, daypart, preferred gear and gear fit all read the passed type.

## Decisions

### One shared route-capable list

A new `QUICK_ROUTE_WORKOUT_ACTIVITY_KEYS = ["walking", "running"]` and `supportsQuickRouteWorkout(activityTypeKey)` live in `lib/quick-workout.ts`, next to the other wording-independent quick-upload helpers.

The client cannot import a value from `app/_data/tracks.ts` — that module is `"use server"` — so a shared `lib` module is the only place where both sides can read the same list. Keeping one predicate means the button and the server refusal cannot drift; adding cycling later is a one-line list change plus its wording entries.

### The server stays the authority

`createQuickRouteWorkout` keeps refusing a route save for an activity type outside the list, with the existing `VALIDATION` code and message. The server also keeps the type the dialog sent, so the saved run is a `running` workout — no server-side default to walking.

Everything else in the action is unchanged: the trust gate, the quota, the owned parsed route, the gear fit, the wall-clock start in the device's zone, whole seconds of duration, a unique slug, `PUBLISHED`/`TRAINING`/`MANUAL`, no file of its own, and the revalidation of `/my/workouts`.

### Wording follows the existing per-activity pattern

`quickWorkout.activities.<key>.rememberGearLabel` already uses `i18n.exists` with a generic fallback, and the daypart adjectives are per activity because Russian agreement cannot be derived. Route mode follows the same pattern:

- `quickWorkout.activities.walking.routeMode.title` / `.gearEmpty`
- `quickWorkout.activities.running.routeMode.title` / `.gearEmpty`

The generic `quickWorkout.routeMode.*` block stays as the fallback for a route-capable type that has no entries yet, so a future type gets an English-neutral fallback and a visible gap rather than a silent wrong noun.

The title is generated from the daypart and the dialog's own noun, so a morning route run reads `Morning run` / `Утренняя пробежка`, and `buildQuickWorkoutSlugBase` already produces `running-YYYY-MM-DD-HHmm` from the activity type key.

## Risks

- **Copy drift between walking and running.** Mitigated by keeping one shared route-mode block and only overriding the two strings that name the activity type. A scenario in the spec pairs English and Russian.
- **A future route-capable type without wording.** It would fall back to `Walk an existing route`. The predicate makes such a type an explicit choice in the list, and the design note above says the wording entries ship with it.
- **Route mode offered for a type whose gear cannot fit.** Unchanged from walking: fitting gear is filtered by `gearFitsActivityType`, and an unfit selection is refused by the server.

## Impact

No schema, migration, API, or public-payload change. The public workout page already renders a route-primary track for any activity type, and the workouts table already shows the activity type, start, duration, and recording timezone.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint for the touched component and lib files, `openspec validate --strict`, and the owner's local `npm run build`. Browser checks (running route mode, generated title and slug, preferred running gear, refusal matrix) are filed as a manual QA candidate because the repo has no automated UI coverage.
