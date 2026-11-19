# Design

## Context

`RouteSegmentRole` already contains `START`, `MAIN`, and `END`, and `RouteSegment.role` stores it. Everything downstream is role-agnostic:

- the rebuild plans the ordered segments, appends their points, repeats a segment when its lap count is above one, and checks continuity between neighbours;
- the parent is materialized as one line, so readers need no change;
- the lap display counts `MAIN` laps and reports the segment count, which is exactly what a lead-in / loop / lead-out route needs.

Two places still assume `MAIN` only: `validateRouteCompositionSegments` refuses any other role, and the data layer writes `AUTHORABLE_ROUTE_SEGMENT_ROLE` instead of the validated role. The builder dialog has no role control and sends `MAIN` for every row.

## Role Rules

A recipe's roles are validated before any database or geometry work, in `validateRouteCompositionSegments`:

- `role` is one of `START`, `MAIN`, `END`;
- at most one `START`, and it is the first segment in order;
- at most one `END`, and it is the last segment in order;
- at least one `MAIN` segment;
- multiple `MAIN` segments are allowed (for example two different loops in sequence);
- `lapCount` is a whole number of at least one for every role, but only `MAIN` may exceed one; `START` and `END` must be exactly one.

The "meaningful recipe" rule stays as it is: a single segment with a single lap would only copy that route. Together with the at-least-one-`MAIN` rule, a recipe made only of a start and an end is refused.

`START` and `END` do not carry laps, so the loop-closure rule keeps applying to a repeated `MAIN` segment only, and an open lead-in or lead-out is valid.

## Continuity

The existing rule is already what the new shape needs: every consecutive pair of segments must meet within `ROUTE_COMPOSITION_CONTINUITY_TOLERANCE_METERS`, or the recipe is refused with the measured gap. That covers `START → MAIN`, `MAIN → END`, and `MAIN → MAIN`, and the first segment has no predecessor to check. No new tolerance or warning mode is introduced.

## Persisting the Role

`prepareComposition` writes the validated `role` into `CompositionSegmentRow` instead of forcing `MAIN`, and the create transaction stores it. `normalizeSegmentInputs` keeps defaulting a missing role to `MAIN`, so an old caller that does not send roles keeps working. `resolveLapVariantRoute` keeps passing `MAIN` explicitly.

The stored composition read already returns `role`, so the builder's edit mode can restore it.

## Builder

Each segment row gets a role selector with **Start**, **Main**, and **End**. The lap input is disabled and pinned to `1` for a start or an end row, and remains editable for a main row. **Add segment** still appends a `MAIN` row with one lap. The dialog sends `sortOrder` by row position and the row's role, and the server stays the authority for ordering and cardinality.

The dialog's client-side ready check stays simple: title, at least one segment, every child chosen, a positive whole lap count, and the meaningful rule. Role mistakes surface as a server toast with the frozen dialog, which is the same contract the other recipe refusals already use.

## Display

No change is needed. Laps are summed across `MAIN` segments only and the segment count includes the lead-in and the lead-out, so the existing badge reads `3 laps · 3 segments` once such a route is attached to a workout.

## Risks

- **Order versus role.** The role rules and `sortOrder` must agree; the validator checks the sorted list, so a role at an impossible position is refused instead of silently reordered.
- **A role switch leaving a stale lap count.** The dialog pins the lap input when the role becomes a start or an end, and the server refuses a mismatched lap count anyway.
- **Shared route edits.** Unchanged: a composite used by tracks still asks for the shared confirmation.
- **More segments in the line.** Continuity is what protects the parsed distance from a connector; a route whose parts do not meet is refused, not merged silently.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx tsx scripts/check-route-composition.ts`, `npx openspec validate --changes --strict`, and a production build. The check script gains the role cases: a valid start/main/end recipe, a start in the wrong position, a second start, an end in the middle, a start with two laps, and a recipe without a main segment. Browser checks stay deferred to a manual QA candidate; the lead-in/lead-out case needs a route built from an existing loop, which is created later rather than in this slice.
