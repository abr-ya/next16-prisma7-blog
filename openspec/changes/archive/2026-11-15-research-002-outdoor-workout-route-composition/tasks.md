# Tasks

## 1. Current model evidence

- [x] 1.1 Record the `Route`, `Track`, `TrackGeometry`, and `FileAsset` shapes and the `Track_geometry_source_check` rule from `prisma/schema.prisma`; verify the write-up names each constraint and its owner.
- [x] 1.2 Map every read path that assumes one primary route: `resolveTrackGeometry`, public map/distance, owner/admin tables, week summary, route preview, and the feature-142 secondary files; verify each path is listed with its file and the assumption it makes.
- [x] 1.3 Document route creation/edit/delete: `createRouteFromPoints`, `updateRoute`, `deleteRoute`, synthetic GPX generation, metadata rebuild, retirement of the replaced asset, and revalidation; verify the write-up states what a composite rebuild would reuse.

## 2. Composite Route evaluation

- [x] 2.1 Sketch the A1 materialized model (`RouteSegment` rows, generated GPX, parsed metadata, rebuild/revalidation) and verify it answers how distance, bounds, and point count are produced.
- [x] 2.2 Sketch the A2 dynamic model (recipe + read-time aggregation) and verify it answers how `resolveTrackGeometry` and the public map change.
- [x] 2.3 Evaluate lap semantics, route-library variants, child-route edits, non-contiguous segment gaps, and GPX size; verify each criterion has a verdict and a named risk.

## 3. TrackSegment evaluation

- [x] 3.1 Sketch the `TrackSegment` model and the replacement of `Track.routeId`, including the geometry-source check and the MAIN-segment backfill; verify the migration path is stated.
- [x] 3.2 List every `routeId`-based assumption that would change (`resolveTrackGeometry`, feature-142 attach, feature-147 rename/cleanup, feature-150 maps, route deletion counts); verify the list covers the known callers.
- [x] 3.3 Evaluate laps as a per-workout parameter and the effect on quick route creation and the route library; verify the UX trade-off is compared with A1.

## 4. Comparison and recommendation

- [x] 4.1 Fill the comparison matrix from the design criteria and verify every criterion has a verdict for A1, A2, and B.
- [x] 4.2 Recommend one model, state what it defers, and name the conditions that would invalidate the choice; verify the recommendation follows the rubric.
- [x] 4.3 Write the forward-only migration sketch and ordered follow-up slices; verify every slice names its dependency and whether it supersedes `outdoor-route-workout-laps`.

## 5. Output and validation

- [x] 5.1 Write `output.md` with every section required by `design.md`; verify the file is self-contained and cites the evidence from groups 1–3.
- [x] 5.2 Run `npx openspec validate research-002-outdoor-workout-route-composition --strict`; verify it passes.
- [x] 5.3 Update the `outdoor-workout-route-composition-research` row in `openspec/research-backlog.md` with the result and the follow-up slice; verify the row points at the output.
