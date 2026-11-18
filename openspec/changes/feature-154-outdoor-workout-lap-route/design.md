# Design

## Context

`feature-152` shipped the composition model and the rebuild core; `feature-153` shipped the library builder and the create path. A lap variant is therefore already a normal composite route with one `MAIN` segment and a lap count above one. What is missing is the way to ask for it at the moment the workout is created, and any surface that reports the lap count back.

Route-based workout creation exists in three places:

- `TrackFormDialog`'s **From route** tab (`components/admin-pages/tracks-admin-panel.tsx`), which calls `createTrackFromRoute`;
- the quick walk/run route mode (`components/track-pages/quick-workout-upload-dialog.tsx`), which calls `createQuickRouteWorkout`;
- the draft completion picker (`components/track-pages/draft-workout-dialog.tsx`), which calls `attachRouteToTrack`.

## Inline Laps

Each of the three surfaces gets the same small control: a **Laps** numeric input, integer, minimum `1`, default `1`, sitting next to the route selector. `1` means "use this route as it is". A value above `1` means "run this loop that many times".

The field is disabled while the owner is creating a brand-new route from placed points, because there is no stored route to repeat yet. It is validated with the rest of the form: a non-integer or a value below one blocks the submit and the server refuses it again.

The dialog copy stays English, like the route library and the workout forms it joins.

## Shared Resolver

`lib/route-composition.server.ts` gains `resolveLapVariantRoute({ userId, routeId, lapCount })`:

1. A lap count of `1` (or less) returns the route id unchanged with `created: false`.
2. A non-integer or a value below one returns a validation refusal.
3. Look for an existing variant owned by the caller: a route with a composition whose segments are exactly one, the segment references the chosen child, its role is `MAIN`, and its lap count matches. The lookup is owner-scoped and skips `isPart` routes. A match is reused, so the same loop at three laps never produces a second identical route.
4. Otherwise create one through `createRouteCompositionForOwner` with a single `MAIN` segment and the requested lap count. The default title is `<child title> × <laps>`, cut to the shared 150-character route title limit with the suffix kept.
5. Any refusal from the create core — an open route (`OPEN_LAP`), a title, an unreadable child — is returned as a validation message.

The three actions call the resolver before they create the workout, so one server round trip produces both rows from the caller's point of view. The generated GPX upload still happens before the transaction, exactly as the library builder does it.

### Why resolve in the actions rather than in the dialogs

A client-side "create the variant, then create the workout" pair would leave a visible half-finished state and a second place that knows the reuse rule. Putting `lapCount` on the existing actions keeps the trust gate, the quota check, the route ownership check and the variant lookup in one server call per flow, and every surface inherits the same behaviour.

### Reuse and races

Two simultaneous saves can both miss the lookup and create two identical variants. That is harmless — both are valid composite routes and each workout points at one — and a unique constraint is not worth adding for this edge. The reuse rule is a convenience, not an invariant.

## Creation Actions

- `createTrackFromRoute` gains an optional `lapCount`; it resolves the variant after the route and activity-type checks and before the track row.
- `createQuickRouteWorkout` gains the same field, resolved after its own route and gear checks.
- `attachRouteToTrack` gains the same field for the draft-completion flow; a draft completed with three laps stores the variant's `routeId` exactly as it stores a plain route today.

Because a variant is an ordinary route, every downstream rule already holds: a variant used by a track cannot be deleted, editing it asks the shared-route confirmation, and the workout's map, distance, and download come from the generated line.

## Display

The lap count lives on the route's composition, so the read paths need a small projection, not a new column.

- `trackListSelect.route` adds `composition.segments.role` and `composition.segments.lapCount`.
- `PublicTrack` gains `routeSegmentCount` and `routeLapCount` (both `null` for a track without a composition).
- `routeLapCount` sums `lapCount` across the `MAIN` segments only, so a lead-in or a lead-out contributes no lap; a composition always has at least one `MAIN` segment. `routeSegmentCount` is the number of segments.
- A single-segment composition shows `3 laps`. A multi-segment composition shows `3 laps · 3 segments`, which stays honest when the route is a lead-in, the loop, and a lead-out — and the lead-in/lead-out authoring itself is the separate `outdoor-route-start-end-segments` slice, so this display is ready before that slice lands.
- The public `/tracks/[slug]` header and the `/tracks` list card show that badge as a secondary badge.
- The owner's workouts table (`tracks-workout-columns.tsx`) gets a sortable **Laps** column with the same text, and a dash when the route has no composition.
- Distance needs no change: the parent's generated line is what the existing distance readers already see, so three laps already read as three loops of distance, and a lead-in adds exactly its own distance.

## Risks

- **Duplicate variants on a race.** Accepted, documented above.
- **Title collisions.** Variant titles are not unique; the generator keeps the suffix and the library already tolerates repeated names.
- **Shared variant edits.** A three-lap variant used by several workouts is a shared route; the existing confirmation and linked-track count apply without new code.
- **A route that is not a loop.** The lap field itself cannot know the shape, so the server's `OPEN_LAP` refusal is the authority; the toast names the reason and the dialog keeps its values.
- **Payload growth.** Two small integers per public track; the geometry and recipe stay server-side.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx tsx scripts/check-route-composition.ts`, `npx openspec validate --changes --strict`, and a production build. Browser checks are deferred to a manual QA candidate on purpose: this slice is verified without creating any new routes or workouts. The QA row records the cases — laps `1`, a fresh three-lap variant, reuse of the same variant by a second workout, an open route refusal, a draft completed with laps, and the badge/column on each surface — so they can be run later against existing data.
