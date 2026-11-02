# Proposal

## Why

A track currently owns everything at once: the GPX file, the parsed geometry, the recording start and duration, the gear, and the activity type. A route that the owner walks or runs more than once therefore has to be drawn again for every entry, and every redraw becomes another throwaway synthetic GPX. The workspace has no first-class object for "the shape of this route", even though that shape does not change between two trainings on it.

The manual creation path is the only one affected: an uploaded GPX still arrives with its own file, its own parsed geometry, and its own recording data, and that is the main way tracks are made.

## What Changes

- Introduce `Route`: geometry only — a GPX file, its parsed metadata, and a title and description. No date, no duration, no gear, no activity type.
- A track may resolve its geometry from a linked route instead of owning it. Exactly one source applies at a time: the track's own file and metadata, or the linked route's.
- Manual track creation becomes "create a route or pick an existing one, then enter the training data", with the recording start and the duration required before the track can be saved.
- Rows created by the old place-points-on-a-map path are migrated into routes and their tracks are linked to them; no track row is deleted.
- A route edit reaches every linked track, because all of them read the same geometry.

## Capabilities

### New Capabilities

- `outdoor-routes`: a route as geometry only — created from placed points and serving as the geometry source for linked tracks. The owner-facing library page is `feature-128-my-routes-page`.

### Modified Capabilities

- `outdoor-tracks`: a track's geometry has exactly one source, and manual track creation requires a route plus complete training data.

## Impact

- Prisma schema and a forward migration: new `Route` model, nullable `Track.routeId`, nullable `Track.fileAssetId`, and a check constraint that keeps the two geometry sources mutually exclusive.
- Data layer: `app/_data/tracks.ts` (geometry resolution, route CRUD, track creation), `app/_data/hikes/queries.ts` and `app/_data/hikes/internal.ts` (geometry reads for trip surfaces).
- Admin and owner UI: `components/track-pages/track-editor.tsx` (route selection and required training data) and `components/admin-pages/tracks-admin-panel.tsx` (geometry resolution). No new page.
- Uploaded-GPX tracks are unchanged in behavior: same file, same metadata, same public pages, same slug.

## Non-goals

- No `/my/routes` library page in this change — listing, renaming, and deleting routes is `feature-128-my-routes-page`.
- No per-track geometry editing independent of the route; a divergent track would fork into a new route.
- No public route pages, no sharing a route with another user, and no borrowing another owner's route.
- No removal of `TrackKind` or `TrackTimeSource`, and no merge of `/my/tracks` with `/my/workouts`; those are follow-up cleanup slices.
- No "save this uploaded track as a route" action.
- The recording start and duration become required in the manual form, but their database columns stay nullable, so existing rows are not forced through a backfill.
