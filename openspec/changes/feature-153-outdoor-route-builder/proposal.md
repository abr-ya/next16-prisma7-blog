# Proposal

## Why

`feature-152` can store and rebuild a composite route, but nothing in the product can create one. The route library only draws points, so the everyday case — a familiar loop run three times, or a park loop with a short lead-in — still cannot be expressed.

This slice adds the builder UI on `/my/routes`: compose a route from ordered existing routes, set the lap count, see the generated shape, and rebuild it when a child changes. Ingredient (`isPart`) management is deliberately a separate slice.

## What Changes

- Add a **New composite route** action to `/my/routes` that opens a builder dialog.
- The builder dialog collects the parent title and description, an ordered list of existing plain routes, and a lap count per segment. Segments can be added, removed, and moved up or down. Only one `MAIN` role is offered in this slice, matching the server.
- A recipe is saved only when it is meaningful: at least two segments, or one segment repeated more than once. One segment with one lap would only duplicate that route, so the server refuses it as well.
- A route title is bounded by one shared limit of 150 characters. The route form refuses a longer title before the request leaves the browser, and the server refuses it on every creation and rename, so a title can never outgrow the limit the form shows.
- Add `createCompositeRoute` to the data layer: build the parent from the recipe in one flow — validate the title and the recipe, generate and parse the GPX from the chosen children, create the parent route with its generated file, and store the composition.
- Reuse the shipped `replaceRouteComposition` for edits and `rebuildRouteComposition` for the **Rebuild** action.
- Show composition state in the library: a segments badge (`N segments · M laps`), and a **Stale** badge with **Rebuild** when a child edit failed to propagate.
- `getOwnerRoutes` gains composition fields (`isComposite`, `segmentCount`, `segmentLapTotal`, `staleAt`) so the table can render them without a second query; a new owner-gated read returns the ordered segments for the edit dialog.
- The child selector offers every route the owner has that carries no composition and is not the parent. A route marked `isPart` stays selectable — it is an ingredient of a composition by definition — while the parts slice keeps parts out of the library list and the workout pickers.
- New routes created as composites are ordinary parent routes: they appear in every existing picker and attach to workouts and trips unchanged.
- No route-model change beyond what `feature-152` added; no parts, no start/end segments, no inline workout lap creation.

## Non-goals

- `isPart` parts management, promotion/demotion, a parts filter, and hiding parts from pickers (follow-up `outdoor-route-parts`).
- `START`/`END` segments and continuity authoring beyond the existing `MAIN`-only validation.
- Creating a lap variant from the workout form (`outdoor-workout-lap-route`).
- Drag-and-drop ordering; move-up/move-down buttons are enough.
- Localizing the route library. Its copy is English today, apart from the saved-places picker; this slice matches the surrounding copy and leaves the localization pass to a separate candidate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-route-composition`: adds the owner-facing builder — creating a composite from the library, editing the ordered recipe and laps, the segments and stale badges, and the rebuild action.
- `outdoor-routes`: bounds the route title and makes the server enforce the same limit the form applies.

## Impact

- `app/_data/route-compositions.ts` and `lib/route-composition.server.ts` — the create path plus a shared validation/preparation step and a shared materialization reused by create and replace.
- `app/_data/routes.ts` — `getOwnerRoutes` composition fields, an owner-gated ordered-segment read, and the server-side route title check.
- `lib/route-title.ts` and `components/track-pages/route-form-dialog.tsx` — one shared route title limit for the form and the server.
- `components/track-pages/routes-panel.tsx`, `routes-columns.tsx`, a new `route-composition-dialog.tsx` — the builder and the library state.
- `app/(public)/my/routes/page.tsx` — pass every owner route to the panel; the eligible children are derived from the composition fields.
- `openspec/backlog.md` — promote this slice and record the parts follow-up.
- No schema change, no migration, no new dependency, no public-page change.
