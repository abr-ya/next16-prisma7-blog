# Design

## Context

`feature-152` shipped the model (`RouteComposition`, `RouteSegment`, `Route.isPart`), the rebuild core (`lib/route-composition.server.ts`), the owner-gated `replaceRouteComposition` / `rebuildRouteComposition` actions, propagation from a child edit, and the delete/attach guards. It shipped no UI and no way to create a parent route that has no placed points.

The route library today (`components/track-pages/routes-panel.tsx`, `routes-columns.tsx`, `route-form-dialog.tsx`, `route-geometry-dialog.tsx`, `route-preview-dialog.tsx`) lists the owner's routes, creates one from placed points, edits title/description, edits geometry, previews the shape, and deletes an unused route. Its copy is English literals; this slice matches them instead of half-localizing the page.

## Builder Flow

`/my/routes` gets a second toolbar action, **New composite route**, next to **New route**.

The new `RouteCompositionDialog` collects:

- parent title and description (same limits as `RouteFormDialog`);
- an ordered list of segments, each showing the child route's title and a lap count;
- **Add segment** appends a row with the first eligible child and `lapCount = 1`;
- move up / move down / remove per row — no drag-and-drop, no new dependency;
- a read-only line with the segment count and total laps;
- **Save**, disabled until the title is non-empty, at least one segment exists, and every lap count is a positive whole number.

The same dialog opens in edit mode from the library row: it loads the stored recipe through a new owner-gated read and saves through `replaceRouteComposition`, which already handles `confirmShared` for a parent used by several tracks.

Only plain routes are offered as children: the parent itself and any route that already has a composition are filtered out, because the server refuses both. The server stays the authority; the filter just keeps the refusal off the common path.

`START`/`END` roles are not authorable; the dialog offers no role control and every segment is `MAIN`, matching the shipped validation.

## Create Path

`createCompositeRoute({ title, description, segments })` in `app/_data/route-compositions.ts` calls a new server core `createRouteCompositionForOwner`:

1. Resolve the actor with `requireTrustGatedAction("track-upload")` — the same gate as any geometry upload.
2. Run the shared preparation step: validate the recipe shape, load the children with the owner scope, refuse nested/self/foreign children, fetch each child's full points, plan the concatenated geometry, and refuse a gap beyond the tolerance. This step is extracted from `saveRouteCompositionForOwner` so create and replace cannot drift.
3. Build and validate the synthetic GPX, then upload it under the parent title's slug.
4. In one transaction: create the parent `Route` (title, description, `fileAssetId`, parsed metadata, owner), create its `RouteComposition`, and insert the ordered `RouteSegment` rows.
5. Revalidate route and track paths and return the new route id and slug.

The parent is an ordinary route from that moment on: the existing pickers, the quick route dialog, the workout form, the trip attach flow, the preview dialog, and the public pages read it unchanged.

## Library State

`getOwnerRoutes` adds a composition select and returns:

- `isComposite` — the route has a composition;
- `segmentCount`;
- `segmentLapTotal`;
- `staleAt`.

The table gets a **Composition** column: a secondary badge `3 segments · 5 laps` for a composite route, `—` for a plain one, and a destructive **Stale** badge next to it when `staleAt` is set. A stale row shows a **Rebuild** action that calls `rebuildRouteComposition`, toasts the result, and refreshes the page. That is the visible half of `feature-152`'s staleness contract.

`Edit geometry` is hidden for a composite route: its shape comes from the recipe, and accepting placed points would silently drop the composition's meaning. As a server backstop, `updateRoute` refuses a points rewrite when the route has a composition, with a validation message that points at the builder. Title and description stay editable through the existing dialog.

The edit dialog loads its recipe through `getRouteCompositionSegments(routeId)`: an owner-gated read returning the parent title/description, `staleAt`, and the ordered segments with each child's id and title.

## Reuse and Boundaries

- `replaceRouteComposition` and `rebuildRouteComposition` are unchanged from `feature-152`; the builder is a caller.
- `lib/route-composition.ts` stays the pure plan; no geometry logic moves into components.
- No schema change and no migration: the fields the builder needs already exist.
- `createRouteFromPoints` is untouched; placing points still creates a plain route.
- Parts (`isPart`) stay `false` everywhere; the parts slice owns promotion, hiding, and the parts filter.

## Risks

- **A composite parent edited as points.** Prevented on the client by hiding the action and on the server by refusing a points rewrite.
- **Confusing empty state.** A new owner with fewer than two routes cannot compose anything; the dialog explains that a composition needs existing routes and links to the point-based **New route** flow.
- **Long child lists.** The selector lists the owner's routes; a very large library would need search, which is out of scope until the owner asks for it.
- **Stale geometry served after a failed rebuild.** The library now shows the badge and the action, which closes the loop opened by `feature-152`.
- **Mixed localization.** New copy is English like the rest of the route library; the localization pass is a separate candidate.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint for the touched files, `openspec validate --changes --strict`, and the owner's local `npm run build`. Browser checks: create a composite from two routes and a three-lap loop, preview the generated shape, attach it to a workout and see the map and distance, edit the order and laps, edit a child and watch the parent rebuild, force a stale badge and rebuild it, confirm **Edit geometry** is absent for a composite, and confirm nested/self/gap refusals surface as toasts without closing the dialog.
