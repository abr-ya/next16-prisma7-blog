# Tasks

## 1. The model

- [x] 1.1 In `prisma/schema.prisma`, add the `Gear` model next to the other owner-scoped outdoor models, following the `Track` conventions: `id String @id @default(uuid())`, `name String`, an optional `activityTypeId String?` with `activityType TrackActivityType? @relation(fields: [activityTypeId], references: [id], onDelete: SetNull)`, `userId String` with `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`, `createdAt` / `updatedAt`, `@@index([userId])`, `@@index([activityTypeId])`. Verify with `npx prisma validate` that the schema parses.
  - The `SetNull` choice (not `Restrict`, which would make the activity-type deletion flow hit an unchecked foreign-key violation) is recorded in `design.md`, decision 2.
- [x] 1.2 Add the inverse relation `gears Gear[]` to `model User` (next to `tracks Track[]`). Verify with `npx prisma validate` that both sides of the relation are declared.
- [x] 1.3 Run `npx prisma generate`. Verify that `Gear` is exported from `generated/prisma/client` and that `Prisma.GearSelect` / `Prisma.GearGetPayload` resolve.
- [x] 1.4 Create the migration `prisma/migrations/<timestamp>_add_gear_model/migration.sql`. Generate the SQL with `npx prisma migrate diff --from-schema <old-schema> --to-schema <new-schema> --script` and apply it with `npx prisma migrate deploy` — `npx prisma migrate dev` will refuse to run because `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied, and it offers a database reset. **Do not reset the database.** Verify that the `Gear` table and its two indexes exist and that no existing table was altered.
  - Applied on 2026-10-24 with `npx prisma migrate deploy` — the owner ran it, no database reset. The generated SQL matches `prisma migrate diff --from-schema <HEAD schema> --to-schema prisma/schema.prisma --script` byte for byte, and the `Gear` table was confirmed to exist in the database afterwards.

## 2. The data layer (`app/_data/gear.ts`)

- [x] 2.1 Create `app/_data/gear.ts` as a `"use server"` module with the lazy Prisma import (`const { default: prisma } = await import("@/lib/prisma");`) used by the neighbouring data modules. Verify the file compiles under `npm run tsc`.
- [x] 2.2 Add the `gearListSelect` constant (`satisfies Prisma.GearSelect`) with the scalar columns, the `activityType` relation, and the `user` relation, and export `export type GearListItem = Prisma.GearGetPayload<{ select: typeof gearListSelect }>`. Verify the exported type resolves in `app/_data/gear.ts`.
- [x] 2.3 Add `getOwnerGear()` — the owner-scoped list: `requireActionUser()` from `@/lib/auth-utils` for the owner id, `prisma.gear.findMany({ where: { userId }, select: gearListSelect, orderBy: [{ createdAt: "desc" }] })`. Verify that the helper takes no owner id from the caller and returns only the caller's rows.
- [x] 2.4 Add the name normalization and validation: trim the name, reject an empty name, reject a name longer than 120 characters. Verify each rejection produces a `VALIDATION` result rather than an exception.
- [x] 2.5 Add `createGear({ name, activityTypeId })` — resolve the owner through `requireActionUser()`, normalize and validate the name, and validate the activity type through `getTrackActivityTypeById(id)` from `@/app/_data/track-activity-types` (it returns `null` for unknown and inactive ids). A blank activity type is stored as no type. Verify the record is written with the caller's id as its owner.
- [x] 2.6 Add `updateGear({ id, name, activityTypeId })` — read the row with `findFirst({ where: { id, userId } })` first and refuse with `NOT_FOUND` when it is missing, then apply the same name and activity-type validation. Verify that a record owned by another user is neither found nor modified.
- [x] 2.7 Add `deleteGear(id)` — the same `findFirst({ where: { id, userId } })` guard before the delete. Verify that a record owned by another user survives the attempt.
- [x] 2.8 Give all three mutations the discriminated result shape `{ ok: true, … }` / `{ ok: false, code, message }` with the codes `VALIDATION`, `NOT_FOUND`, `UNAUTHORIZED`, and an anonymous caller produces `UNAUTHORIZED`. Verify the four codes are reachable.
- [x] 2.9 Revalidate `/my/gear` after every successful mutation with `revalidatePath("/my/gear")`. Verify the page's cache is invalidated by a create, an update, and a delete.

## 3. The gear form dialog (`components/admin-pages/gear-form-dialog.tsx`)

- [x] 3.1 Create the client component with the zod schema from `design.md`: `name` trimmed, non-empty, at most 120 characters; `activityTypeId` optional, where a blank selection is treated as no type. Derive the form-value type from the schema. Verify the schema rejects an empty name and an over-long name.
- [x] 3.2 Build the dialog markup the way `components/admin-pages/video-channel-create-dialog.tsx` does: `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle`, `Form` + `FormField` + `FormItem` + `FormLabel` + `FormControl` + `FormMessage`, one `Input` for the name and one `Select` for the activity type, the primitives imported from `@/components/index`. Verify the form renders with the shared primitives and no new UI primitive was added.
- [x] 3.3 Wire `useForm({ resolver: zodResolver(formSchema), defaultValues, mode: "onBlur" })`, reset the form to the defaults when the dialog closes, and prefill the name and the activity type when the dialog opens in edit mode. Verify that opening the edit dialog shows the stored values.
- [x] 3.4 Handle the submit: call the server action, show a success toast and `router.refresh()` on success, and show the returned message on failure. Verify the submit button is disabled while the form is invalid or in flight.
- [x] 3.5 Support both the create and the edit mode from the one component. Verify the dialog title, the submit label, and the called action differ between the two modes.
- [x] 3.6 Offer only the active activity types in the select, with a "Not selected" option that stores no type. Verify an inactive type is not offered.

## 4. The gear list (`components/admin-pages/gear-panel.tsx`, `components/admin-pages/gear-columns.tsx`)

- [x] 4.1 Create the column factory `components/admin-pages/gear-columns.tsx` the way `components/admin-pages/tracks-workout-columns.tsx` is written: the name, the activity type as a `Badge` (the localized type name, or an explicit "Unclassified" badge when there is no type), the created date, and the row actions. Verify the factory returns `ColumnDef<GearListItem>[]`.
- [x] 4.2 Create the panel `components/admin-pages/gear-panel.tsx`: the shared `DataTable` over the owner's rows, an "Add gear" button that opens the create dialog, and the per-row edit and delete actions. Verify the panel renders the owner's rows and no other rows.
- [x] 4.3 Delete through the shared `useDeleteRowConfirm` hook and the shared `ConfirmDialog`, the same ones the track tables use. Verify the deletion asks for confirmation and that a cancelled confirmation leaves the row in place.
- [x] 4.4 Add the empty state — a short "You have no gear yet" message with the add button — for an owner with no gear records. Verify the empty state renders instead of an empty table.

## 5. The page (`app/(public)/my/gear/page.tsx`)

- [x] 5.1 Create the page in the shape of `app/(public)/my/tracks/page.tsx`: `await requireAuth()` at the top of the component, `export const dynamic = "force-dynamic"`, and a `metadata` export built with `buildPageMetadata` (title `My gear`, path `/my/gear`). Verify an anonymous visitor is redirected to the sign-in page and sees no gear.
- [x] 5.2 Fetch the owner's gear and the active activity types with `Promise.all([getOwnerGear(), getActiveTrackActivityTypes()])` and render the panel inside `<PageLayout title="My gear" contentWidth="wide" className="pt-6">`. Verify the page lists the owner's gear and the form offers the active types.

## 6. The nav entry (`components/blog-pages/navbar-user-menu.tsx`)

- [x] 6.1 Add a `My gear` link next to the `My tracks` and `My workouts` links, pointing at `/my/gear`, with the lucide `Footprints` icon, and add `Footprints` to the file's lucide-react import. Verify the entry appears in the user menu and opens the gear page.

## 7. Validate

- [x] 7.1 `npm run tsc` — passes clean.
- [x] 7.2 `npx eslint app/_data/gear.ts components/admin-pages/gear-panel.tsx components/admin-pages/gear-columns.tsx components/admin-pages/gear-form-dialog.tsx components/blog-pages/navbar-user-menu.tsx "app/(public)/my/gear/page.tsx" --quiet` — clean.
- [x] 7.3 `npm run lint` — clean.
- [x] 7.4 `npx openspec validate feature-121-gear-personal-inventory` — valid.
- [x] 7.5 `npm run build` — the user runs the build; not run by the agent. The owner runs it and records the result here.
  - The owner's production build passed on 2026-10-24.

## 8. Browser check

The manual pass is kept to one minimal positive scenario, the same scope the owner chose for the other owner-page changes — the page opens and an item can be created and seen.

- [x] `/my/gear`: open the page from the user menu, add a gear item with a name and an activity type, and it appears in the list with its type badge.
  - Verified by the owner on 2026-10-24, before the many-to-many revision of section 10 — the revision is verified by task 10.9.

The remaining checks were deferred and filed as `outdoor-gear-personal-inventory-manual-qa` in `openspec/backlog.md`:

- [ ] Adding a gear without an activity type saves it as "Unclassified" — no synthetic "not selected" type is created.
- [ ] Adding a gear with an empty name is refused with a message, and no record is created.
- [ ] Editing a gear changes its name and its activity types, and the list shows the new values.
- [ ] Deleting a gear asks for confirmation, and the row disappears once confirmed.
- [ ] A gear whose activity type was deactivated afterwards keeps its classification and shows it.
- [ ] The gear of one signed-in user is not visible to another signed-in user, and neither can edit or delete it.
- [ ] `/my/gear` as an anonymous visitor redirects to the sign-in page.
- [ ] No public page shows a gear name, type, or count.

## 9. Docs

The promotion itself is already done: when this change was created, the `outdoor-gear-personal-inventory` candidate became the `In Progress` row `feature-121-gear-personal-inventory`, and the follow-on candidates — the gear-to-track assignment, the extended fields (year and size), and the brand dictionary — were filed with their dependencies.

- [x] 9.1 `openspec/backlog.md`: the `feature-121-gear-personal-inventory` row is removed from the roadmap table at archive time, the way `feature-120-track-workout-kind` was.
  - Removed on 2026-10-24 at archive time.
- [x] 9.2 `openspec/specs/outdoor-gear/spec.md`: the requirements from `specs/outdoor-gear/spec.md` in this change are merged into the live spec at archive time.
  - Done on 2026-10-24: the live spec was created from the delta — the same 4 requirements and 19 scenarios, under a single `## Requirements` section, with the delta's `## Purpose` copied into the new spec's `## Purpose`. `npx openspec validate --specs` passes.
