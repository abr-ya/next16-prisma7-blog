# Design

## Context

The repo has no place-like model at all: `prisma/schema.prisma` holds `Gear`, `GearPreference`, `Route`, `Track`, and nothing that stores "a named coordinate" for an owner.

The manual route flow today:

- `components/track-pages/routes-panel.tsx` renders `RouteFormDialog` (create mode) for **New route** at `/my/routes`.
- `components/track-pages/draft-workout-dialog.tsx` renders the same `RouteFormDialog` for its **create a route** action.
- `RouteFormDialog` renders the text fields plus a `TrackEditor`, and submits through `createRouteFromPoints` after the owner places at least two points.
- `TrackEditor` owns the ordered point list in its own `useState`. It reads `initialPoints` **once, at mount** — there is no effect that watches it and no imperative setter. Its only outward channel is `onChangePoints`, which the parent (`RouteFormDialog`) uses to hold the same list.
- `Route` stores geometry only: a GPX file, parsed metadata, a title, a description, an owner. It has no start-point field, and the route's start is implicitly the first point of the geometry.

The reference implementation for an owner-scoped private list is `app/_data/gear.ts` (owner from the session, `where: { id, userId }` on every mutation, `{ ok: true, ... } | { ok: false, code, message }` results) with `components/admin-pages/gear-panel.tsx` as its panel (`DataTable`, `useDeleteRowConfirm`, `ConfirmDialog`, toasts).

Constraints that shape the approach:

- The owner resolves from the session on the server; the client never sends an owner id.
- Maps are Leaflet via `react-leaflet`, loaded with `dynamic(..., { ssr: false })`; the OSM tile URL is hardcoded in the existing map components.
- The `/my` pages are owner-only (`requireAuth()`, `dynamic = "force-dynamic"`), listed in the user menu through the `navigation` namespace, and titled through the `workspace` namespace.
- The route form's own strings are hardcoded English today; the gear panel hardcodes English too, while page titles use `workspace.pages.*`.

## Goals / Non-Goals

**Goals:**

- A durable, owner-scoped place list that any other feature can read later (a trip start, a hike note) without changing its schema.
- The start of a manual route chosen from that list in one action, without the owner hunting the coordinate on the map.
- One implementation of the picker that serves both call sites of the shared route form.
- The privacy of the list as a property of the data layer, not of the surface that shows it.

**Non-Goals:**

- Editing the route geometry's first point *from* the saved place (the place decides the first point once; afterwards the marker is an ordinary map point the owner may drag or delete).
- Turning `TrackEditor` into a controlled component, or changing its props for every other caller.
- Translating the route form's existing hardcoded strings — the new picker strings are translated, the old ones are left as they are.
- Any public surface for saved places, and any link from a route or a track back to the place it started from.

## Decisions

### 1. A new owner-managed table, not a list derived from history

`FavoritePlace` gets its own table:

```prisma
model FavoritePlace {
  id        String   @id @default(uuid())
  name      String
  latitude  Float
  longitude Float
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
  updatedAt DateTime @default(now()) @updatedAt

  @@index([userId])
}
```

**Why:** the list is an explicit statement of intent ("this is where I start"), which no history query can express — history has no names and no way for the owner to say which of forty start points is *the* one. The owner curates it.

**Alternative considered:** derive the candidate list from the owner's routes and tracks (their first geometry points). Rejected — no names, no dedup, no way to rename, and it silently changes under the owner.

**Alternative considered:** a join table `RouteToFavoritePlace` so a route could keep pointing at the place it started from. Rejected — the route's geometry already carries the start, so the link would be a second source of truth that goes stale the moment the owner drags the first marker. The place decides the start once, at creation time; the geometry owns it afterwards.

### 2. The picked place becomes the first geometry point; no route field is added

Choosing a place in the route form puts that coordinate at the head of the form's point list. The rest of the owner's points keep their order after it. `Route` gains no column.

**Why:** the route's start is already the first point of its geometry — there is nothing else it could mean. Storing `startPlaceId` on `Route` would add a column that duplicates the geometry and that the route editor would have to keep in sync.

### 3. The picker sits in the shared `RouteFormDialog`, in create mode only

`RouteFormDialog` is mounted in two places (the route library and the draft workout dialog), so the picker is implemented once, in that component. The dialog's edit mode renders no map at all, so the picker is not offered there.

**Why:** one implementation, both entry points get it, and the behavior is identical in both.

### 4. The parent prepends the coordinate and remounts the editor with a `key`

`TrackEditor` reads `initialPoints` only at mount, so a parent cannot push a new first point into a mounted editor. The approach used by `route-geometry-dialog.tsx` — remount the editor with a new `key` so new initial points apply — is reused here: `RouteFormDialog` prepends the picked coordinate to its own `points` state and bumps a `key` on the `TrackEditor`.

**Why:** it is the established pattern in this codebase, and it needs no change to a shared component that other callers depend on.

**Alternatives considered:**

