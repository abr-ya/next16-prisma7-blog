# Tasks

## 1. Read model and action

- [x] 1.1 Add `isPart` to `RouteListItem` and map it in `getOwnerRoutes`, `getRouteById`, and their projections.
- [x] 1.2 Give `getOwnerRoutes` an options argument with `includeParts` defaulting to `false`, so every picker excludes parts without changing its call site.
- [x] 1.3 Add `setRoutePart(routeId, isPart)` in `app/_data/routes.ts`: owner scope, refuse setting the flag while the route has linked tracks or a composition, allow clearing, revalidate route paths, and return the existing result vocabulary.
- [x] 1.4 Point `/my/routes` at `getOwnerRoutes({ includeParts: true })`.

## 2. Library UI

- [x] 2.1 Add a `showParts` toggle to `components/track-pages/routes-panel.tsx`, default off, with a count of hidden parts; filter rows client-side.
- [x] 2.2 Auto-enable the toggle after a successful mark-as-part so the row does not vanish, and toast that parts are hidden.
- [x] 2.3 Add a **Part** badge next to the title of an ingredient route in `components/track-pages/routes-columns.tsx`.
- [x] 2.4 Add the mark/clear action to the row actions: **Mark as part** for a standalone route, **Make standalone** for a part; surface refusals as toasts and refresh on success.
- [x] 2.5 Confirm the composition builder still lists parts as segments and excludes composites and the edited parent.

## 3. Pickers

- [x] 3.1 Confirm every picker (`/my/tracks`, `/my/workouts`, `/admin/tracks`, the quick dialog, the public change-route control) calls `getOwnerRoutes()` without the option and therefore excludes parts.
- [x] 3.2 Confirm the inline **Laps** path cannot start from a part because the picker no longer offers it.

## 4. Verification

- [x] 4.1 Run `npm run tsc`.
- [x] 4.2 Run `npm run lint` and targeted `npx eslint` for the touched `app/_data` and `components/track-pages` files.
- [x] 4.3 Run `npx openspec validate --changes --strict`.
- [x] 4.4 Run a production build in the sandbox, or ask the owner to run it locally when the sandbox network is restricted.
- [x] 4.5 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`; they create no new routes.
