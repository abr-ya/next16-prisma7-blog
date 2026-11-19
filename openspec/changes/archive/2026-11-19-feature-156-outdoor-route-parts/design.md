# Design

## Context

`Route.isPart` (default `false`) and the attach guards shipped with `feature-152`: `createTrackFromRoute`, `createQuickRouteWorkout`, and `attachRouteToTrack` refuse an ingredient route. `feature-155` made a lead-in and a lead-out a normal way to build a route, which is exactly the shape that creates small part routes.

There is no setter, no read flag on the library item, and no filtering, so a part behaves like a standalone route everywhere a person looks.

## Read Model

`getOwnerRoutes` gains an options argument:

```ts
getOwnerRoutes({ includeParts = false } = {})
```

The default keeps today's pickers free of parts without touching their call sites: `/my/tracks`, `/my/workouts`, `/admin/tracks`, the quick dialog's route list, and the change-route control on a public track page all call it plainly. `/my/routes` calls it with `includeParts: true` so the library can show everything.

`RouteListItem` gains `isPart`, mapped from the column. `getRouteById` and `getRouteCompositionSegments` are unchanged; a part is still a normal route for its own detail and preview.

## The Owner Action

`setRoutePart(routeId, isPart)` in `app/_data/routes.ts`, owner-scoped and async like the other route actions. It writes one flag, so it needs no upload, no trust gate, and no transaction.

Guards:

- setting the flag on a route used by one or more tracks is refused — a part must never be a workout's geometry, and the existing attach guard should not have to clean up an attached part;
- setting the flag on a route that has a composition is refused — a composite parent is a route an owner attaches, not an ingredient;
- clearing the flag is always allowed, including for a route that is currently a segment of a composition;
- a foreign or missing route answers not found.

After a successful write the action revalidates the route paths, the same way a rename does.

## Library

`/my/routes` passes every route to the panel. The panel keeps a `showParts` toggle, default off, and filters rows client-side; the toolbar shows the toggle with a count of hidden parts when there are any. Marking a route as a part auto-enables the toggle, so the row does not vanish under the owner's cursor; the success toast also says that parts are hidden.

The title cell gains a small **Part** badge next to the title, so a revealed part is distinguishable from a standalone route. The actions cell gains a puzzle-icon button: **Mark as part** for a standalone route, **Make standalone** for a part. A refusal from the action is a toast; the list refreshes on success.

The composition builder is unchanged: it receives the full list from `/my/routes`, and its own rule already allows any route without a composition as a segment, parts included.

## Pickers

Because the default stays `isPart: false`, every existing picker automatically stops offering parts once the flag can be set. The inline **Laps** field therefore can only start from a standalone route; a part remains reachable where it belongs — inside the builder's segment selector.

## Risks

- **A route disappearing after it is marked.** Mitigated by auto-revealing the filter and by the toast.
- **An attached part.** Prevented by the guard; the attach paths already refuse a part when the flag is set first.
- **A composite parent hidden as a part.** Prevented by the guard.
- **Filter state and pagination.** The DataTable paginates the filtered rows, so hiding parts can change the page count; the panel resets nothing else and the toggle is client-side.
- **Stale pickers after a change.** `revalidateRoutePaths` already covers `/my/routes`, `/my/tracks`, and `/my/workouts`; the admin track page reloads on navigation.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx openspec validate --changes --strict`, and a production build. Browser checks are deferred to a manual QA candidate and require no new data: mark an unused route as a part, confirm it leaves the workout and quick-run pickers, confirm the builder still offers it as a segment, confirm **Show parts** reveals it with the badge, confirm clearing brings it back to the pickers, and confirm an attached route or a composite parent is refused. A data check confirms `isPart` in the row.
