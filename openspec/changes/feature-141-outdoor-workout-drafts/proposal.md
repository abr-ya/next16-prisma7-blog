# Proposal

## Why

The owner often knows when and what they did before any usable geometry exists: the GPS was poor, the watch has not synced, or several files need to be compared first. Today a `Track` cannot exist without a GPX file or a route, so the session cannot be recorded until the geometry is resolved. The owner needs to capture the workout now and complete its geometry later.

## What Changes

- Add `Track.geometryState` (`PENDING` / `READY`) and `Track.privateNote`.
- Allow a `PENDING` workout to exist with no file, no route, and no metadata; a `READY` workout keeps exactly one geometry source.
- Add an **Add draft walk** action on `/my/workouts` that captures:
  - the recording start date and time;
  - the duration in minutes, including fractional minutes;
  - a private note, for example “walked there and there, GPS was poor, check the watch track or pick/create a route”;
  - the shoes, using the existing walking gear preference as the default.
- Generate the draft's title and slug automatically, set `status = DRAFT`, `kind = TRAINING`, and activity type `walking`.
- Show drafts in the owner's workouts list and period filters; the distance column shows `—`, and the week summary counts the draft as a workout without adding distance.
- Complete a draft by uploading a GPX file, choosing an existing route, or creating a route. A route always becomes the primary geometry; the draft moves to `READY`.
- Keep `privateNote` owner-only: it never appears on a public page, in an admin table, or in an admin edit dialog.
- Prevent publishing a `PENDING` workout, and exclude `PENDING` rows from public track queries even if their status is changed outside the application.

## Non-goals

- Drafts for running or other activity types; walking is the first slice.
- Multiple tracks per workout and secondary files; that is `feature-142`/`feature-143`.
- Making a route primary for an existing file-based workout and demoting the file; that is `feature-142`.
- Route as secondary geometry.
- Automatic expiry or cleanup of old drafts.
- Changes to the quick workout upload path.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: the geometry-source rule gains a pending state, a new draft-workout lifecycle is added, the private note is owner-only, and public eligibility requires ready geometry.

## Impact

- `prisma/schema.prisma` and a forward migration: `TrackGeometryState` enum, `geometryState`, `privateNote`, updated geometry check, publish guard.
- `app/_data/tracks.ts`: draft create/edit/complete actions, read projections, public filters.
- `/my/workouts` and the track form/dialog: draft creation, draft badge/incomplete indicator, completion actions, private note field.
- `openspec/specs/outdoor-tracks/spec.md`: added and modified requirements.
- No changes to `/tracks` public pages beyond excluding pending rows.
