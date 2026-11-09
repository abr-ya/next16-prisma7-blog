# Tasks

## 1. Schema and migration

- [x] 1.1 Add `TrackGeometryState` (`PENDING` / `READY`), `Track.geometryState` with default `READY`, and nullable `Track.privateNote` to `prisma/schema.prisma`; verify `npx prisma validate` and `npx prisma generate` pass.
- [x] 1.2 Create a forward migration that adds the enum and columns, replaces `Track_geometry_source_check` with the pending/ready branches, and adds the publish guard `status <> 'PUBLISHED' OR geometryState = 'READY'`; verify existing rows read `READY` and a `PENDING` row with no file/route is accepted.
- [x] 1.3 Verify the database rejects a `READY` row with no geometry, a row with both file and route, and a `PENDING` row that carries a file or route.

## 2. Data access and actions

- [x] 2.1 Add `geometryState` to the shared track list select and `privateNote` to an explicit owner-only projection; verify the owner workouts query includes the note while `getAllTracks` used by `/admin/tracks` and the public selects do not.
- [x] 2.2 Add `createDraftWorkout(input)` in `app/_data/tracks.ts`: walking activity type, trust gate, track quota, gear validation, fractional minutes to seconds, optional note, generated title/slug, `DRAFT` + `PENDING` + `TRAINING` + `timeSource = null`; verify each validation refusal returns the documented code.
- [x] 2.3 Add `attachRouteToTrack(trackId, routeId)` that validates owner and `PENDING`, sets `routeId`, clears file fields, and moves the row to `READY` with `timeSource = MANUAL` in one transaction; verify another owner's route and a non-pending track are refused.
- [x] 2.4 Make the existing upload/update path set `geometryState = READY` when a file is attached to a pending draft; let the existing parse set `timeSource = GPX` and the parsed recording time when the file has usable timestamps, and keep the draft's start, duration, and timezone with `timeSource = MANUAL` when it does not; verify both branches.
- [x] 2.5 Enforce the publish guard in the track update action; verify a `PENDING` track cannot be saved as `PUBLISHED`.
- [x] 2.6 Add `geometryState: "READY"` to the public list and detail queries; verify a `PUBLISHED` + `PENDING` row is not returned.

## 3. Owner UI

- [x] 3.1 Add the **Add draft walk** action on `/my/workouts`, visible only when the walking activity type is active and worded; verify the other activity types and the admin surface do not show it.
- [x] 3.2 Build the draft dialog with a start date-time, duration in minutes (decimal allowed), private note, and walking gear select with the preferred gear preselected; verify the form refuses a missing start or duration and saves the note and gear.
- [x] 3.3 Show the draft in the workouts table with the `Draft` status, an incomplete-geometry indicator, distance `—`, and the entered duration; verify it appears in the matching ISO week and month/year/custom filters.
- [x] 3.4 Add the completion actions to the draft edit surface: upload GPX, choose an existing route, create a new route; verify each moves the draft to `READY` and that a route becomes primary.
- [x] 3.5 Show the private note on owner edit surfaces and on the owner's published track page; verify it is absent for non-owner viewers, from the public list payload, and from `/admin/tracks` and its edit dialog.

## 4. Validation

- [x] 4.1 Run `npm run tsc` and confirm it passes.
- [x] 4.2 Run targeted ESLint on the changed components and `lib` files, and confirm it passes.
- [x] 4.3 Run `openspec validate "feature-141-outdoor-workout-drafts" --strict` and confirm it passes.
- [x] 4.4 Ask the owner to run `npm run build` locally and confirm it passes.

## Workflow follow-up

- Sync the `outdoor-tracks` delta into the main spec and archive the change after review.
- Add `feature-142` and `feature-143` to the backlog with high priority before leaving the branch.
- Move `feature-141-outdoor-workout-drafts` to the feature history on archive.
- The deferred browser checks are tracked as `feature-141-workout-drafts-manual-qa` in the backlog.
