# Proposal

## Why

The route library only holds one shape per route, and a workout points at exactly one route. The owner's everyday case — a familiar loop run several times, sometimes with a short lead-in or lead-out — cannot be expressed without drawing an artificial separate route or recording the laps.

`research-002` chose a materialized composite route: a parent route that owns an ordered recipe of child routes, repeats a `MAIN` loop N times, and regenerates its own GPX. This slice builds the model and the rebuild machinery only; the library UI follows in `outdoor-route-builder`.

## What Changes

- Add `Route.isPart` (default `false`): an ingredient route that is not a standalone route the owner attaches to a workout. Existing routes keep `false`.
- Add a `RouteComposition` sidecar, 1:1 to the materialized parent route, with a `staleAt` marker for a failed propagation.
- Add ordered `RouteSegment` rows: child route, role (`START` / `MAIN` / `END`), sort order, and lap count. `MAIN` is the only role allowed to exceed one lap in this slice.
- Add the rebuild service: concatenate the children's full geometry in order, repeat `MAIN` N times, drop the duplicate closing point of a loop, build and parse one synthetic GPX, repoint the parent's file, retire the old file, and revalidate route and track paths.
- Add composition validation: same owner, plain routes only (no nested compositions), the parent is never its own child, `lapCount >= 1`, and consecutive segments must meet inside a small tolerance so the single polyline has no straight connector.
- Rebuild parent compositions after a child route's geometry changes; a failed rebuild leaves the child correct and marks the parent's composition stale instead of silently serving old geometry.
- Refuse deleting a route that a composition uses, and refuse attaching an `isPart` route to a workout.
- No UI, no track model change, no public read-path change.

## Non-goals

- The route-library builder UI, a parts filter, promotion/demotion of `isPart`, and the **Rebuild** button (all `outdoor-route-builder`).
- Inline lap variant creation in the workout form (`outdoor-workout-lap-route`).
- `START`/`END` authoring and continuity policy beyond the MAIN-only validation of this slice (`outdoor-route-start-end-segments`).
- Non-contiguous geometry, multiple polylines per route, per-segment colours, dynamic read-time composition.
- Recorded GPX files as segments; only routes may be segments.
- Changing `Track`, `resolveTrackGeometry`, downloads, maps, or public distance.

## Capabilities

### New Capabilities

- `outdoor-route-composition`: the stored recipe, its materialized geometry, validation and refusals, rebuild propagation and staleness, and the delete/attach guards that keep ingredients safe.

### Modified Capabilities

None.

## Impact

- `prisma/schema.prisma` and one additive migration: `Route.isPart`, the `RouteComposition` and `RouteSegment` models, the `RouteSegmentRole` enum. No existing row changes and no backfill.
- `app/_data/routes.ts` and a new `app/_data/route-compositions.ts`: the owner-gated replace/rebuild actions, child-update propagation, and the delete guard.
- `lib/route-composition.ts`: pure helpers for the segment plan, lap repetition, duplicate closing points, and continuity.
- `app/_data/tracks.ts`: route-based creation paths refuse an `isPart` route.
- No API, dependency, public-payload, or visual change.
