# Design

## Context

`feature-127-route-library` introduces `Route` (geometry + GPX file, no recording data) and links tracks to it. This change adds the owner-facing surface for that model. It is deliberately separate so the model change can be reviewed and shipped on its own: without this page the feature still works, because a route is created inside the track dialog.

The existing `/my/*` pages (`app/(public)/my/tracks`, `/my/workouts`, `/my/gear`) share a layout and a data-fetching style; `/my/routes` follows them rather than inventing a new pattern.

## Decisions

**List payload.** `getOwnerRoutes()` returns `id`, `title`, `description`, `createdAt`, `updatedAt`, a small preview (first and last point, or a flag when geometry is missing), and `trackCount`. The count is a Prisma `_count` on `tracks`; the page does not load tracks themselves.

**Editing.** Rename and description are inline actions. Geometry editing reuses the map editor from the track dialog, opening with the route's stored points. The update action returns `linkedTrackCount`; when it is greater than one the dialog requires an explicit confirmation before saving, and the copy names the number. One linked track needs no confirmation — that track is the route's only consumer.

**Deletion.** `deleteRoute` counts linked tracks first and returns a conflict result instead of letting a foreign key error escape. `onDelete: Restrict` on `Track.routeId` is the database backstop. The row shows the delete action disabled with the reason when the count is non-zero.

**Menu.** `/my/routes` is added to the same user-menu definition as `/my/tracks` and `/my/workouts`, with the same access rule: signed-in owner only. No new permission.

**Localization.** All new copy goes through the existing locale resources; the route library is owner-facing and belongs with the rest of `/my/*`.

## Rejected alternatives

- *Put the library inside the track dialog.* It is where routes are first created, but rename and delete do not belong in a creation flow, and a dialog cannot show a growing library.
- *Allow deleting a route with tracks by detaching them first.* It would silently strip geometry from existing tracks; the owner must delete or relink those tracks deliberately.
- *Show the full track list per route.* The count answers the warning's question; a track list is a different surface and a different query.
