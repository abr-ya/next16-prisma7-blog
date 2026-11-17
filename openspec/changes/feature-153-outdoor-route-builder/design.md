# Design

## Context

`feature-152` shipped the model (`RouteComposition`, `RouteSegment`, `Route.isPart`), the rebuild core (`lib/route-composition.server.ts`), the owner-gated `replaceRouteComposition` / `rebuildRouteComposition` actions, propagation from a child edit, and the delete/attach guards. It shipped no UI and no way to create a parent route that has no placed points.

The route library today (`components/track-pages/routes-panel.tsx`, `routes-columns.tsx`, `route-form-dialog.tsx`, `route-geometry-dialog.tsx`, `route-preview-dialog.tsx`) lists the owner's routes, creates one from placed points, edits title/description, edits geometry, previews the shape, and deletes an unused route. Its copy is English literals, except the saved-places picker in the route form, which is translated; this slice matches the English copy and leaves the localization pass to a separate candidate.

## Builder Flow

`/my/routes` gets a second toolbar action, **New composite route**, next to **New route**.

The new `RouteCompositionDialog` collects:

- parent title and description (the same limits as `RouteFormDialog`: title up to 120 characters, description up to 2000);
- an ordered list of segments, each showing the child route's title and a lap count;
- **Add segment** appends a row with the first eligible child and `lapCount = 1`;
- move up / move down / remove per row — no drag-and-drop, no new dependency;
- a read-only line with the segment count and total laps;
- **Save**, enabled only when the recipe is meaningful: at least two segments, or one segment repeated more than once. One segment with one lap would materialize a copy of that route under a new name, so the server refuses it too.

The same dialog opens in edit mode from the library row: it loads the stored recipe through a new owner-gated read and saves through `replaceRouteComposition`, which already handles `confirmShared` for a parent used by several tracks.

The eligible children are the owner's routes that carry no composition and are not the parent itself; the server refuses both, so the filter only keeps the refusal off the common path. A route marked `isPart` stays eligible — it is an ingredient of a composition by definition. The parts slice keeps parts out of the library list and the workout pickers, not out of this selector. The same route may be used by more than one segment; only the segment order has to be unique.

`START`/`END` roles are not authorable; the dialog offers no role control and every segment is `MAIN`, matching the shipped validation.

## Create Path

`createCompositeRoute({ title, description, segments })` in `app/_data/route-compositions.ts` resolves the actor with `requireTrustGatedAction("track-upload")` — the same gate as any geometry upload — and hands the work to the new server core `createRouteCompositionForOwner({ userId, title, description, segments })`. The core stays actor-free, exactly like `saveRouteCompositionForOwner`: it takes the owner id and is unreachable from the browser, so the id cannot be spoofed the way a server action's argument could.

1. Validate the title the way `createRouteFromPoints` does: non-empty, at most 120 characters.
2. Run the shared preparation step (see below).
3. Build and validate the synthetic GPX, then upload it under the parent title's slug.
4. In one transaction: create the parent `Route` (title, description, `fileAssetId`, parsed metadata, owner), create its `RouteComposition`, and insert the ordered `RouteSegment` rows.
5. Revalidate route and track paths and return the new route id and slug.

The parent is an ordinary route from that moment on: the existing pickers, the quick route dialog, the workout form, the trip attach flow, the preview dialog, and the public pages read it unchanged.

## Shared Preparation

`saveRouteCompositionForOwner` grows a preparation step that both create and replace use, so the two paths cannot drift:

- validate the recipe shape (non-empty, unique order, `MAIN` only, positive lap count) and require a meaningful recipe;
- load the children with the owner scope and refuse a foreign, nested, or missing child;
- fetch each child's full points and plan the concatenated geometry;
- refuse a gap beyond the continuity tolerance.

The step knows nothing about a parent, so the create path can call it before the parent exists. The parent-dependent checks stay with the caller:

