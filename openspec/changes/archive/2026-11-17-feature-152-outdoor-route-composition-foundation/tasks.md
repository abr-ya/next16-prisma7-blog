# Tasks

## 1. Schema and migration

- [x] 1.1 Add `RouteSegmentRole`, `RouteComposition`, `RouteSegment`, and `Route.isPart` to `prisma/schema.prisma` with the relation names from the design.
- [x] 1.2 Create the additive migration with the project flow (`npx prisma migrate dev --name add_route_composition`); if the sandbox has no database, ask the owner to run it locally and paste the result.
- [x] 1.3 Run `npx prisma validate` and `npx prisma generate`.
- [x] 1.4 After the migration is applied, confirm `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script` prints an empty script.

## 2. Pure composition helpers

- [x] 2.1 Add `lib/route-composition.ts` with the continuity and loop-closure tolerances, the segment-order validation, the lap repetition, and the duplicate closing-point drop.
- [x] 2.2 Keep the helpers free of Prisma and upload calls so the geometry plan is testable in isolation.
- [x] 2.3 Add `scripts/check-route-composition.ts` covering lap seams, open lines, contiguity, and shape refusals, and run it with `npx tsx scripts/check-route-composition.ts`.

## 3. Data layer

- [x] 3.1 Add `app/_data/route-compositions.ts` with owner-gated `replaceRouteComposition({ routeId, segments, confirmShared })`: validate, store the recipe, rebuild, return the existing result vocabulary.
- [x] 3.2 Add `rebuildRouteComposition(routeId)`: fetch child files, plan the points, build and validate the synthetic GPX, upload, transactionally repoint the parent and retire the old file, clear `staleAt`, revalidate route and track paths.
- [x] 3.3 Refuse a child that has its own composition, the parent as its own child, foreign routes, non-`MAIN` roles, `lapCount < 1`, and gaps beyond the tolerance, naming the measured gap.
- [x] 3.4 Require `confirmShared` when the parent has more than one linked track.

## 4. Propagation and guards

- [x] 4.1 After a geometry update in `updateRoute`, rebuild every parent composition that uses the updated route; on failure mark that composition stale and report it without rolling the child back.
- [x] 4.2 Extend `deleteRoute` to refuse a route used as a composition child with `IN_USE` and the composition count.
- [x] 4.3 Refuse `isPart` routes in `createTrackFromRoute`, `createQuickRouteWorkout`, and `attachRouteToTrack`.
- [x] 4.4 Leave `getOwnerRoutes`, the pickers, and the route pages untouched in this slice so no visible behaviour changes.

## 5. Verification

- [x] 5.1 Run `npm run tsc`.
- [x] 5.2 Run `npm run lint` and targeted `npx eslint` for `app/_data/routes.ts`, `app/_data/route-compositions.ts`, `lib/route-composition.ts`, and `app/_data/tracks.ts`.
- [x] 5.3 Run `npx openspec validate --strict`.
- [x] 5.4 Ask the owner to run `npm run build` locally and report the result.
- [x] 5.5 File the deferred data-level and browser checks as a manual QA candidate in `openspec/backlog.md`.
- [x] 5.6 Record the shipped slice in `openspec/feature-history.md` at archive time.
