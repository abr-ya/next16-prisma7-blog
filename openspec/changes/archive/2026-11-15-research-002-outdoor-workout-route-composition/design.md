# Research Design

## Context

See `proposal.md`. The investigation is read-only and compares two models against the live route/track code, not a greenfield design.

## Method

1. Read the current schema and the route/track read paths:
   - `prisma/schema.prisma`: `Route`, `Track`, `TrackGeometry`, `FileAsset`, `Track_geometry_source_check`.
   - `lib/track-geometry.ts`, `app/_data/routes.ts`, `app/_data/tracks.ts`, `lib/track-gpx-file.ts`, `lib/track-synthetic-gpx.ts`.
2. Map every place that assumes one primary route: `resolveTrackGeometry`, route-based checks (`routeId`), public map/distance, owner/admin tables, week summary, route edit/delete/revalidation, quick route creation, and the `feature-142` secondary-file surfaces.
3. Evaluate **Composite Route** in two variants:
   - **A1 materialized**: a parent route stores ordered `RouteSegment` rows and a generated synthetic GPX + parsed metadata. Readers keep using one geometry.
   - **A2 dynamic**: a parent route stores the recipe and readers aggregate child geometries at read time.
4. Evaluate **TrackSegment**: a workout owns ordered segment rows; the route library keeps one-loop routes.
5. Score each model against the criteria below and write a recommendation with a migration sketch and follow-up slices.

## Evaluation Criteria

- **Blast radius on the track model**: how many `Track` columns, checks, and read paths change.
- **Lap semantics**: are laps a reusable route variant, a per-workout parameter, or both?
- **Geometry correctness**: distance, bounds, point count, and map continuity when segments are non-contiguous.
- **Rebuild propagation**: what happens to a composite/plan when a child route's geometry changes.
- **Storage and payload**: generated GPX size, metadata duplication, public map payload.
- **UX**: where the owner composes a lap/segment workout, how many routes exist, and how editing works.
- **Migration**: backfill from the current `Track.routeId` model and rollback safety.
- **Interaction** with `feature-142` secondary files, `feature-143` extra tracks, and `feature-150` multi-line maps.
- **Implementation size**: number of slices and risky states.

## Evidence Rules

- Cite concrete files, models, functions, and constraints; label proposed additions as proposals.
- Treat the current schema and actions as the source of truth.
- Do not assume a route carries elevation or timestamps: routes are built from placed points and `buildSyntheticGpxBytes` emits no `<time>` or elevation.
- A recommendation must name what it deliberately defers and what would invalidate it.

## Required Output Structure (`output.md`)

1. **Executive summary** — recommendation in 2–4 sentences.
2. **Current model** — the facts that constrain the choice, with file references.
3. **Option A — Composite Route** — A1 materialized and A2 dynamic, including a schema sketch and rebuild flow.
4. **Option B — TrackSegment** — schema sketch and read-path impact.
5. **Comparison matrix** — criteria vs options, with a short verdict per row.
6. **Recommended model** — the chosen option, rationale, and what it means for lap count and later start/main/end segments.
7. **Migration sketch** — forward-only steps from today's schema, including rollback considerations.
8. **Risks and open questions** — gaps, route-library clutter, rebuild staleness, and anything that needs owner input.
9. **Follow-up slices** — small, ordered implementation candidates with dependencies; no code in this change.

## Verdict Rubric

- **recommend**: satisfies the criteria with a smaller blast radius or a clearly bounded migration.
- **acceptable with caveats**: workable but with a named risk that a follow-up must own.
- **reject**: introduces a rewrite, data loss, or a model that cannot express the owner's stated direction.
