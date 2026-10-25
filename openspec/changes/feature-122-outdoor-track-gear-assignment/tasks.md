# Tasks

## 1. The model

- [x] 1.1 In `prisma/schema.prisma`, add to `model Track` the field `gearId String?` and the relation `gear Gear? @relation(fields: [gearId], references: [id], onDelete: Restrict)`, and add the back-relation `tracks Track[]` to `model Gear`. Add `@@index([gearId])` next to the other `Track` indexes. Verify with `npx prisma validate` that the schema parses and that both sides of the relation are declared.
  - The `Restrict` choice is recorded in `design.md`, decision 2 — the deletion of an attached gear item is refused, not silently unpaired.
- [x] 1.2 Run `npx prisma generate`. Verify that `Gear` is exported with the `tracks` back-relation and that `Prisma.TrackGetPayload` resolves for a select that includes `gear`.
- [ ] 1.3 Create the migration `prisma/migrations/<timestamp>_add_track_gear_assignment/migration.sql`. Generate the SQL with `npx prisma migrate diff --from-schema <old-schema> --to-schema <new-schema> --script` and apply it with `npx prisma migrate deploy` — `npx prisma migrate dev` will refuse to run because `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied, and it offers a database reset. **Do not reset the database.** Verify that the `gearId` column, its index, and its foreign key exist and that no existing table was altered and no existing row changed.
  - The migration file is written at `prisma/migrations/20261025210000_add_track_gear_assignment/migration.sql` with exactly the three statements the diff produced (one nullable column, one index, one foreign key). The apply step is the owner's — the agent has no access to the database.
- [ ] 1.4 Verify the migration by hand against `npx prisma migrate diff --from-schema <the applied schema> --to-schema prisma/schema.prisma --script`. The expected script adds one nullable column, one index, and one foreign key, and touches nothing else.

## 2. The data layer (`app/_data/tracks.ts`)

- [x] 2.1 Extend `TrackActionValues` with `gearId?: string | null` and document the three states next to the field: `undefined` leaves the attachment alone, `null` clears it, an id sets it. Verify the type compiles under `npm run tsc`.
- [x] 2.2 Add the module-private `ensureEligibleTrackGear({ gearId, userId, activityTypeId })`: it returns `null` for an empty id, reads the gear with `findFirst({ where: { id: gearId, userId } })` selecting the id and its activity types, refuses a missing row with the same message an unknown id gets, and refuses a gear item whose activity types are non-empty and do not contain `activityTypeId`. Put the pure part of that rule — an unclassified gear item fits any activity type, a classified one fits only the types it carries — in `lib/gear.ts` as a shared function, so the preference path of `feature-124` applies the same rule rather than a second copy of it. Verify that a gear item owned by another user is refused with the unknown-id message and that its existence is not disclosed.
- [x] 2.3 Apply the guard in `createTrack`: resolve the gear with `ensureEligibleTrackGear` and write it on the created row. Verify that a create without `gearId` still produces an unassigned track and that `createTrackAndAttachToHike` (`app/_data/hikes/mutations.ts:572`) keeps producing gear-free tracks.
  - The same guard was added to `createManualTrack` as well: the "Place on map" tab of the same form renders the gear field, so a create through that path would otherwise drop the selection silently. The refusal there is a `VALIDATION` result, the shape the action already answers with.
- [x] 2.4 Apply the guard in `updateTrack`: add `gearId` to the `findFirst` select of the existing row, compute the effective gear id (`values.gearId === undefined ? existingTrack.gearId : values.gearId`), validate that effective value against the owner and against `data.activityTypeId` — the activity type the same update writes — and write the result. Verify that an update that sends no `gearId` keeps the attachment, that `gearId: null` clears it, and that changing the activity type to one the attached gear does not fit is refused.
- [x] 2.5 Make the owner-scoped list queries able to carry the attachment: give `getAllTracks` an optional `{ includeGear?: boolean }` argument and `getOwnerWorkoutTracks` the same, each adding `gear: { select: { id: true, name: true } }` to the select only when it is asked for. Verify that the default call returns no gear field and that the exported row types resolve for both shapes.

## 3. The gear deletion guard (`app/_data/gear.ts`)

- [x] 3.1 In `deleteGear`, read the attached tracks (`_count` on the `tracks` relation, or a count query) before deleting and refuse with the module's discriminated failure shape (`{ ok: false, code, message }`) when the count is above zero. The message names the number of attached tracks. Verify that a gear item attached to a track survives the attempt and that an unattached one still deletes.
- [ ] 3.2 Verify the refusal is reached through the data layer and not only through the UI: a direct call to the action with an attached gear id returns the failure and the row still exists.

## 4. The shared gear select

- [x] 4.1 Create `components/track-pages/track-gear-select.tsx` as a client component that takes the owner's gear and the track's activity type and renders one `Select` from `@/components/index` with a "no gear" option plus the owner's gear that fits the activity type — all of the owner's gear when the activity type is empty. Verify that switching the form's activity type from "Cycling" to "Running" narrows the list to the running gear.
  - The attached item is always offered, even when it does not fit the current activity type: the owner has to be able to see what is attached and to clear it.
- [x] 4.2 Keep the select free of any gear the caller does not own: the component receives the owner's gear as a prop and never fetches. Verify that the admin track panel is never given the prop and therefore cannot render the field.

## 5. The track form and the panel

- [x] 5.1 In `components/admin-pages/tracks-admin-panel.tsx`, extend `TrackManagementPanel` with an optional `ownerGear` prop and thread it into `TrackFormDialog`. Render the gear select only when the prop is present. Verify that the dialog on `/admin/tracks` shows no gear field and that the one on `/my/tracks` does.
- [x] 5.2 Add the field to the form schema (`gearId: z.string().optional()` — an empty selection is stored as no gear) and to the submit payload, so a cleared selection is sent as `null` and a form that never touched the field sends `undefined`. Verify that opening the edit dialog on a track with gear preselects it and that saving without touching the field keeps it.
  - The three states come from the field's dirty state: the payload carries `gearId` only when the owner touched the field.
- [x] 5.3 Read the current attachment from the row the table was built from (`row.gear`), not from a second query. Verify that a track with gear opens the dialog with that gear preselected and a track without one opens it on the "no gear" option.
- [x] 5.4 Show the owner a readable label for the selection — the gear name — and keep the gear out of every table. Verify that neither the owner tables nor the admin tables show a gear column.

## 6. The pages

- [x] 6.1 In `app/(public)/my/tracks/page.tsx`, fetch the owner's gear and the tracks with the attachment: `Promise.all([getAllTracks({ includeGear: true }), getActiveTrackActivityTypes(), getOwnerGear()])`, and pass the gear to the panel. Verify that the page renders the gear field and that the payload carries the owner's own gear names only.
- [x] 6.2 Do the same in `app/(public)/my/workouts/page.tsx` with `getOwnerWorkoutTracks({ includeGear: true })`. Verify the same behaviour there.
- [x] 6.3 Leave `app/admin/tracks/page.tsx` unchanged: it keeps calling `getAllTracks()` without the projection, so no gear name reaches the admin payload. Verify by reading the rendered admin page's payload — no gear field, and the panel renders no gear control.
- [x] 6.4 Leave the public read path unchanged: `publicTrackSelect` does not select `gearId`, so no published track exposes its equipment. Verify that a published track page renders exactly as before.

## 7. Validate

- [x] 7.1 `npm run tsc` — passes clean.
- [x] 7.2 `npx eslint app/_data/tracks.ts app/_data/gear.ts components/track-pages/track-gear-select.tsx components/admin-pages/tracks-admin-panel.tsx "app/(public)/my/tracks/page.tsx" "app/(public)/my/workouts/page.tsx" app/admin/tracks/page.tsx --quiet` — clean.
- [x] 7.3 `npm run lint` — clean.
- [x] 7.4 `npx openspec validate feature-122-outdoor-track-gear-assignment` — valid.
- [ ] 7.5 `npm run build` — the user runs the build; not run by the agent. The owner runs it and records the result here.

## 8. Browser check

- [ ] 8.1 `/my/tracks`: open the edit dialog of a track, pick a pair of shoes, save, reopen — the shoes are preselected and the attachment survived the save.
- [ ] 8.2 `/my/tracks`: change the track's activity type to one the attached shoes do not fit — the save is refused with a message that names the shoes; clear the attachment and the save succeeds.
- [ ] 8.3 `/my/gear`: delete a pair of shoes that is attached to a track — the deletion is refused and names the number of attached tracks; clear the attachment and the deletion succeeds.
- [ ] 8.4 `/admin/tracks`: the track form shows no gear control, and the page payload contains no gear name.

## 9. Docs

- [x] 9.1 `openspec/backlog.md`: the `outdoor-track-gear-assignment` candidate row becomes the `In Progress` row `feature-122-outdoor-track-gear-assignment` at promotion time (done when this change was created).
- [ ] 9.2 `openspec/specs/outdoor-tracks/spec.md` and `openspec/specs/outdoor-gear/spec.md`: the requirements from the deltas in this change are merged into the live specs at archive time.
- [ ] 9.3 The manual browser checks that could not be run are filed as a candidate in `openspec/backlog.md` rather than left open here.

## Not in this change

- The quick-upload modal — `feature-123-outdoor-quick-workout-upload` attaches gear through the server path added here.
- The preferred gear per activity type — `feature-124-outdoor-gear-preferred-per-activity`.
- A gear column in the track tables, on any surface.
- Brand, model, size, and year on a gear record — the `outdoor-gear-extended-fields` candidate.
- Mileage, wear, and lifecycle statistics — nothing is computed from gear yet.
- Any public representation of the attachment.
