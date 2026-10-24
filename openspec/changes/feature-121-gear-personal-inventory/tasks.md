# Tasks

## 1. The model

- [ ] 1.1 In `prisma/schema.prisma`, add the `Gear` model next to the other owner-scoped outdoor models, following the `Track` conventions: `id String @id @default(uuid())`, `name String`, an optional `activityTypeId String?` with `activityType TrackActivityType? @relation(fields: [activityTypeId], references: [id], onDelete: SetNull)`, `userId String` with `user User @relation(fields: [userId], references: [id], onDelete: Cascade)`, `createdAt` / `updatedAt`, `@@index([userId])`, `@@index([activityTypeId])`. Verify with `npx prisma validate` that the schema parses.
  - The `SetNull` choice (not `Restrict`, which would make the activity-type deletion flow hit an unchecked foreign-key violation) is recorded in `design.md`, decision 2.
- [ ] 1.2 Add the inverse relation `gears Gear[]` to `model User` (next to `tracks Track[]`). Verify with `npx prisma validate` that both sides of the relation are declared.
- [ ] 1.3 Run `npx prisma generate`. Verify that `Gear` is exported from `generated/prisma/client` and that `Prisma.GearSelect` / `Prisma.GearGetPayload` resolve.
- [ ] 1.4 Create the migration `prisma/migrations/<timestamp>_add_gear_model/migration.sql`. Generate the SQL with `npx prisma migrate diff --from-schema <old-schema> --to-schema <new-schema> --script` and apply it with `npx prisma migrate deploy` — `npx prisma migrate dev` will refuse to run because `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied, and it offers a database reset. **Do not reset the database.** Verify that the `Gear` table and its two indexes exist and that no existing table was altered.

## 2. The data layer (`app/_data/gear.ts`)

- [ ] 2.1 Create `app/_data/gear.ts` as a `"use server"` module with the lazy Prisma import (`const { default: prisma } = await import("@/lib/prisma");`) used by the neighbouring data modules. Verify the file compiles under `npm run tsc`.
- [ ] 2.2 Add the `gearListSelect` constant (`satisfies Prisma.GearSelect`) with the scalar columns, the `activityType` relation, and the `user` relation, and export `export type GearListItem = Prisma.GearGetPayload<{ select: typeof gearListSelect }>`. Verify the exported type resolves in `app/_data/gear.ts`.
- [ ] 2.3 Add `getOwnerGear()` — the owner-scoped list: `requireActionUser()` from `@/lib/auth-utils` for the owner id, `prisma.gear.findMany({ where: { userId }, select: gearListSelect, orderBy: [{ createdAt: "desc" }] })`. Verify that the helper takes no owner id from the caller and returns only the caller's rows.
- [ ] 2.4 Add the name normalization and validation: trim the name, reject an empty name, reject a name longer than 120 characters. Verify each rejection produces a `VALIDATION` result rather than an exception.
- [ ] 2.5 Add `createGear({ name, activityTypeId })` — resolve the owner through `requireActionUser()`, normalize and validate the name, and validate the activity type through `getTrackActivityTypeById(id)` from `@/app/_data/track-activity-types` (it returns `null` for unknown and inactive ids). A blank activity type is stored as no type. Verify the record is written with the caller's id as its owner.
- [ ] 2.6 Add `updateGear({ id, name, activityTypeId })` — read the row with `findFirst({ where: { id, userId } })` first and refuse with `NOT_FOUND` when it is missing, then apply the same name and activity-type validation. Verify that a record owned by another user is neither found nor modified.
- [ ] 2.7 Add `deleteGear(id)` — the same `findFirst({ where: { id, userId } })` guard before the delete. Verify that a record owned by another user survives the attempt.
- [ ] 2.8 Give all three mutations the discriminated result shape `{ ok: true, … }` / `{ ok: false, code, message }` with the codes `VALIDATION`, `NOT_FOUND`, `UNAUTHORIZED`, and an anonymous caller produces `UNAUTHORIZED`. Verify the four codes are reachable.
- [ ] 2.9 Revalidate `/my/gear` after every successful mutation with `revalidatePath("/my/gear")`. Verify the page's cache is invalidated by a create, an update, and a delete.

## 3. The gear form dialog (`components/admin-pages/gear-form-dialog.tsx`)

- [ ] 3.1 Create the client component with the zod schema from `design.md`: `name` trimmed, non-empty, at most 120 characters; `activityTypeId` optional, where a blank selection is treated as no type. Derive the form-value type from the schema. Verify the schema rejects an empty name and an over-long name.
- [ ] 3.2 Build the dialog markup the way `components/admin-pages/video-channel-create-dialog.tsx` does: `Dialog` + `DialogContent` + `DialogHeader` + `DialogTitle`, `Form` + `FormField` + `FormItem` + `FormLabel` + `FormControl` + `FormMessage`, one `Input` for the name and one `Select` for the activity type, the primitives imported from `@/components/index`. Verify the form renders with the shared primitives and no new UI primitive was added.
- [ ] 3.3 Wire `useForm({ resolver: zodResolver(formSchema), defaultValues, mode: "onBlur" })`, reset the form to the defaults when the dialog closes, and prefill the name and the activity type when the dialog opens in edit mode. Verify that opening the edit dialog shows the stored values.
- [ ] 3.4 Handle the submit: call the server action, show a success toast and `router.refresh()` on success, and show the returned message on failure. Verify the submit button is disabled while the form is invalid or in flight.
- [ ] 3.5 Support both the create and the edit mode from the one component. Verify the dialog title, the submit label, and the called action differ between the two modes.
- [ ] 3.6 Offer only the active activity types in the select, with a "Not selected" option that stores no type. Verify an inactive type is not offered.

## 4. The gear list (`components/admin-pages/gear-panel.tsx`, `components/admin-pages/gear-columns.tsx`)

- [ ] 4.1 Create the column factory `components/admin-pages/gear-columns.tsx` the way `components/admin-pages/tracks-workout-columns.tsx` is written: the name, the activity type as a `Badge` (the localized type name, or an explicit "Unclassified" badge when there is no type), the created date, and the row actions. Verify the factory returns `ColumnDef<GearListItem>[]`.
- [ ] 4.2 Create the panel `components/admin-pages/gear-panel.tsx`: the shared `DataTable` over the owner's rows, an "Add gear" button that opens the create dialog, and the per-row edit and delete actions. Verify the panel renders the owner's rows and no other rows.
- [ ] 4.3 Delete through the shared `useDeleteRowConfirm` hook and the shared `ConfirmDialog`, the same ones the track tables use. Verify the deletion asks for confirmation and that a cancelled confirmation leaves the row in place.
- [ ] 4.4 Add the empty state — a short "You have no gear yet" message with the add button — for an owner with no gear records. Verify the empty state renders instead of an empty table.

## 5. The page (`app/(public)/my/gear/page.tsx`)

- [ ] 5.1 Create the page in the shape of `app/(public)/my/tracks/page.tsx`: `await requireAuth()` at the top of the component, `export const dynamic = "force-dynamic"`, and a `metadata` export built with `buildPageMetadata` (title `My gear`, path `/my/gear`). Verify an anonymous visitor is redirected to the sign-in page and sees no gear.
- [ ] 5.2 Fetch the owner's gear and the active activity types with `Promise.all([getOwnerGear(), getActiveTrackActivityTypes()])` and render the panel inside `<PageLayout title="My gear" contentWidth="wide" className="pt-6">`. Verify the page lists the owner's gear and the form offers the active types.

## 6. The nav entry (`components/blog-pages/navbar-user-menu.tsx`)

- [ ] 6.1 Add a `My gear` link next to the `My tracks` and `My workouts` links, pointing at `/my/gear`, with the lucide `Footprints` icon, and add `Footprints` to the file's lucide-react import. Verify the entry appears in the user menu and opens the gear page.

## 7. Validate

- [ ] 7.1 `npm run tsc` — passes clean.
- [ ] 7.2 `npx eslint app/_data/gear.ts components/admin-pages/gear-panel.tsx components/admin-pages/gear-columns.tsx components/admin-pages/gear-form-dialog.tsx components/blog-pages/navbar-user-menu.tsx "app/(public)/my/gear/page.tsx" --quiet` — clean.
- [ ] 7.3 `npm run lint` — clean.
- [ ] 7.4 `npx openspec validate feature-121-gear-personal-inventory` — valid.
- [ ] 7.5 `npm run build` — the user runs the build; not run by the agent. The owner runs it and records the result here.

## 8. Browser check

- [ ] `/my/gear` opens from the user menu and lists the owner's gear.
- [ ] Adding a gear with a name and an activity type saves it, and it appears in the list with the type badge.
- [ ] Adding a gear without an activity type saves it as "Unclassified" — no synthetic "not selected" type is created.
- [ ] Adding a gear with an empty name is refused with a message, and no record is created.
- [ ] Editing a gear changes its name and its activity type, and the list shows the new values.
- [ ] Deleting a gear asks for confirmation, and the row disappears once confirmed.
- [ ] A gear whose activity type was deactivated afterwards keeps its classification and shows it.
- [ ] The gear of one signed-in user is not visible to another signed-in user, and neither can edit or delete it.
- [ ] `/my/gear` as an anonymous visitor redirects to the sign-in page.
- [ ] No public page shows a gear name, type, or count.

## 9. Docs

The promotion itself is already done: when this change was created, the `outdoor-gear-personal-inventory` candidate became the `In Progress` row `feature-121-gear-personal-inventory`, and the follow-on candidates — the gear-to-track assignment, the extended fields (year and size), and the brand dictionary — were filed with their dependencies.

- [ ] 9.1 `openspec/backlog.md`: the `feature-121-gear-personal-inventory` row is removed from the roadmap table at archive time, the way `feature-120-track-workout-kind` was.
- [ ] 9.2 `openspec/specs/outdoor-gear/spec.md`: the requirements from `specs/outdoor-gear/spec.md` in this change are merged into the live spec at archive time.

## Not in this change

- Assigning gear to a track — the next slice, and the one that turns the inventory into the pairing the owner actually wants.
- Brand, model, size, and year on a gear record — the extended-fields slice; the columns arrive as nullable, so nothing here has to be migrated later.
- The brand dictionary — its own slice, with its own admin surface.
- Mileage, wear, and lifecycle statistics — nothing is computed from gear yet.
- Gear photos and any public representation of gear.
- Any change to `outdoor-track-activity-types` — the activity-type dictionary keeps its current requirements.
