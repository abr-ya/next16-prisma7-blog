# Tasks

## 1. Data layer

- [ ] 1.1 Extend `getOwnerRoutes()` so each row carries `id`, `title`, `description`, `createdAt`, `updatedAt`, a preview hint, and `trackCount` from a `_count` select.
- [ ] 1.2 Add `updateRoute` for title, description, and placed points; return the updated row and `linkedTrackCount`; refuse with a readable code when the route does not belong to the caller.
- [ ] 1.3 Make `updateRoute` accept an explicit `confirmShared` flag and refuse a geometry change when `linkedTrackCount > 1` without it.
- [ ] 1.4 Add `deleteRoute`, returning a readable conflict result when linked tracks exist instead of surfacing a foreign-key error.

## 2. Route library page

- [ ] 2.1 Add `app/(public)/my/routes/page.tsx` following the existing `/my/*` pages: owner-only, server-loaded, same layout primitives.
- [ ] 2.2 Render the list with title, description, creation date, track count, and a geometry preview or a fallback when the route has no parseable points.
- [ ] 2.3 Add an empty state that explains what a route is and offers **New route**.
- [ ] 2.4 Add **New route**, reusing the map editor and saving through `createRouteFromPoints`; refresh the list after saving.
- [ ] 2.5 Add rename and description editing per row, routed through `updateRoute`.
- [ ] 2.6 Add geometry editing per row: open the map editor with the route's points, show the shared-track confirmation when `linkedTrackCount > 1`, and refresh the preview after saving.
- [ ] 2.7 Add the delete action, disabled with an explanation when `trackCount > 0`, and a confirmation dialog when it is zero.
- [ ] 2.8 Add `/my/routes` to the user menu next to `/my/tracks` and `/my/workouts`.

## 3. Localization

- [ ] 3.1 Add the `/my/routes` copy — page title, empty state, column labels, edit dialogs, the shared-track warning with its count, and the delete refusal — to the existing locale resources, English and Russian.

## 4. Validation

- [ ] 4.1 `npm run tsc` — expect no type errors.
- [ ] 4.2 `npx eslint app/_data/routes.ts "app/(public)/my/routes" components --quiet` — expect no errors on the changed files.
- [ ] 4.3 `npm run lint` — expect no errors.
- [ ] 4.4 `npx openspec validate feature-128-my-routes-page --strict` — expect the change to validate.
- [ ] 4.5 `npm run build` — the user runs the build locally; the agent records the result here.

## 5. Browser check (the owner's)

- [ ] 5.1 Open `/my/routes` and confirm only the signed-in owner's routes are listed, each with its track count.
- [ ] 5.2 Rename a route and confirm the new title appears in the list and in the track dialog's route picker.
- [ ] 5.3 Edit the geometry of a route used by two tracks and confirm the warning names the count before saving, then that both tracks show the new shape.
- [ ] 5.4 Edit the geometry of a route used by one track and confirm no warning appears.
- [ ] 5.5 Try to delete a route with linked tracks and confirm the disabled state and the refusal message; delete a route with no tracks and confirm it disappears from the list and the picker.