- [x] 9.3 `openspec/backlog.md`: the deferred browser checks are filed as `outdoor-gear-personal-inventory-manual-qa`.

## 10. The many-to-many revision

The owner asked for the activity types to be selectable in multiples — the same shoes for running and for walking. The single `Gear.activityTypeId` of sections 1–4 becomes the `GearToTrackActivityTypes` join model of `design.md`, decision 2. The first migration is already applied, so this revision is a *second* migration and never a rewrite of the first.

Sections 1–9 describe the implementation as it was written; where this section says it revises a task, that task's wording is superseded.

- [x] 10.1 Replace `Gear.activityTypeId` in `prisma/schema.prisma` with the `GearToTrackActivityTypes` join model — `@@id([gearId, activityTypeId])`, `@@index([activityTypeId])`, `onDelete: Cascade` on both foreign keys — and point `TrackActivityType.gears` at it. Verify with `npx prisma validate`, then `npx prisma format`.
  - Revises tasks 1.1 and 1.2. The `SetNull` rationale of `design.md` decision 2 is superseded by the cascade on the join rows.
- [x] 10.2 Create the migration `prisma/migrations/20261024194221_gear_multiple_activity_types/migration.sql`: create the join table with its index and its two foreign keys, copy the `activityTypeId` of every existing gear row into it, and only *after* that copy drop `Gear.activityTypeId` with its index and foreign key. Verify the SQL by hand against `prisma migrate diff --from-schema <the applied schema> --to-schema prisma/schema.prisma --script` — the generated script drops the column first, which would lose the data, so the order is corrected by hand.
- [x] 10.3 Apply the second migration with `npx prisma migrate deploy`. **Do not reset the database.** Verify that `GearToTrackActivityTypes` exists, that the gear row created during the manual check kept its activity type, and that `Gear.activityTypeId` is gone.
  - Applied on 2026-10-24 with `npx prisma migrate deploy` — the owner ran it, no database reset. Verified afterwards: `GearToTrackActivityTypes` exists and `Gear.activityTypeId` is gone. The copy step had nothing to carry in this environment — the `Gear` table was already empty, the manual-check item having been deleted during the check — so the join table is empty too, and no record was lost by the migration. The copy statement stays in the migration: it is what protects a row created between the two migrations.
