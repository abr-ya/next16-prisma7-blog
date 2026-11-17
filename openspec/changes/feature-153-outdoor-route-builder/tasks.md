# Tasks

## 1. Server create path

- [ ] 1.1 Extract the shared preparation step in `lib/route-composition.server.ts` so create and replace reuse it: recipe shape, the meaningful-recipe rule, owner-scoped children, the nested and foreign refusals that do not need a parent, the full child points, the continuity plan, and the gap refusal. Keep the parent-dependent checks with the caller — the parent cannot be its own segment (replace only), and the shared confirmation moves after the recipe validation.
- [ ] 1.2 Extract the shared materialization: `buildAndUploadCompositionFile({ title, userId, points })` builds, validates, uploads, and parses the synthetic GPX; the transaction then either creates the parent route or repoints it and retires the previous file.
- [ ] 1.3 Add `createRouteCompositionForOwner({ userId, title, description, segments })`: validate the title like `createRouteFromPoints`, run the shared preparation, then create the parent `Route`, its `RouteComposition`, and the ordered `RouteSegment` rows in one transaction; revalidate route and track paths.
- [ ] 1.4 Expose `createCompositeRoute` in `app/_data/route-compositions.ts` behind `requireTrustGatedAction("track-upload")` with the existing result vocabulary.
- [ ] 1.5 Refuse a points rewrite of a composited route in `updateRoute` with a validation message that points at the recipe.
- [ ] 1.6 Refuse a degenerate recipe — one segment with a lap count of one — in the shared preparation step, naming the reason.

## 2. Read model

- [ ] 2.1 Extend `getOwnerRoutes` in `app/_data/routes.ts` with `isComposite`, `segmentCount`, `segmentLapTotal`, and `staleAt`.
- [ ] 2.2 Add an owner-gated `getRouteCompositionSegments(routeId)` next to `getRouteById`, returning the parent title/description, `staleAt`, and the ordered segments with each child's id and title; refuse a foreign route and a route without a composition.

## 3. Builder UI

- [ ] 3.1 Add `components/track-pages/route-composition-dialog.tsx`: title, description, ordered segment rows with child select and lap count, add/move/remove, a segment/lap summary, and a Save that stays disabled until the title is filled, every lap count is a positive whole number, and the recipe is meaningful (two segments, or one segment repeated more than once).
- [ ] 3.2 Offer every route without a composition and not the edited parent in the child selector — including routes marked `isPart`; show an empty state that points at **New route** only when the owner has no routes at all.
- [ ] 3.3 Wire create and edit modes to `createCompositeRoute` and `replaceRouteComposition`, surface `VALIDATION` and `TRUST` as toasts, ask for the shared confirmation through the shared `ConfirmDialog` when the answer is `SHARED_CONFIRMATION`, and keep the dialog open on a refusal.
- [ ] 3.4 Add the **New composite route** toolbar action and an edit-composition action to `components/track-pages/routes-panel.tsx`.
- [ ] 3.5 Add the **Composition** column with the segments/laps badge and the **Stale** badge plus **Rebuild** action to `components/track-pages/routes-columns.tsx`.
- [ ] 3.6 Hide **Edit geometry** for a composite route and keep title/description editing available.
- [ ] 3.7 Pass every owner route from `app/(public)/my/routes/page.tsx` to the panel; derive the eligible children from the `isComposite` flag.

## 4. Verification

- [ ] 4.1 Run `npm run tsc`.
- [ ] 4.2 Run `npm run lint` and targeted `npx eslint` for the touched `app/_data`, `lib`, and `components/track-pages` files.
- [ ] 4.3 Run `npx tsx scripts/check-route-composition.ts` — the pure plan keeps its current cases.
- [ ] 4.4 Run `npx openspec validate --changes --strict`.
- [ ] 4.5 Ask the owner to run `npm run build` locally and report the result.
- [ ] 4.6 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`.
