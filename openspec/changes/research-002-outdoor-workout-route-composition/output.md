# Route Composition Research

## Executive Summary

Recommend **Option A1: a materialized composite `Route`**. A route owns ordered `RouteSegment` rows (child route, role, order, lap count) and regenerates its own synthetic GPX and parsed metadata. A workout keeps pointing at exactly one route, so `Track`, `resolveTrackGeometry`, the public map/distance, `feature-142` secondary files, `feature-143` extra tracks, and `feature-150` multi-line maps stay untouched. Laps become a reusable route variant (for example “Park loop × 3”), and the workout form can create that variant inline so the owner still enters the lap count at creation time. The one structural caveat is non-contiguous start/end segments: a materialized single polyline draws a straight connector between them, so v1 should validate continuity and defer true gaps to a later dynamic/multi-line slice.

## Current Model

- `Route` is one shape: `fileAssetId @unique` plus `metadata`, owned by a user, with a `tracks` relation (`prisma/schema.prisma`). A route has no ordered parts and no lap concept.
- `Track` holds one primary source: `fileAssetId` or `routeId`, enforced by `Track_geometry_source_check`; `Track_publish_requires_geometry_check` requires `READY` before `PUBLISHED` (`prisma/migrations/20261108120000_feature_141_outdoor_workout_drafts/migration.sql`).
- `resolveTrackGeometry` returns the track's own file/metadata first, then the linked route's (`lib/track-geometry.ts`). Maps, downloads, trip views, and tables read through it.
- Routes are synthetic point shapes: `createRouteFromPoints` builds `buildSyntheticGpxBytes(title, points)`, uploads it, parses metadata, and stores `fileAssetId` + `metadata` (`app/_data/routes.ts`). The builder emits no `<time>` and no elevation (`lib/track-synthetic-gpx.ts`).
- `updateRoute` rebuilds the shape: it uploads a new synthetic GPX, re-parses metadata, repoints `fileAssetId`, retires the old asset as `PENDING_DELETE`, and calls `revalidateRoutePaths()` + `revalidateTrackPaths()` (`app/_data/routes.ts`). This is the exact rebuild pattern a composite route needs.
- Route preview and geometry editing read `metadata.mapGeometry`, which is the simplified map line, not the original placed points (`readRoutePoints` in `app/_data/routes.ts`).
- Public track distance currently reads `track.parsed.summary.distanceMeters` (`app/(public)/tracks/[slug]/page.tsx`, `app/(public)/tracks/page.tsx`), while owner/admin tables read `getEffectiveTrackDistanceMeters` (`lib/track-effective-values.ts`).
- `routeId` appears 65 times across `app/_data/tracks.ts`, `app/_data/routes.ts`, `components/track-pages`, and `lib/track-geometry.ts`; it drives route-based checks, attach/replace, rename/cleanup eligibility, route counts, and the feature-150 map flag.
- `deleteRoute` refuses while `_count.tracks > 0` and relies on `Restrict` foreign keys (`app/_data/routes.ts`). A child route used by a composite would need its own usage count/guard.

## Option A — Composite Route

### A1. Materialized synthetic GPX (recommended)

A parent route stores ordered segment rows and a generated GPX/metadata. Readers see one ordinary route.

```prisma
enum RouteSegmentRole {
  START
  MAIN
  END
}

model Route {
  // existing fields...
  isPart        Boolean            @default(false)
  composition   RouteComposition?
  segmentUsages RouteSegment[]
}

model RouteComposition {
  id        String         @id @default(uuid())
  routeId   String         @unique
  route     Route          @relation(fields: [routeId], references: [id], onDelete: Cascade)
  segments  RouteSegment[]
  createdAt DateTime       @default(now())
  updatedAt DateTime       @default(now()) @updatedAt
}

model RouteSegment {
  id            String           @id @default(uuid())
  compositionId String
  composition   RouteComposition @relation(fields: [compositionId], references: [id], onDelete: Cascade)
  childRouteId  String
  childRoute    Route            @relation(fields: [childRouteId], references: [id], onDelete: Restrict)
  role          RouteSegmentRole
  sortOrder     Int
  lapCount      Int              @default(1)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @default(now()) @updatedAt

  @@unique([compositionId, sortOrder])
  @@index([childRouteId])
}
```

