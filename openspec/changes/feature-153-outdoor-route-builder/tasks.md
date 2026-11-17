# Tasks

## 1. Server create path

- [ ] 1.1 Extract the shared recipe preparation (shape validation, owner-scoped children, nested/self refusals, full child points, continuity plan) from `saveRouteCompositionForOwner` in `lib/route-composition.server.ts` so create and replace reuse it.
- [ ] 1.2 Add `createRouteCompositionForOwner({ userId, title, description, segments })`: build and validate the GPX, upload it, then create the parent `Route`, its `RouteComposition`, and the ordered `RouteSegment` rows in one transaction; revalidate route and track paths.
- [ ] 1.3 Expose `createCompositeRoute` in `app/_data/route-compositions.ts` behind `requireTrustGatedAction("track-upload")` with the existing result vocabulary.
- [ ] 1.4 Refuse a points rewrite of a composited route in `updateRoute` with a validation message that points at the recipe.

## 2. Read model

- [ ] 2.1 Extend `getOwnerRoutes` in `app/_data/routes.ts` with `isComposite`, `segmentCount`, `segmentLapTotal`, and `staleAt`.
- [ ] 2.2 Add an owner-gated `getRouteCompositionSegments(routeId)` returning the parent title/description, `staleAt`, and the ordered segments with each child's id and title; refuse a foreign route and a route without a composition.

## 3. Builder UI

- [ ] 3.1 Add `components/track-pages/route-composition-dialog.tsx`: title, description, ordered segment rows with child select and lap count, add/move/remove, a segment/lap summary, and a Save that stays disabled on an incomplete recipe.
- [ ] 3.2 Offer only plain routes (no composition, not the edited parent) in the child selector; show an empty state that points at **New route** when fewer than two eligible routes exist.
- [ ] 3.3 Wire create and edit modes to `createCompositeRoute` and `replaceRouteComposition`, surface `VALIDATION` / `SHARED_CONFIRMATION` / `TRUST` as toasts, and keep the dialog open on refusal.
- [ ] 3.4 Add the **New composite route** toolbar action and an edit-composition action to `components/track-pages/routes-panel.tsx`.
- [ ] 3.5 Add the **Composition** column with the segments/laps badge and the **Stale** badge plus **Rebuild** action to `components/track-pages/routes-columns.tsx`.
- [ ] 3.6 Hide **Edit geometry** for a composite route and keep title/description editing available.
- [ ] 3.7 Pass the owner's routes from `app/(public)/my/routes/page.tsx` to the panel in the shape the builder needs.

## 4. Verification

- [ ] 4.1 Run `npm run tsc`.
- [ ] 4.2 Run `npm run lint` and targeted `npx eslint` for the touched `app/_data`, `lib`, and `components/track-pages` files.
- [ ] 4.3 Run `npx openspec validate --changes --strict`.
- [ ] 4.4 Ask the owner to run `npm run build` locally and report the result.
- [ ] 4.5 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md` and record the shipped slice in `openspec/feature-history.md` at archive time.
