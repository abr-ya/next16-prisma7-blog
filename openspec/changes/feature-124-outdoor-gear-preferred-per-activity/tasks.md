# Tasks

## 1. The model

- [ ] 1.1 In `prisma/schema.prisma`, add `model GearPreference` with `userId String`, `activityTypeId String`, `gearId String`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt @updatedAt`, the three relations (`user User @relation(..., onDelete: Cascade)`, `activityType TrackActivityType @relation(..., onDelete: Cascade)`, `gear Gear @relation(..., onDelete: Cascade)`), `@@id([userId, activityTypeId])`, and `@@index([gearId])`. Add the back-relations `gearPreferences GearPreference[]` to `model User`, `model TrackActivityType`, and `model Gear`. Verify with `npx prisma validate` that the schema parses and that all three relations are declared on both sides.
  - The three `Cascade` choices are recorded in `design.md`, decision 2 — in particular, the activity-type deletion flow (`app/_data/track-activity-types.ts:83`) counts only tracks, and a preference must not turn its delete into an unchecked foreign-key violation.
- [ ] 1.2 Run `npx prisma generate`. Verify that `GearPreference` is exported and that `Prisma.GearPreferenceGetPayload` resolves.
- [ ] 1.3 Create the migration `prisma/migrations/<timestamp>_add_gear_preferences/migration.sql`. Generate the SQL with `npx prisma migrate diff --from-schema <old-schema> --to-schema <new-schema> --script` and apply it with `npx prisma migrate deploy` — `npx prisma migrate dev` will refuse to run because `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied, and it offers a database reset. **Do not reset the database.** Verify that the table, its primary key, its index, and its three foreign keys exist and that no existing table was altered and no existing row changed.
- [ ] 1.4 Verify the migration by hand against `npx prisma migrate diff --from-schema <the applied schema> --to-schema prisma/schema.prisma --script`. The expected script creates one table and touches nothing else.

## 2. The data layer

- [ ] 2.1 In `lib/gear.ts`, export the pure compatibility test shared by the attachment path and the preference path: an unclassified gear record (no activity types) fits any activity type, a classified one fits only the types it carries, and a track or type that is empty fits anything. Verify that the same rule the track form applies is the one the preference action applies.
- [ ] 2.2 In `app/_data/gear.ts`, add `getOwnerGearPreferences()`: it resolves the owner through `requireActionUser()` and returns the owner's preferences as a map from activity type id to gear id, reading only that owner's rows. Verify that the owner id is never taken from the caller and that another owner's preferences are never returned.
- [ ] 2.3 In `app/_data/gear.ts`, add `setPreferredGearForActivityType({ activityTypeId, gearId })`: it resolves the owner, checks that the activity type is active through `getTrackActivityTypeById`, reads the gear with `findFirst({ where: { id: gearId, userId } })`, applies the shared compatibility test, and then writes the preference — an upsert on `(userId, activityTypeId)`, so changing the preference is an update of one row and never a window without a preference. It returns the module's discriminated result shape. Verify that a gear item owned by somebody else, a gear item that does not fit the type, and an unknown or inactive type are each refused with a message that says which rule failed.
- [ ] 2.4 In `app/_data/gear.ts`, add `clearPreferredGearForActivityType(activityTypeId)`: it resolves the owner and deletes that owner's preference row for the type. Verify that clearing a type with no preference is a no-op and that another owner's preference is untouched.
- [ ] 2.5 In `app/_data/gear.ts`, revise `updateGear`: after the new activity-type set is written, drop every preference of that gear record whose activity type is no longer on the record. Verify that removing a type from a gear record clears that type's preference in the same save, that the preferences for the types that remain are kept, and that the preferences of other gear records are untouched.
- [ ] 2.6 Verify the cleanup also holds when the gear record is deleted: the `Cascade` on the preference's gear foreign key removes the preference rows. Verify that no preference survives the deletion of the gear record it points at.

## 3. The quick upload dialog