The `RouteComposition` sidecar keeps the parent a normal route and avoids a direct self-relation on `Route`. Plain routes have no composition row and keep `isPart = false`. A composite parent is a normal `Route` with its generated GPX and a sidecar composition. An ingredient route may set `isPart = true`: it stays in the same `Route` table, is hidden from the main library/picker, cannot be attached to a track directly, and can still be referenced by any composition. All existing routes default to `isPart = false`.

Rules for the first slice: only routes can be segments (no recorded files), one level deep (a child cannot itself have a composition), `lapCount >= 1`, and only `MAIN` may exceed 1. The parent keeps its normal `fileAssetId` and `metadata`, so `Track.routeId`, `resolveTrackGeometry`, downloads, and every public surface work unchanged.

**Rebuild flow.** `rebuildCompositeRoute(parentRouteId)`:

1. Load the parent title, its `RouteComposition`, ordered segments, and child route metadata.
2. For each segment take the child geometry, repeat `lapCount` times (drop the duplicate closing point between laps when the loop's first and last point coincide), and append.
3. Build one synthetic GPX from the ordered points, parse it with `buildTrackGpxMetadata`, upload it, and update the parent route in a transaction using the existing `updateRoute` pattern (repoint `fileAssetId`, replace `metadata`, retire the previous file).
4. Revalidate route and track paths.

The map, bounds, point count, and distance then come from the parent's parsed summary, which is exactly what the current public/table code already reads. No `Track` or `resolveTrackGeometry` change is needed.

**Rebuild propagation.** Editing a child route's geometry must rebuild every parent composition that uses it. The child update commits first, then `rebuildCompositeRoutesUsing(childRouteId)` runs outside that transaction because UploadThing is external. If a rebuild fails, the child is correct but the parent is stale: record/return the failure and expose a **Rebuild route** action in the library rather than silently serving old geometry. Deleting a child route must be refused while a composition references it, mirroring the existing `IN_USE` copy.

**Lap UX and parts.** Laps are a property of the parent route's `MAIN` segment. The workout form can offer a **Build a lap route** action: choose a loop route, enter the lap count, name the variant, save it, and attach it immediately. The route library then lists “Park loop × 3” as a reusable route. This keeps the owner's “enter laps at workout creation” flow while avoiding a `Track` field. The same loop with 2 and 3 laps produces two route rows. Small start/end segments can be created as `isPart = true` ingredients: they are hidden from the main library and picker, cannot be attached directly to a workout, and remain reusable inside compositions. A loop that is valuable on its own stays `isPart = false` and can still be used as a child.

**Start/main/end.** A1 extends naturally to `START` + `MAIN` + `END` rows. Because the result is one polyline, consecutive segments must meet within a small tolerance; otherwise the map draws a straight connector and the parsed distance includes it. v1 should validate continuity and refuse/warn on a gap. True gaps need multiple polylines (see A2 / feature-150) and are out of scope.

### A2. Dynamic composition

A parent route stores the recipe but composes geometry at read time. This preserves gaps and per-segment display, but `Route.fileAssetId` is currently non-null and `resolveTrackGeometry` returns one file/metadata. A2 therefore needs either a nullable/placeholder route file or a composite branch in `resolveTrackGeometry`, plus aggregation in the public map, distance, downloads, and tables. It is more read-path work than A1 and does not remove the need for a recipe table.

## Option B — TrackSegment on the workout

A workout owns ordered segments; the route library stays one-loop routes.

```prisma
model TrackSegment {
  id        String        @id @default(uuid())
  trackId   String
  track     Track         @relation(fields: [trackId], references: [id], onDelete: Cascade)
  routeId   String
  route     Route         @relation(fields: [routeId], references: [id], onDelete: Restrict)
  role      RouteSegmentRole
  sortOrder Int
  lapCount  Int           @default(1)

  @@unique([trackId, sortOrder])
  @@index([routeId])
}
```

The migration replaces `Track.routeId` with a MAIN segment for every route-based track, changes `Track_geometry_source_check` to “file XOR segment”, and updates every route-based assumption: `resolveTrackGeometry`, feature-142 attach/replace, feature-147 rename/cleanup eligibility, feature-150 map flags, route linked-track counts, quick route creation, and the manual route tab. Public map/distance must aggregate segments; non-contiguous start/end needs multiple polylines and a new projection.

**Strength:** laps are a per-workout parameter on one reusable loop, exactly matching “pick this route and run 3 laps”. The route library stays clean.

**Cost:** the largest blast radius of the three options, and it changes the geometry model that `feature-142` just established.

## Comparison Matrix

| Criterion | A1 materialized composite route | A2 dynamic composite route | B TrackSegment |
| --- | --- | --- | --- |
| Track model blast radius | None | None, but read paths aggregate | High: `routeId` replaced, check and ~65 refs |
| Lap semantics | Reusable route variant | Reusable route variant | Per-workout parameter |
| Geometry and distance | One generated summary; exact total if built from full points | Aggregated at read time; gaps preserved | Aggregated at read time; gaps preserved |
| Non-contiguous start/end | Needs continuity validation; otherwise a connector | Supports gaps | Supports gaps with multi-line projection |
| Child route edit | Rebuild parent composites | No rebuild, read-time composition | No rebuild, read-time composition |
| Storage/payload | One generated GPX per variant | Recipe + child reads | Segment rows; no generated parent file |
| UX | Route library variants; inline create can hide the extra step | Same as A1 | Clean loop library, laps entered per workout |
| Migration | Additive table; no Track backfill | Additive table + resolver changes | Backfill and drop/replace `Track.routeId` |
| Interaction with 142/143/150 | Low | Medium | High |
| Implementation size | 1 foundation + 1 UI slice | 2–3 slices | 3+ slices |
| Verdict | **recommend** | acceptable with caveats | accept only if per-workout laps are mandatory |

## Recommendation

Choose **A1 materialized composite route** for the first implementation. It respects the owner's stated preference for a composite route, keeps the workout model and all shipped track features intact, and reuses the existing route rebuild/revalidation machinery. Store the recipe in a `RouteComposition` sidecar rather than a self-relation on `Route`, mark small ingredients with `Route.isPart`, implement laps as a `MAIN` segment property, and let the workout form create a lap variant inline so the owner still enters the count at creation time.

The recommendation is conditional on two product choices:

- **Laps as a route variant is acceptable.** If the owner insists that one loop route must support different lap counts per workout without creating a variant, A1 is the wrong model; choose B.
- **Start/end segments are contiguous.** If the owner wants arbitrary start/end gaps, A1 v1 should refuse or warn; a later dynamic/multi-line slice owns true gaps.

## Migration Sketch (A1)

1. Add `Route.isPart`, the `RouteComposition` sidecar, the `RouteSegment` table, and the `RouteSegmentRole` enum; no existing row changes.
2. Add the composite rebuild service and the child-usage/parent-use guards; backfill is not needed because plain routes remain valid with `isPart = false`.
3. Add the route-builder UI, the parts filter/view, and inline lap-variant creation; existing routes keep working as before.
4. Add `START`/`END` roles and continuity validation once the MAIN/lap path is proven.
5. Later: evaluate A2/dynamic composition only if non-contiguous segments become a requirement.

Rollback: drop `RouteComposition`, `RouteSegment`, and `Route.isPart`; composite routes remain ordinary routes with their generated GPX. No track migration to reverse.

## Risks and Open Questions

- **Route-library variants.** “Park loop × 2” and “× 3” are separate routes. Decide whether that is acceptable or whether the library needs a grouped variant view.
- **Parts management.** `isPart = true` routes are hidden from the main library and picker, so the owner needs a parts filter/view or management inside the builder. Promotion to standalone and demotion back to a part need explicit rules; demotion must be refused while the route is attached directly to a track.
- **Global flag semantics.** `isPart` is per route, not per usage. A standalone route can still be used as a child; a part cannot be attached to a workout. Decide whether promotion is one-way for practical purposes or fully reversible.
- **Distance precision.** Composition from `metadata.mapGeometry` uses the simplified line; the parsed total can differ slightly from the sum of child summaries. Prefer rebuilding from full child points or add stored source points before promising exact totals.
- **Rebuild propagation.** A child geometry edit must rebuild parents; decide synchronous rebuild versus a stale marker + explicit Rebuild action. A failed rebuild must never silently serve old geometry.
- **Shared composite edits.** Editing a composite route used by several tracks must reuse the existing shared-route confirmation and linked-track count; a child edit must count the tracks of every parent composition too, not only the child's direct tracks.
- **Contiguity tolerance.** Define the allowed gap between segment ends and starts, and whether a gap is refused or rendered as a warning.
- **Nested composites.** Disallow in v1; a child must be a plain route with no composition of its own.
- **Segment source.** Routes only in v1; a recorded file as a segment would reintroduce elevation/time and multi-file semantics.
- **Route delete guards.** Extend the existing `_count.tracks` check with `RouteComposition` parent usage and the `Restrict` foreign key; a part used by a composition cannot be deleted.
- **Per-workout laps.** If the owner later wants the same loop with a different count without a route variant, revisit B or a narrow `Track.lapCount` override with a documented rule that it cannot coexist with a composite route's laps.

## Follow-up Slices

1. `feature-XXX-outdoor-route-composition-foundation` — `Route.isPart`, `RouteComposition`, `RouteSegment`, rebuild service, child-usage/delete guards, tests. No UI; supersedes the schema portion of `outdoor-route-workout-laps`.
2. `feature-XXX-outdoor-route-builder` — route library UI to create/edit a composite route, preview it, set the MAIN lap count, create/manage parts (`isPart = true`), and show the variant in the library.
3. `feature-XXX-outdoor-workout-lap-route` — workout creation selects a composite route or builds a lap variant inline; public display and distance follow the generated route. This replaces `outdoor-route-workout-laps` as the user-facing lap feature.
4. `feature-XXX-outdoor-route-start-end-segments` — add `START`/`END` roles, continuity validation, and the three-part builder.
5. Later research — non-contiguous segments and dynamic composition/multi-line rendering, only if the owner needs gaps.

## Evidence

- `prisma/schema.prisma`: `Route`, `Track`, `TrackGeometry`, `FileAsset`.
- `prisma/migrations/20261108120000_feature_141_outdoor_workout_drafts/migration.sql`: geometry-source and publish checks.
- `lib/track-geometry.ts`: primary resolution.
- `app/_data/routes.ts`: create, update/rebuild, preview, delete, usage guards.
- `lib/track-synthetic-gpx.ts`: synthetic GPX shape.
- `app/_data/tracks.ts`: route-based creation, attach/replace, distance reads, `routeId` assumptions.
- `lib/track-effective-values.ts`: owner/admin distance fallback.
- `app/(public)/tracks/[slug]/page.tsx`, `app/(public)/tracks/page.tsx`: public distance reads.
- `feature-142`, `feature-143`, `feature-150` artifacts: secondary files, extra tracks, multi-line map.
- Proposed: `RouteComposition`, `RouteSegment`, and `Route.isPart` (sidecar composition plus ingredient flag).
