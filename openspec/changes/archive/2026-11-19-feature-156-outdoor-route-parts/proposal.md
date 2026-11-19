# Proposal

## Why

`Route.isPart` exists and every attach path already refuses an ingredient route, but nothing in the product can set the flag. As a result a lead-in or a lead-out that only exists to be a segment of a composite still clutters the route library and every workout picker next to the routes an owner actually attaches.

This slice finishes the ingredient model: the owner marks a route as a part, parts leave the pickers and the default library view, the builder still offers them as segments, and the flag can be cleared again under guard.

## What Changes

- Add an owner action that sets or clears `Route.isPart`.
- Marking a route as a part is refused while the route is attached to a track or is itself a composite parent. Clearing the flag is always allowed.
- `getOwnerRoutes` gains `includeParts` (default `false`) and `RouteListItem` exposes `isPart`; every picker keeps calling it without the option, so parts disappear from workout creation, the quick run/walk dialog, the administrative picker, and the change-route control.
- `/my/routes` requests every route, hides parts by default, shows a **Part** badge, and offers a **Show parts** filter that reveals them.
- The composition builder keeps offering parts as segments, because it already receives the full list from `/my/routes`.
- No schema change and no migration: the column and its index already exist.

## Non-goals

- The gaps research, per-segment colours, or multiple polylines.
- Promoting a part automatically when it is used by a composition; the owner clears the flag explicitly.
- Parts in public surfaces — routes are private, and parts never appear there.
- Localizing the route library.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-routes`: the owner manages an ingredient flag, the library hides parts behind a filter, and pickers exclude them while the builder still offers them.

## Impact

- `app/_data/routes.ts` — `includeParts`, `isPart` on the list item, and the owner action with its guards.
- `components/track-pages/routes-panel.tsx`, `routes-columns.tsx` — the filter, the badge, and the mark/clear action.
- `app/(public)/my/routes/page.tsx` — request every route for the library.
- No schema, migration, API, or dependency changes.