- Make `TrackEditor` controlled (the parent owns the points). Rejected — a wider change to a shared component, with every other caller re-shaped, for one caller's need.
- Add an effect to `TrackEditor` that syncs `initialPoints` into its state when the prop changes. Rejected — it changes the contract for every caller, and the prop is documented as "read once at mount"; the `key` remount is the honest version of that contract.

**Consequence:** the remount resets the editor's selected point and the map re-centers on the new first point at zoom 13 — which is what the owner wants to see after picking a place.

### 5. The route form reads the owner's saved places itself, when it opens

The picker reads the list through the owner-scoped server read when the dialog opens in create mode, and renders the control only when the list is non-empty.

**Why:** the list is needed in two call sites, and threading it down as a prop means a prop chain through two different client trees for one read. The read is owner-scoped on the server, so the client cannot widen it.

**Alternative considered:** pass the list down from both server pages as a prop. Rejected — two prop chains, and the draft workout dialog would have to be re-wired when the dialog opens and closes.

### 6. The place form reuses the editor map with a single point

The saved-place form is a name field plus one coordinate, picked by clicking the map. It wraps the existing `TrackEditorMap` with exactly one point: the wrapper turns the map's "add a point" event into "replace the single coordinate". With one point the map already behaves as needed — one marker, no polyline, centered on that point at zoom 13.

**Why:** the map, the marker, the drag handler, and the locate button already exist and work.

**Alternative considered:** reuse the whole `TrackEditor`. Rejected — it is a multi-point editor: it computes a distance across consecutive points, it shows an "at least two points" warning, and its point list assumes an ordered route. A saved place is one coordinate.

### 7. The place list page follows the gear page's shape

`/my/places` is a server page like `/my/gear`: `requireAuth()`, `dynamic = "force-dynamic"`, `buildPageMetadata`, the title from `workspace.pages.myPlaces`. Its panel is a client component like `GearPanel`: a `DataTable` of the owner's places with rename and delete, `useDeleteRowConfirm` + `ConfirmDialog` for the delete, toasts for the outcome, and the same empty-state block the gear panel uses.

**Why:** the owner-facing private tables in this repo already look like this. A second shape for the same kind of page would be noise.

### 8. The data layer mirrors `app/_data/gear.ts`

`app/_data/favorite-places.ts` exposes `getOwnerFavoritePlaces`, `createFavoritePlace`, `updateFavoritePlace` (rename), `deleteFavoritePlace`. The owner comes from `requireActionUser()`; every mutation reads its row with `where: { id, userId }`; results are `{ ok: true, ... } | { ok: false, code, message }` with the code union `"VALIDATION" | "NOT_FOUND" | "UNAUTHORIZED"`; messages are English; `revalidatePath("/my/places")` after every mutation.

**Why:** one convention for owner-scoped private data, already proven by the gear module.

### 9. Strings: new keys in `workspace` and `navigation`; existing hardcoded copy is left alone

The page title is `workspace.pages.myPlaces`; the user-menu entry is `navigation.myPlaces`; the picker and the place panel's own strings are new keys in the `workspace` namespace (en + ru). The route form's existing hardcoded English (title/description labels, toasts) and the gear panel's hardcoded copy are not translated in this change.

**Why:** the new UI should not ship untranslated, but re-translating a whole existing dialog is a separate, larger change.

### 10. No trust gate on saved places

The place list is a private personal list, like gear: it has no public surface, it publishes nothing, and it costs one database row. `requireTrustGatedAction` is not applied.

**Why:** the gate exists to throttle abuse on actions that reach other users (likes, comments, uploads, trip creation). Nothing here reaches anybody else.

## Risks / Trade-offs

- **[The editor remount drops the owner's selected point and recentres the map]** → the new first point is the place the owner just picked, and the point list shows it as `#1` immediately; the owner can re-select any point. The behaviour is the same as re-opening the route geometry dialog today.
- **[The draft workout dialog mounts the route form without a `key`, so its point state survives close and reopen]** → a place picked in one session would still be there in the next. Fix: give the `RouteFormDialog` in `draft-workout-dialog.tsx` a `key` (or clear the points on open) so each session starts clean. The route library's own mount is already keyed.
- **[A long place name overflows the picker]** → the entry truncates and shows the full name in its title attribute.
- **[A place's coordinate goes stale — the trailhead moves, the parking lot closes]** → the place stores only a coordinate, so the owner can drag it on the map and save it again; there is no address to refresh, by design.
- **[The list grows long]** → the panel paginates the table the way the gear panel does; the picker lists every place, which stays usable at the scale of "where I usually start".
- **[Renaming a place does not rename it anywhere else]** → there is nowhere else: the place is not referenced by routes or tracks.

## Migration Plan

1. Prisma schema change: the `FavoritePlace` model and the `User.favoritePlaces` relation.
2. One migration that creates the table and its owner index. No existing table is touched, no data is backfilled, and no backfill is needed — the list starts empty for every owner.
3. Rollback is dropping the table; because nothing references a place, no route, track, or user row is affected.

## Open Questions

None. The remaining unknowns (the exact wording of the picker labels) are cosmetic and can be settled while the strings are written.