- the parent cannot be its own segment — replace only, since the create path has no parent yet;
- the shared confirmation — a parent used by more than one track is confirmed after the recipe is validated, not before. `feature-152` asked for the confirmation first; asking last means the owner never confirms a recipe the server is about to refuse. The refusal order is part of the spec delta.

## Shared Materialization

`materializeRoute` builds the GPX, uploads it, and repoints the parent. The create path has no parent to repoint, so the shared part is split once:

- `buildAndUploadCompositionFile({ title, userId, points })` builds and validates the bytes, uploads them, and parses the metadata — the same order `materializeRoute` uses today;
- the transaction then either creates the parent route (create) or repoints it and retires the previous file (replace and rebuild).

One build-and-upload path, one transaction shape, two branches. The upload still happens before the transaction, as it does in `createRouteFromPoints` and `updateRoute`: a failed transaction leaves the uploaded object behind, which the file cleanup job will pick up later.

## Library State

`getOwnerRoutes` adds a composition select and returns:

- `isComposite` — the route has a composition;
- `segmentCount`;
- `segmentLapTotal`;
- `staleAt`.

The table gets a **Composition** column: a secondary badge `3 segments · 5 laps` for a composite route, `—` for a plain one, and a destructive **Stale** badge next to it when `staleAt` is set. A stale row shows a **Rebuild** action that calls `rebuildRouteComposition`, toasts the result, and refreshes the page. That is the visible half of `feature-152`'s staleness contract.

The panel receives every owner route with these fields and derives the eligible children from them, so the composite rows stay in the table and the child selector still sees the plain ones.

`Edit geometry` is hidden for a composite route: its shape comes from the recipe, and accepting placed points would silently drop the composition's meaning. As a server backstop, `updateRoute` refuses a points rewrite when the route has a composition, with a validation message that points at the builder. Title and description stay editable through the existing dialog.

The edit dialog loads its recipe through `getRouteCompositionSegments(routeId)`, an owner-gated read next to `getRouteById`: it returns the parent title/description, `staleAt`, and the ordered segments with each child's id and title.

## Reuse and Boundaries

- `replaceRouteComposition` and `rebuildRouteComposition` are unchanged from `feature-152`; the builder is a caller.
- `lib/route-composition.ts` stays the pure geometry plan. The meaningful-recipe rule is a product rule and lives in the data layer, so the plan's own check script keeps its current cases.
- No schema change and no migration: the fields the builder needs already exist.
- `createRouteFromPoints` is untouched; placing points still creates a plain route.
- Parts (`isPart`) stay `false` everywhere; the parts slice owns promotion, hiding, and the parts filter.

## Risks

- **A composite parent edited as points.** Prevented on the client by hiding the action and on the server by refusing a points rewrite.
- **Confusing empty state.** A new owner with no routes at all cannot compose anything; the dialog explains that a composition needs existing routes and links to the point-based **New route** flow. One route is already enough for a repeated loop.
- **A degenerate composition.** One segment with one lap only copies that route; the dialog keeps **Save** disabled and the server refuses the recipe.
- **Long child lists.** The selector lists the owner's routes; a very large library would need search, which is out of scope until the owner asks for it.
- **Stale geometry served after a failed rebuild.** The library now shows the badge and the action, which closes the loop opened by `feature-152`.
- **Mixed localization.** New copy is English like the rest of the route library; the localization pass is a separate candidate.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint for the touched files, `npx tsx scripts/check-route-composition.ts`, `npx openspec validate --changes --strict`, and the owner's local `npm run build`. Browser checks: create a composite from two routes and a three-lap loop, preview the generated shape, attach it to a workout and see the map and distance, edit the order and laps, edit a child and watch the parent rebuild, force a stale badge and rebuild it, confirm **Edit geometry** is absent for a composite, confirm a one-segment single-lap recipe cannot be saved, confirm nested/self/gap refusals surface as toasts without closing the dialog, and confirm a shared parent asks for the confirmation only after the recipe itself is valid.
