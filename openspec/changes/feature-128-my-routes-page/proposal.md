# Proposal

## Why

`feature-127-route-library` makes a route a first-class record, but reaches it only through the track creation dialog. An owner who wants to fix a route's shape, rename it, or clean up a library they no longer use has no surface for it: the only way to touch a route is to start creating a track. Routes also gain a property that needs a visible answer — several tracks can share one route, so editing or deleting it affects more than the row in front of the owner.

## What Changes

- Add `/my/routes`: the owner's route library, listing their own routes with title, description, creation date, and the number of linked tracks, plus a preview dialog that draws the route's shape.
- Let the owner create a route from placed points, rename it, edit its description, and re-place its geometry. Re-placing geometry rewrites the route's synthetic GPX file and parsed metadata together.
- Warn before a geometry edit that reaches more than one linked track, naming how many tracks will change.
- Refuse deletion while a route still has linked tracks, and say how many keep it in use. Deleting an unused route also retires its synthetic GPX file in the same transaction.
- Add the library entry to the user menu next to the existing `/my/*` destinations. The entry and the new page use English copy like those siblings; localizing the whole owner workspace is a separate follow-up.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-routes`: the owner's route library surface — listing, editing with a shared-track warning, and refusing to delete a route that is still in use.

## Impact

- New route: `app/(public)/my/routes/`, plus `updateRoute` / `deleteRoute` / `getRoutePreview` in `app/_data/routes.ts`.
- Components: a route list, a rename/description dialog, a preview dialog using the existing read-only `TrackMap`, and reuse of `TrackEditor` for geometry changes.
- No localization resources in this change; the owner workspace is localized as a separate feature.
- Depends on `feature-127-route-library` for the `Route` model, `createRouteFromPoints`, `getOwnerRoutes`, and geometry resolution.
- No schema change of its own and no change to the track creation path.

## Non-goals

- No public route pages, no sharing a route with another user, and no borrowing another owner's route.
- No usage history per track beyond the count, and no analytics on the route.
- No per-track geometry editing: a track that must diverge forks into a new route.
- No change to `/my/tracks` or `/my/workouts`; consolidating them is a separate cleanup.
