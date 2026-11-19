# Proposal

## Why

The builder can only compose `MAIN` loops, so a route cannot express the common shape "walk to the park, run three laps, walk home". The materialization, ordering, continuity and lap display already work for any ordered segment list; only the role rules and the builder control are missing.

This slice adds `START` and `END` segments to the route builder, so a lead-in and a lead-out become part of one materialized route.

## What Changes

- Allow `START` and `END` roles in a recipe alongside `MAIN`. A composition MAY have at most one `START` (first) and at most one `END` (last); it MUST have at least one `MAIN`.
- Only `MAIN` may carry a lap count above one. `START` and `END` are single-pass segments with a lap count of one.
- The builder dialog gets a role selector per segment; the lap input is disabled and fixed at one for a start or an end segment.
- Keep the existing continuity refusal: consecutive segments, including the seams into and out of the loop, must meet within the tolerance, otherwise the recipe is refused with the measured gap.
- Keep the existing `N laps · M segments` display: laps still count `MAIN` segments only, and the lead-in and lead-out now appear in the segment count.
- No schema change and no migration: `RouteSegmentRole` already contains `START`, `MAIN`, and `END`.

## Non-goals

- True gaps between segments, multiple polylines, per-segment colours, or a dynamic read-time composition; those stay in the gaps research.
- Authoring start or end segments inline from the workout creation flows; the `Laps` field keeps producing a single-loop variant, and a lead-in/lead-out route is built in `/my/routes` and then picked.
- Ingredient (`isPart`) routes.
- Changing the public or table display beyond what `feature-154` already renders.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-route-composition`: recipes gain start and end roles with ordering, cardinality, lap and continuity rules, and the builder exposes them.

## Impact

- `lib/route-composition.ts` — role rules in the recipe validation.
- `lib/route-composition.server.ts` — persist the validated role instead of forcing `MAIN`.
- `components/track-pages/route-composition-dialog.tsx` — the role selector, the lap rule, and the role in the edit round trip.
- `scripts/check-route-composition.ts` — role cases.
- No schema, migration, API, or dependency changes.
