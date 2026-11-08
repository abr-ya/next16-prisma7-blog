# Tasks

## 1. Schema and migration

- [ ] 1.1 Add `TrackGeometryState` (`PENDING` / `READY`), `Track.geometryState` with default `READY`, and nullable `Track.privateNote` to `prisma/schema.prisma`; verify `npx prisma validate` and `npx prisma generate` pass.
- [ ] 1.2 Create a forward migration that adds the enum and columns, replaces `Track_geometry_source_check` with the pending/ready branches, and adds the publish guard `status <> 'PUBLISHED' OR geometryState = 'READY'`; verify existing rows read `READY` and a `PENDING` row with no file/route is accepted.
- [ ] 1.3 Verify the database rejects a `READY` row with no geometry, a row with both file and route, and a `PENDING` row that carries a file or route.

## 2. Data access and actions

- [ ] 2.1 Add `geometryState` to the shared track list select and `privateNote` to an explicit owner-only projection; verify the owner workouts query includes the note while `getAllTracks` used by `/admin/tracks` and the public selects do not.
- [ ] 2.2 Add `createDraftWorkout(input)` in `app/_data/tracks.ts`: walking activity type, trust gate, track quota, gear validation, fractional minutes to seconds, optional note, generated title/slug, `DRAFT` + `PENDING` + `TRAINING` + `timeSource = null`; verify each validation refusal returns the documented code.
- [ ] 2.3 Add `attachRouteToTrack(trackId, routeId)` that validates owner and `PENDING`, sets `routeId`, clears file fields, and moves the row to `READY` with `timeSource = MANUAL` in one transaction; verify another owner's route and a non-pending track are refused.
- [ ] 2.4 Make the existing upload/update path set `geometryState = READY` when a file is attached to a pending draft, and let the existing parse set `timeSource = GPX` and the parsed recording time; verify the parsed values replace the draft's provisional values.
- [ ] 2.5 Enforce the publish guard in the track update action; verify a `PENDING` track cannot be saved as `PUBLISHED`.
- [ ] 2.6 Add `geometryState: "READY"` to the public list and detail queries; verify a `PUBLISHED` + `PENDING` row is not returned.

## 3. Owner UI

- [ ] 3.1 Add the **Add draft walk** action on `/my/workouts`, visible only when the walking activity type is active and worded; verify the other activity types and the admin surface do not show it.
- [ ] 3.2 Build the draft dialog with a start date-time, duration in minutes (decimal allowed), private note, and walking gear select with the preferred gear preselected; verify the form refuses a missing start or duration and saves the note and gear.
- [ ] 3.3 Show the draft in the workouts table with the `Draft` status, an incomplete-geometry indicator, distance `—`, and the entered duration; verify it appears in the matching ISO week and month/year/custom filters.
- [ ] 3.4 Add the completion actions to the draft edit surface: upload GPX, choose an existing route, create a new route; verify each moves the draft to `READY` and that a route becomes primary.
- [ ] 3.5 Show the private note only on owner edit surfaces; verify it is absent from the public track payload/page and from `/admin/tracks` and its edit dialog.
- [ ] 3.6 Verify the week summary counts the draft as a workout, adds no distance, and keeps the existing distance-coverage note.

## 4. Validation

- [ ] 4.1 Run `npm run tsc` and confirm it passes.
- [ ] 4.2 Run targeted ESLint on the changed components and `lib` files, and confirm it passes.
- [ ] 4.3 Run `openspec validate "feature-141-outdoor-workout-drafts" --strict` and confirm it passes.
- [ ] 4.4 Browser-check: create a draft walk, see it in the week, complete it with a GPX, complete another with a route, and confirm the note stays private on public and admin surfaces.
- [ ] 4.5 Ask the owner to run `npm run build` locally and confirm it passes.

## Workflow follow-up

- Sync the `outdoor-tracks` delta into the main spec and archive the change after review.
- Add `feature-142` and `feature-143` to the backlog with high priority before leaving the branch.
- Move `feature-141-outdoor-workout-drafts` to the feature history on archive.
