# Tasks

## 1. The model

- [x] 1.1 In `prisma/schema.prisma`, add `model GearPreference` with `userId String`, `activityTypeId String`, `gearId String`, `createdAt DateTime @default(now())`, `updatedAt DateTime @default(now()) @updatedAt`, the three relations (`user User @relation(..., onDelete: Cascade)`, `activityType TrackActivityType @relation(..., onDelete: Cascade)`, `gear Gear @relation(..., onDelete: Cascade)`), `@@id([userId, activityTypeId])`, and `@@index([gearId])`. Add the back-relations `gearPreferences GearPreference[]` to `model User`, `model TrackActivityType`, and `model Gear`. Verify with `npx prisma validate` that the schema parses and that all three relations are declared on both sides.
  - The three `Cascade` choices are recorded in `design.md`, decision 2 — in particular, the activity-type deletion flow (`app/_data/track-activity-types.ts:83`) counts only tracks, and a preference must not turn its delete into an unchecked foreign-key violation.
- [x] 1.2 Run `npx prisma generate`. Verify that `GearPreference` is exported and that `Prisma.GearPreferenceGetPayload` resolves.
- [x] 1.3 Create the migration `prisma/migrations/<timestamp>_add_gear_preferences/migration.sql`. The SQL is the one `npx prisma migrate diff --from-schema <old-schema> --to-schema <new-schema> --script` produced: one table, one index, and three foreign keys, each `ON DELETE CASCADE`. No existing table is altered and no existing row changes.
- [x] 1.4 Apply the migration with `npx prisma migrate deploy` — the owner runs it, the agent's database access is blocked. `npx prisma migrate dev` will refuse to run because `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied, and it offers a database reset. **Do not reset the database.** Verify that the table, its primary key, its index, and its three foreign keys exist and that no existing table was altered and no existing row changed.
  - The owner applied the migration on 2026-10-27; the table and its three `CASCADE` foreign keys are in place.
- [x] 1.5 Verify the applied schema by hand against `npx prisma migrate diff --from-config-datasource --to-schema prisma/schema.prisma --script`. The expected script is empty — the live database already matches the schema.
  - The owner ran it on 2026-10-27: `-- This is an empty migration.`

## 2. The data layer

- [x] 2.1 In `lib/gear.ts`, export the pure compatibility test shared by the attachment path and the preference path: an unclassified gear record (no activity types) fits any activity type, a classified one fits only the types it carries, and a track or type that is empty fits anything. Verify that the same rule the track form applies is the one the preference action applies.
  - `gearFitsActivityType` already exists in `lib/gear.ts` — feature-122 extracted it for the attachment — so no second copy of the rule is written. The preference path calls that same helper.
- [x] 2.2 In `app/_data/gear.ts`, add `getOwnerGearPreferences()`: it resolves the owner through `requireActionUser()` and returns the owner's preferences as a map from activity type id to gear id, reading only that owner's rows. Verify that the owner id is never taken from the caller and that another owner's preferences are never returned.
  - The map's value carries the gear id and the activity type's display names, so a surface can name the type without a second query — including a type that was deactivated after the preference was made.
- [x] 2.3 In `app/_data/gear.ts`, add `setPreferredGearForActivityType({ activityTypeId, gearId })`: it resolves the owner, checks that the activity type is active through `getTrackActivityTypeById`, reads the gear with `findFirst({ where: { id: gearId, userId } })`, applies the shared compatibility test, and then writes the preference — an upsert on `(userId, activityTypeId)`, so changing the preference is an update of one row and never a window without a preference. It returns the module's discriminated result shape. Verify that a gear item owned by somebody else, a gear item that does not fit the type, and an unknown or inactive type are each refused with a message that says which rule failed.
- [x] 2.4 In `app/_data/gear.ts`, add `clearPreferredGearForActivityType(activityTypeId)`: it resolves the owner and deletes that owner's preference row for the type. Verify that clearing a type with no preference is a no-op and that another owner's preference is untouched.
- [x] 2.5 In `app/_data/gear.ts`, revise `updateGear`: after the new activity-type set is written, drop every preference of that gear record whose activity type is no longer on the record. Verify that removing a type from a gear record clears that type's preference in the same save, that the preferences for the types that remain are kept, and that the preferences of other gear records are untouched.
  - The update and the cleanup share one `prisma.$transaction`. A record that becomes classified also loses the preferences for the types it does not carry; a record that stays unclassified keeps them, because an unclassified record fits every type.
- [x] 2.6 Verify the cleanup also holds when the gear record is deleted: the `Cascade` on the preference's gear foreign key removes the preference rows. Verify that no preference survives the deletion of the gear record it points at.
  - The foreign key declares `ON DELETE CASCADE` and `deleteGear` deletes the row without touching the preferences, so the database does the cleanup. The live check was deferred on 2026-10-27: it would cost the owner the only gear record they have. It rides with the manual QA row of task 8.2 as its item (a), with the rollback transaction that keeps the record.

## 3. The quick upload dialog

- [x] 3.1 The quick upload dialog (`components/track-pages/quick-workout-upload-dialog.tsx`) takes the owner's preferences as a prop and preselects the preferred gear for the dialog's activity type when there is one. Verify that opening the dialog for a walk preselects the walking shoes, and that a type with no preference preselects nothing.
  - The dialog takes the gear id for its own activity type (`preferredGearId`), and the panel reads it out of the owner's preference map. The dialog is keyed by the activity type, so another type gets its own form and its own default.
