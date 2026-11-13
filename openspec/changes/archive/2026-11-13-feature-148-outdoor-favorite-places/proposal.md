# Proposal

## Why

Every manual route starts somewhere, and for the same owner that start is usually one of a handful of familiar spots — the park gate, the trailhead, the parking lot. Today the owner has to hunt that first coordinate on the map by hand for every new route, which is the most repetitive part of placing a route. The owner wants a private list of the places they start from, and a way to drop one of them into the manual route form as the route's first point.

## What Changes

- Add a private, owner-scoped list of **saved places** — a name and a coordinate pair each — that the owner manages on a new page at `/my/places` (create, rename, delete).
- Add a **saved-place picker** to the manual route form. When the owner picks a saved place, that place becomes the route's **first geometry point** — the route's start. The rest of the placed points keep their order after it.
- The picker lists only the signed-in owner's saved places. An owner with no saved places sees a hint that points at `/my/places` instead of an empty control.
- No new field is stored on the route. The start of a route is still the first point of its GPX geometry, exactly as it is today; the saved place only decides where that first point goes.
- The saved places are private to their owner. A place name never appears on a public page, on a route, or on a track.

### Non-goals

- **Deriving the list from workout history.** The list is managed by the owner, not inferred from where they happened to record.
- **A separate stored start point on the route.** A route keeps geometry only; the start is the first point of that geometry.
- **Addresses or reverse geocoding.** A saved place is a name the owner typed and a coordinate they dropped on a map. The system resolves no street address for it.
- **Creating or editing a saved place from the route form.** The form only picks from the list; the list is managed on `/my/places`.
- **Sharing saved places** between owners, with a track, or on any public surface.
- **Reordering or renaming the owner's whole list.** The order of the list is the order the places were added.

## Capabilities

### New Capabilities

- `outdoor-favorite-places`: the owner's private list of saved places — name plus coordinate — with the owner's own create, rename, delete, and owner-scoped reads over it.

### Modified Capabilities

- `outdoor-routes`: the manual route form gains a saved-place picker whose choice becomes the route's first geometry point; the route itself stores no new field.

## Impact

- **Data model**: a new `FavoritePlace` table (id, owner, name, latitude, longitude, timestamps) with a `User` relation and an owner index; a Prisma migration.
- **New route/page**: `/my/places`, an owner-only page in the `/my` family, listed in the user menu next to **My routes** and **My gear**.
- **Data layer**: a new owner-scoped actions module for saved places (list, create, rename, delete), following the `app/_data/gear.ts` pattern — owner resolved from the session, every mutation scoped by `where: { id, userId }`.
- **Existing surfaces**: the shared manual route form (`components/track-pages/route-form-dialog.tsx`) gains the picker, so it appears both from the route library at `/my/routes` and from the draft workout dialog's **create a route** action.
- **Map reuse**: the saved-place form reuses the existing Leaflet editor map to drop a single coordinate.
- **i18n**: a new page title in the `workspace` namespace, a new user-menu entry in the `navigation` namespace, and the picker/place labels in the `workspace` namespace (en + ru).
- **No public surface changes** — nothing about saved places reaches a public page.