- [x] 10.4 Revise `app/_data/gear.ts` for the set: `gearListSelect` selects the joined types, `GearValues` carries `activityTypeIds`, `resolveActivityTypeIds` validates every submitted id, and `createGear` / `updateGear` write the set through the nested `create` and the `deleteMany` + `create` of an update. A type that is already attached to the record being edited stays accepted after it is deactivated. Verify under `npm run tsc`.
  - Revises tasks 2.2, 2.5, and 2.6.
- [x] 10.5 Revise the form: the zod field becomes `activityTypeIds: z.array(z.string())`, and the single `Select` becomes one toggleable `Badge` per type with `aria-pressed`. Verify that the toggles add and remove a type and that the dialog opens with the stored types selected.
  - Revises tasks 3.1, 3.2, 3.3, and 3.6.
  - The revision also fixes a defect that the single-type form already carried: `form.reset()` does not re-validate in react-hook-form 7, so opening the *edit* dialog left `formState.isValid` at its previous value and the submit button disabled on an already valid record. The edit path now calls `form.trigger()` after the reset. The create path is deliberately left alone — validating an empty name on open would show the error before the owner typed anything.
- [x] 10.6 Revise the column factory: the type cell renders one badge per type, or an explicit "Unclassified" badge when the item has none.
  - Revises task 4.1.
- [x] 10.7 Re-run the validation: `npm run tsc`, the targeted `eslint`, `npm run lint`, and `npx openspec validate feature-121-gear-personal-inventory`.
- [x] 10.8 `npm run build` — the owner runs the build; not run by the agent.
  - The owner's production build passed on 2026-10-24, after the many-to-many revision.
- [x] 10.9 Browser check: on `/my/gear`, add a gear item with two activity types and both badges show in the list; open it in edit and remove one — the badge is gone and the other stays; the item that existed before the revision kept its type.
  - Verified by the owner on 2026-10-24.

## Not in this change

- Assigning gear to a track — the next slice, and the one that turns the inventory into the pairing the owner actually wants.
- Brand, model, size, and year on a gear record — the extended-fields slice; the columns arrive as nullable, so nothing here has to be migrated later.
- The brand dictionary — its own slice, with its own admin surface.
- Mileage, wear, and lifecycle statistics — nothing is computed from gear yet.
- Gear photos and any public representation of gear.
- Any change to `outdoor-track-activity-types` — the activity-type dictionary keeps its current requirements.
