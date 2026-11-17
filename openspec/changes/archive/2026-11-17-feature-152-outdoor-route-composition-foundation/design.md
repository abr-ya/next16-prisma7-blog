# Design

## Context

`research-002` compared three models and recommended A1: a materialized composite `Route`. Readers stay unchanged — a composite parent is an ordinary route with its own `fileAssetId` and `metadata`, so `Track`, `resolveTrackGeometry`, the public map and distance, downloads, `feature-142` secondary files, `feature-143` extra tracks, and `feature-150` multi-line maps all keep working.

Current pieces this slice builds on:

- `Route` is one shape: `fileAssetId @unique`, `metadata`, owner, `tracks`.
- `createRouteFromPoints` and `updateRoute` build a synthetic GPX with `buildSyntheticGpxBytes`, upload it, parse it with `buildTrackGpxMetadata`, repoint `fileAssetId`, and retire the previous file as `PENDING_DELETE`. `updateRoute` already revalidates route and track paths.
- `deleteRoute` refuses while the route has linked tracks and relies on `Restrict` foreign keys.
- Route geometry for editing is read from `metadata.mapGeometry`; the file is the full-precision source.

## Data Model

Additive only; no existing row changes and no backfill.

```prisma
enum RouteSegmentRole {
  START
  MAIN
  END
}

model Route {
  // existing fields…
  isPart        Boolean          @default(false)
  composition   RouteComposition?
  segmentUsages RouteSegment[]   @relation("RouteSegmentChild")
}

model RouteComposition {
  id        String         @id @default(uuid())
  routeId   String         @unique
  route     Route          @relation(fields: [routeId], references: [id], onDelete: Cascade)
  segments  RouteSegment[]
  // Set when a child edit could not rebuild this parent. Readers still see
  // the last good geometry; the builder surfaces the marker and offers a rebuild.
  staleAt   DateTime?
  createdAt DateTime       @default(now())
  updatedAt DateTime       @default(now()) @updatedAt
}

model RouteSegment {
  id            String           @id @default(uuid())
  compositionId String
  composition   RouteComposition @relation(fields: [compositionId], references: [id], onDelete: Cascade)
  childRouteId  String
  childRoute    Route            @relation("RouteSegmentChild", fields: [childRouteId], references: [id], onDelete: Restrict)
  role          RouteSegmentRole
  sortOrder     Int
  lapCount      Int              @default(1)
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @default(now()) @updatedAt

  @@unique([compositionId, sortOrder])
  @@index([childRouteId])
}
```

Why a sidecar instead of a self-relation on `Route`: the parent keeps its normal columns and every existing read path, and a plain route simply has no composition row. `isPart` is a property of the route itself, not of one usage, so a small lead-in/lead-out route is hidden from the library and the picker while remaining reusable inside any composition.

## Rebuild Service

`rebuildRouteComposition(routeId)` (owner-gated data layer, no UI yet) runs in this order:

1. Load the parent (owner, title, current `fileAssetId`), its composition, and the ordered segments with each child's `fileAssetId` and `metadata`.
2. For each child, fetch its GPX content by file URL with `fetchTrackGpxContent` and read full-precision points with `parseGpxEditablePoints`. The simplified `metadata.mapGeometry` is not used — the total distance must come from the same points the child was built from.
3. Repeat the child's points `lapCount` times. When a lap's first and last point are within the loop-closure tolerance, drop the last point before repeating so the lap does not add a zero-length segment.
4. Append segment by segment, checking that the last appended point and the next segment's first point are within the continuity tolerance.
5. Build one synthetic GPX with `buildSyntheticGpxBytes(parent.title, points)`, validate it with `validateGpxString`, and upload it with `uploadSyntheticTrackGpx` (filename from the parent title slug).
6. In one transaction: create the `FileAsset` row, parse the same bytes with `buildTrackGpxMetadata`, update the parent's `fileAssetId` and `metadata`, retire the previous file as `PENDING_DELETE`, and clear `staleAt`.
7. Revalidate route and track paths.

The map, bounds, point count, and parsed distance therefore come from the parent's parsed summary — exactly what the public and table code already reads.

## Composition Validation