- [x] 3.2 Add the "remember these shoes for walks" control to the dialog. It is **off by default**, and it is only offered when a gear item is selected. Verify that it is off on open, that turning it on and saving makes the selected pair the preferred one for that activity type, and that saving with it off leaves the preference unchanged.
  - The control is a native checkbox inside the form, the house pattern — there is no checkbox primitive in `components/ui`. It appears only while a gear item is attached.
- [x] 3.3 When the owner saves with the control on, the save writes the attachment and the preference together — the workout carries the pair, and the pair becomes the preferred one for the type. Verify that a failure of either half leaves the other unwritten.
  - `createQuickWorkout` takes `rememberGearAsPreferred` and writes the preference with the same `createWithinVerifiedResourceQuota` transaction that writes the workout.
- [x] 3.4 The preselection never overrides the owner's choice for a single workout: picking another pair and saving with the control off attaches the picked pair and leaves the preference alone. Verify both.
  - The preference is written only when the control is on; the preselection is only a default in the gear field.
- [x] 3.5 The control's label names the activity type in the interface language, from the wording dictionary `feature-123` adds. Verify it in Russian and in English.
  - The dictionary gains `quickWorkout.activities.<key>.rememberGearLabel` per activity type, with the generic `quickWorkout.rememberGearLabel` as the fallback for a type that has no own entry. The per-activity entry is what lets the Russian wording own the case of the activity name.

## 4. The gear page

- [x] 4.1 The gear list (`components/admin-pages/gear-columns.tsx`) marks the preferred item for each activity type with a badge that names the type in the interface language, using `formatGearActivityTypeName`. Verify that the badge appears on the preferred item and on no other item.
  - The badge is a new `Default` column: the table reads the preferences, keeps the entries that point at the row's gear record, and names each type with `formatGearActivityTypeName`.
- [x] 4.2 The badge carries a control that clears the preference, calling `clearPreferredGearForActivityType`. Verify that clearing removes the badge and that the quick upload for that type then preselects nothing.
  - The control is the lucide `X` inside the badge. The panel calls the action and refreshes the page, so the badge disappears with the row that carried it.
- [x] 4.3 The badge reads from the owner's preference map, which the page fetches in the same `Promise.all` as the gear list. Verify that the preference map never reaches any other page.
  - The map is read only by `/my/gear` and `/my/workouts`. `app/admin/tracks/page.tsx` is untouched, and the panel renders the quick dialog only where the owner asked for it.

## 5. The pages

- [x] 5.1 In `app/(public)/my/workouts/page.tsx`, fetch the owner's preferences and pass them to the panel, which hands them to the quick upload dialog. Verify that the dialog preselects the preferred gear.
- [x] 5.2 In `app/(public)/my/gear/page.tsx`, fetch the owner's preferences and pass them to the gear panel. Verify that the badges render.
- [x] 5.3 Leave `app/admin/tracks/page.tsx` and the administrative track panel unchanged: no preference map is fetched there, so nothing about a gear record reaches that surface. Verify by reading the rendered admin payload — no preference and no gear name.
  - The administrative page passes neither `ownerGear` nor `ownerGearPreferences`; the panel's own gear field renders only when `ownerGear` is present, so the administrative surface cannot show a gear name.
- [x] 5.4 Leave the public read path unchanged: no public query selects the preference. Verify that a published track page renders exactly as before.
  - The only readers of the preference map are `app/_data/gear.ts` and `app/_data/tracks.ts`; no public page selects it.

## 6. Validate

- [x] 6.1 `npm run tsc` — passes clean.
- [x] 6.2 `npx eslint lib/gear.ts app/_data/gear.ts components/track-pages/quick-workout-upload-dialog.tsx components/admin-pages/gear-columns.tsx "app/(public)/my/gear/page.tsx" "app/(public)/my/workouts/page.tsx" --quiet` — clean.
- [x] 6.3 `npm run lint` — clean.
- [x] 6.4 `npx openspec validate feature-124-outdoor-gear-preferred-per-activity` — valid.
- [x] 6.5 `npm run build` — the user runs the build; not run by the agent. The owner runs it and records the result here.
  - The owner ran the build on 2026-10-27 and it passed.

## 7. Browser check

The browser checks of this section are the owner's — the agent does not open a browser. They are filed as the candidate `outdoor-gear-preferred-per-activity-manual-qa` in the Manual QA Follow-ups table of `openspec/backlog.md` — see task 8.2 — and are not tasks of this change anymore:

- `/my/workouts`: open the quick upload for a walk, pick a pair of shoes, tick "remember these shoes for walks", and save. The workout carries the pair, and the next quick upload for a walk preselects it.
- `/my/gear`: the preferred item shows the badge, and clearing it removes the badge and the preselection.
- Edit the preferred gear item and remove the activity type from it. The badge for that type disappears and the quick upload preselects nothing for it.
- `/admin/tracks`: no gear name and no preference reach the page.

## 8. Docs

- [x] 8.1 `openspec/backlog.md`: the `outdoor-gear-preferred-per-activity` candidate row becomes the `In Progress` row `feature-124-outdoor-gear-preferred-per-activity` at promotion time (done when this change was created).
- [x] 8.2 The manual browser checks that could not be run are filed as a candidate in `openspec/backlog.md` rather than left open here.
  - Filed as `outdoor-gear-preferred-per-activity-manual-qa` in the Manual QA Follow-ups table of `openspec/backlog.md`; it carries the deferred browser checks of section 7 and the data-level check of task 2.6. The case with a second gear record was left out on 2026-10-27 — the owner has one record.

## Not in this change

- Remembering the *last* used pair — the owner moved away from that deliberately.
- A global default across activity types.
- Any public or administrative exposure of the preference.
- Automatic promotion of a pair into a preference.
- Mileage, wear, and lifecycle statistics.
