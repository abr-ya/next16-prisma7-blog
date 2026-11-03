# Tasks

## 1. Data layer

- [x] 1.1 Confirm `getOwnerRoutes()` returns `id`, `title`, `description`, `createdAt`, `updatedAt`, `hasMetadata`, and `trackCount` from a `_count` select, and that it stays owner-scoped.
- [x] 1.2 Add `getRoutePreview(routeId)` — owner-scoped, returns `TrackMapViewModel | null` built with `toTrackMapViewModel(route.title, route.metadata)`, or `null` when the route has no parseable geometry.
- [x] 1.3 Add `updateRoute` for `title` and `description`; refuse with a readable code when the route does not belong to the caller, and revalidate `/my/routes` plus the track creation path.
- [x] 1.4 Extend `updateRoute` with placed points: rebuild the GPX with `buildSyntheticGpxBytes`, upload it with `uploadSyntheticTrackGpx`, create a new `FileAsset`, repoint `route.fileAssetId`, and rewrite `metadata` with the new `sourceFileAssetId` / `fileKey`. Mark the replaced `FileAsset` as `PENDING_DELETE` in the same transaction, and do all of it in one transaction so a failed upload or parse leaves the route unchanged.
- [x] 1.5 Make the geometry path accept an explicit `confirmShared` flag and refuse a geometry change when `linkedTrackCount > 1` without it; return `linkedTrackCount` on success.
- [x] 1.6 Add `deleteRoute`, returning a readable conflict result when linked tracks exist instead of surfacing a foreign-key error.
- [x] 1.7 Delete an unused route in one transaction: remove the `Route` row and set its `FileAsset` to `PENDING_DELETE` with `deletedAt`; return a readable error so the owner can retry the whole operation.
- [x] 1.8 Revalidate `/my/routes` and the track surfaces after a geometry change — reuse the existing track-path revalidation (`/admin/tracks`, `/my/tracks`, `/admin/files`, `/tracks`, `/hikes`) plus `/my/workouts`, exporting the helper from `app/_data/tracks.ts` if needed — so linked tracks, trip views, and public track pages show the new shape.

## 2. Route library page

- [x] 2.1 Add `app/(public)/my/routes/page.tsx` following the existing `/my/*` pages: owner-only, server-loaded, same layout primitives, English copy like its siblings.
- [x] 2.2 Render the list with title, description, creation date, and track count, using `DataTable` and the shared `ConfirmDialog` conventions.
- [x] 2.3 Add an empty state that explains what a route is and offers **New route**.
- [x] 2.4 Add **New route**, reusing `TrackEditor` and saving through `createRouteFromPoints`; refresh the list after saving.
- [x] 2.5 Add rename and description editing per row, routed through `updateRoute`.
- [x] 2.6 Add geometry editing per row: open `TrackEditor` with the route's points through `getRouteById`, show the shared-track confirmation naming the count when `linkedTrackCount > 1`, and refresh the list after saving.
- [x] 2.7 Add a per-row **Preview** action opening a dialog that renders the existing read-only `TrackMap` from `getRoutePreview`, with a fallback message when the route has no parseable geometry.
- [x] 2.8 Add the delete action, disabled with an explanation when `trackCount > 0`, and a confirmation dialog when it is zero.
- [x] 2.9 Add `/my/routes` to the user menu next to `/my/tracks` and `/my/workouts`.

## 3. Validation

- [x] 3.1 `npm run tsc` — expect no type errors.
- [x] 3.2 `npx eslint "app/(public)/my/routes" app/_data/routes.ts components --quiet` — expect no errors on the changed files.
- [x] 3.3 `npm run lint` — expect no errors.
- [x] 3.4 `npx openspec validate feature-128-my-routes-page --strict` — expect the change to validate.
- [x] 3.5 `npm run build` — the user runs the build locally; the agent records the result here. Passed on 2026-11-03.

## 4. Browser check (the owner's, positive path)

- [x] 4.1 Open **My routes** from the user menu and confirm your routes are listed with title, description, added date, and track count. Verified 2026-11-03.
- [x] 4.2 Use **New route**: place at least two points, save, and confirm the route appears with a track count of 0 and is offered by the track dialog's route picker. Verified 2026-11-03.
- [x] 4.3 Open **Preview** and confirm the dialog draws the route's shape. Verified 2026-11-03.
- [x] 4.4 Edit the title and the description and confirm the list shows the new values. Verified 2026-11-03.

The geometry edit and the unused-route delete were deferred to `outdoor-route-library-manual-qa` in `openspec/backlog.md`, together with the edge cases.