- [ ] 3.1 The quick upload dialog (`components/track-pages/quick-workout-upload-dialog.tsx`) takes the owner's preferences as a prop and preselects the preferred gear for the dialog's activity type when there is one. Verify that opening the dialog for a walk preselects the walking shoes, and that a type with no preference preselects nothing.
- [ ] 3.2 Add the "remember these shoes for walks" control to the dialog. It is **off by default**, and it is only offered when a gear item is selected. Verify that it is off on open, that turning it on and saving makes the selected pair the preferred one for that activity type, and that saving with it off leaves the preference unchanged.
- [ ] 3.3 When the owner saves with the control on, the save writes the attachment and the preference together — the workout carries the pair, and the pair becomes the preferred one for the type. Verify that a failure of either half leaves the other unwritten.
- [ ] 3.4 The preselection never overrides the owner's choice for a single workout: picking another pair and saving with the control off attaches the picked pair and leaves the preference alone. Verify both.
- [ ] 3.5 The control's label names the activity type in the interface language, from the wording dictionary `feature-123` adds. Verify it in Russian and in English.

## 4. The gear page

- [ ] 4.1 The gear list (`components/admin-pages/gear-columns.tsx`) marks the preferred item for each activity type with a badge that names the type in the interface language, using `formatGearActivityTypeName`. Verify that the badge appears on the preferred item and on no other item.
- [ ] 4.2 The badge carries a control that clears the preference, calling `clearPreferredGearForActivityType`. Verify that clearing removes the badge and that the quick upload for that type then preselects nothing.
- [ ] 4.3 The badge reads from the owner's preference map, which the page fetches in the same `Promise.all` as the gear list. Verify that the preference map never reaches any other page.

## 5. The pages

- [ ] 5.1 In `app/(public)/my/workouts/page.tsx`, fetch the owner's preferences and pass them to the panel, which hands them to the quick upload dialog. Verify that the dialog preselects the preferred gear.
- [ ] 5.2 In `app/(public)/my/gear/page.tsx`, fetch the owner's preferences and pass them to the gear panel. Verify that the badges render.
- [ ] 5.3 Leave `app/admin/tracks/page.tsx` and the administrative track panel unchanged: no preference map is fetched there, so nothing about a gear record reaches that surface. Verify by reading the rendered admin payload — no preference and no gear name.
- [ ] 5.4 Leave the public read path unchanged: no public query selects the preference. Verify that a published track page renders exactly as before.

## 6. Validate

- [ ] 6.1 `npm run tsc` — passes clean.
- [ ] 6.2 `npx eslint lib/gear.ts app/_data/gear.ts components/track-pages/quick-workout-upload-dialog.tsx components/admin-pages/gear-columns.tsx "app/(public)/my/gear/page.tsx" "app/(public)/my/workouts/page.tsx" --quiet` — clean.
- [ ] 6.3 `npm run lint` — clean.
- [ ] 6.4 `npx openspec validate feature-124-outdoor-gear-preferred-per-activity` — valid.
- [ ] 6.5 `npm run build` — the user runs the build; not run by the agent. The owner runs it and records the result here.

## 7. Browser check

- [ ] 7.1 `/my/workouts`: open the quick upload for a walk, pick a pair of shoes, tick "remember these shoes for walks", and save. The workout carries the pair, and the next quick upload for a walk preselects it.
- [ ] 7.2 Open the next quick upload, pick a *different* pair, save with the control off. The workout carries the new pair and the preference still points at the first one.
- [ ] 7.3 `/my/gear`: the preferred item shows the badge, and clearing it removes the badge and the preselection.
- [ ] 7.4 Edit the preferred gear item and remove the activity type from it. The badge for that type disappears and the quick upload preselects nothing for it.
- [ ] 7.5 `/admin/tracks`: no gear name and no preference reach the page.

## 8. Docs

- [ ] 8.1 `openspec/backlog.md`: the `outdoor-gear-preferred-per-activity` candidate row becomes the `In Progress` row `feature-124-outdoor-gear-preferred-per-activity` at promotion time (done when this change was created).
- [ ] 8.2 The manual browser checks that could not be run are filed as a candidate in `openspec/backlog.md` rather than left open here.

## Not in this change

- Remembering the *last* used pair — the owner moved away from that deliberately.
- A global default across activity types.
- Any public or administrative exposure of the preference.
- Automatic promotion of a pair into a preference.
- Mileage, wear, and lifecycle statistics.