`replaceRouteComposition({ routeId, segments, confirmShared })` stores the recipe and rebuilds. It refuses with the existing result vocabulary (`VALIDATION`, `SHARED_CONFIRMATION`, `NOT_FOUND`):

- the parent and every child belong to the caller;
- a child is a plain route — it has no composition of its own (one level deep);
- the parent is not its own child; repeated children in one composition are allowed;
- `segments` is non-empty, ordered, and every `sortOrder` is unique;
- `role` is `MAIN` in this slice; `START`/`END` stay in the enum but are not authorable until `outdoor-route-start-end-segments`;
- `lapCount >= 1`, and only `MAIN` may exceed `1`;
- every child parses to at least two points;
- consecutive segments meet within the continuity tolerance;
- a parent used by more than one track requires `confirmShared`, mirroring `updateRoute`.

Named constants in `lib/route-composition.ts`: `ROUTE_COMPOSITION_CONTINUITY_TOLERANCE_METERS = 25` and `ROUTE_COMPOSITION_LOOP_CLOSURE_TOLERANCE_METERS = 25`. A refusal names the measured gap in metres so the owner can fix the placement instead of guessing.

## Propagation

`updateRoute` keeps its current behaviour for the edited route, then, after its transaction commits, asks every parent composition that uses the route as a child to rebuild. The child is already correct, so a failed parent rebuild must not roll the child back: the failure marks `RouteComposition.staleAt` and is reported in the result, and the last good parent geometry stays readable. The **Rebuild route** action in the builder will clear the marker; this slice only owns the marker and the data-layer rebuild.

The external upload makes the rebuild non-transactional by nature, the same way `updateRoute` already is. A failure before the parent update leaves the parent unchanged and its old file active.

## Guards

- `deleteRoute` refuses a route that any composition uses as a child, with `IN_USE` and a message naming the number of compositions. The `Restrict` foreign key is the database backstop; the data-layer guard produces the readable answer.
- Deleting a parent deletes its composition and segments by cascade; the children stay untouched, and the parent's file is retired as today.
- A route with a composition cannot be used as a child — checked in validation, not by a database constraint, because the same row is a valid parent.
- `isPart = true` routes cannot become a workout's geometry: `createTrackFromRoute`, `createQuickRouteWorkout`, and `attachRouteToTrack` refuse them with `VALIDATION`. No route can be marked `isPart` until the builder ships, so this guard is defensive and changes no current behaviour.

## Risks

- **Silent stale geometry.** Mitigated by `staleAt`, a failed rebuild never reporting success, and the propagation rule that keeps the child committed. The builder must show the marker and offer a rebuild.
- **Distance differences.** Rebuilding from full child points avoids the simplified-line drift; the parent summary may still differ slightly from the sum of child summaries because the parent's parser sees the concatenated points, which is the honest number for the materialized line.
- **Shared composite edits.** A parent used by several tracks changes all of them; `confirmShared` mirrors the existing route-edit confirmation.
- **Non-contiguous parts.** Refused by tolerance in this slice rather than drawn as a straight connector. True gaps belong to the later research slice.
- **Orphan upload on failure.** The generated file is uploaded before the transaction, the same order `updateRoute` uses; a transaction failure leaves an unowned provider object, not a dangling row. This matches the existing accepted risk in the route edit path.

## Migration

One additive migration created with the project flow (`npx prisma migrate dev --name add_route_composition`). It adds the enum, the nullable `isPart` column with its default, and two tables with their indexes and foreign keys. After it applies, `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` must print an empty script. Rollback is dropping the two tables, the enum, and the column; composite routes stay ordinary routes with their generated GPX, and no track migration exists to reverse.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint for the touched data-layer and lib files, `npx prisma validate`, `npx prisma generate`, `openspec validate --strict`, and the owner's local `npm run build`. Data-level checks: a two-child composition rebuilds one GPX whose parsed point count equals the sum of the segments minus the dropped closing points; a child geometry edit rebuilds the parent; a child used by a composition cannot be deleted; a stale marker appears when a rebuild fails. Browser verification is limited to "existing route and track pages render unchanged", because this slice has no UI.
