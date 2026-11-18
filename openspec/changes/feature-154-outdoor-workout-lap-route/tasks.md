# Tasks

## 1. Shared lap-variant resolver

- [ ] 1.1 Add `resolveLapVariantRoute({ userId, routeId, lapCount })` to `lib/route-composition.server.ts`: `1` returns the route unchanged, a non-integer or a value below one is a validation refusal, owner-scoped reuse lookup for an identical single-segment variant, otherwise create through `createRouteCompositionForOwner` with a default `<route title> × <laps>` title cut to the shared route title limit.
- [ ] 1.2 Keep `isPart` routes out of the reuse lookup and propagate the create core's refusals (open loop, title, unreadable child) as validation messages.

## 2. Creation actions

- [ ] 2.1 Add optional `lapCount` to `createTrackFromRoute` and resolve the variant after the route and activity-type checks, before the track row.
- [ ] 2.2 Add optional `lapCount` to `createQuickRouteWorkout` and resolve it after the route and gear checks.
- [ ] 2.3 Add optional `lapCount` to `attachRouteToTrack` for the draft-completion flow.
- [ ] 2.4 Confirm the resolver runs inside the existing trust and quota gates, so a refused variant save creates no workout.

## 3. Inline control

- [ ] 3.1 Add the **Laps** input to the **From route** tab in `components/admin-pages/tracks-admin-panel.tsx`: integer, minimum one, default one, disabled while creating a new route from placed points, included in the submit-ready check, and sent to `createTrackFromRoute`.
- [ ] 3.2 Add the **Laps** input to the quick route mode in `components/track-pages/quick-workout-upload-dialog.tsx` and send it to `createQuickRouteWorkout`.
- [ ] 3.3 Add the **Laps** input to the draft completion picker in `components/track-pages/draft-workout-dialog.tsx` and send it to `attachRouteToTrack`.
- [ ] 3.4 Keep the new copy English, consistent with the surrounding route and workout forms.

## 4. Display

- [ ] 4.1 Project `composition.segments.role` and `.lapCount` through `trackListSelect.route`, and add `routeSegmentCount` and `routeLapCount` to `PublicTrack` (`null` without a composition); sum `routeLapCount` over the `MAIN` segments only.
- [ ] 4.2 Show the badge in the `/tracks/[slug]` header and on the `/tracks` list card: `N laps` for one segment, `N laps · M segments` when there are several.
- [ ] 4.3 Add the sortable **Laps** column to `components/admin-pages/tracks-workout-columns.tsx` with the same text and a dash for a row without a composition.
- [ ] 4.4 Confirm every distance reader still reports the generated line's distance with no change, including a route with a lead-in and a lead-out.

## 5. Verification

- [ ] 5.1 Run `npm run tsc`.
- [ ] 5.2 Run `npm run lint` and targeted `npx eslint` for the touched `app/_data`, `lib`, and `components` files.
- [ ] 5.3 Run `npx tsx scripts/check-route-composition.ts` and `npx openspec validate --changes --strict`.
- [ ] 5.4 Ask the owner to run `npm run build` locally and report the result, or run it in the sandbox when the network allows.
- [ ] 5.5 File the deferred browser checks as a single manual QA candidate in `openspec/backlog.md` immediately, with the explicit rule that verification creates no new routes or workouts; do not run those checks in this slice.
- [ ] 5.6 Record the shipped slice in `openspec/feature-history.md` at archive time.
