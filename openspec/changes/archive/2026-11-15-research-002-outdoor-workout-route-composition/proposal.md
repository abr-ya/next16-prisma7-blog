# Research Proposal

## Why

Route-based workouts can currently reference exactly one route, and a route is exactly one synthetic GPX shape. The owner wants two related capabilities: a lap count for a loop route, and later a workout assembled from start, main-loop, and end segments. Two plausible models exist — a composite `Route` that owns ordered segments (the track still points at one route) and a `TrackSegment` plan on the workout (the route library stays one loop). Choosing the wrong one either changes the track geometry model twice or strands laps in the route library as duplicated variants. This investigation picks the model before implementation.

## Research Question

Which model is simpler and safer to evolve for lap counts and later multi-segment loop workouts:

1. **Composite Route** — a route owns ordered segment rows (`RouteSegment`: child route, role, order, lap count), and a track still references one route. The composite geometry is either materialized into one synthetic GPX or composed dynamically at read time.
2. **TrackSegment** — a workout owns ordered route segments, the route library keeps one-loop routes, and the track's geometry model changes from `routeId` to a segment plan.

## Scope

- Data model shape and migration path from the current `Track.routeId` / `Route.fileAssetId` model.
- Materialized synthetic GPX versus dynamic composition.
- Distance, duration, lap-count, and per-segment display semantics across the public page, owner/admin tables, week summary, and future pace.
- Behaviour with non-contiguous segments (start and end routes that do not share exact endpoints) and map rendering.
- Editing and rebuild propagation when a child route changes.
- Route-library UX and duplication of lap variants.
- Impact on `feature-142` secondary files, `feature-143` extra tracks, and `feature-150` multi-line maps.

## Non-Goals

- No schema, action, component, or spec changes in this investigation.
- No decision on colours, labels, or the final form layout beyond what the model forces.
- No implementation of laps or segments; the follow-up lands in `feature-XXX`.
- No re-parse of stored GPX files and no data migration.

## Capabilities

None — this is investigation-only output. `skip_specs: true` is set in the change.

## Impact

- `openspec/research-backlog.md` and this change's `output.md` only.
- The recommendation will name the follow-up feature slice and whether it supersedes `outdoor-route-workout-laps` or rewrites it.
