# Design

## Context

See `proposal.md` for the motivation. The shape of the solution is already established by two neighbouring domains, and this change copies them rather than inventing a third pattern:

- **`outdoor-tracks`** — owner-scoped content under `app/(public)/my/…`, with `app/_data/tracks.ts` as a `"use server"` module of owner-scoped helpers, a `select` constant that derives the exported row type, and `findFirst({ where: { id, userId } })` as the ownership guard before every mutation.
- **`outdoor-track-activity-types`** — the admin-managed dictionary (`key` / `nameEn` / `nameRu` / `isActive`) that a gear record borrows its optional activity types from.

Both live in `app/(public)/my/` behind `requireAuth()`, and both are listed in the same user menu (`components/blog-pages/navbar-user-menu.tsx`).

Two constraints shape the work:

1. **`Track.activityTypeId` uses `onDelete: Restrict`, and the activity-type deletion flow only counts tracks.** `deleteTrackActivityType` (`app/_data/track-activity-types.ts:83`) checks `type._count.tracks` and refuses to delete a type that tracks still use, then reassigns them in a transaction. It does not know about any other referent.
2. **The project has a live migration-checksum drift.** `npx prisma migrate dev` refuses to run because `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied, and it offers a database reset. That reset must not happen.

## Goals / Non-Goals

**Goals:**

- A `Gear` record that an owner can create, list, edit, and delete from one private page, with the ownership check enforced in the data layer rather than in the UI.
- A shape that the next two slices extend without reshaping: brand, size, and year arrive later as nullable columns; the assignment of gear to tracks arrives later as a nullable FK on `Track`.
- Server-side validation of the name and of every activity type, so the same rules hold no matter which client calls the action.

**Non-Goals:**

- Design decisions for the later slices (the assignment slice, the brand dictionary, the extended fields). This design only has to leave room for them.
- Changing how activity types are created, renamed, deactivated, or deleted. `outdoor-track-activity-types` keeps its current requirements.
- Any public representation of gear, and any administrative listing of it.

## Decisions

### 1. A separate `Gear` model, not columns on `Track`

**Decision:** a new `model Gear` with its own owner relation.

**Why:** a gear record has a lifecycle of its own — it is created before it is ever used, it can sit unused for a season, and it is deleted on its own terms. It also outlives any single track: the assignment slice points many tracks at one pair of shoes. A column on `Track` could express neither.

**Alternative considered:** a `gear` JSON blob on `Track`. Rejected — it cannot be listed, cannot be validated, and cannot survive being referenced by a second track.

### 2. A join table for the activity types, not a nullable foreign key

**Decision:** a gear record carries a *set* of activity types, held in an explicit `GearToTrackActivityTypes` join model — `@@id([gearId, activityTypeId])`, `@@index([activityTypeId])`, `onDelete: Cascade` on both foreign keys.

**Why:** one pair of shoes is used for running *and* for walking; the owner asked for exactly that. A single nullable `activityTypeId` cannot express it, and a Postgres array of ids would drop the foreign key, the cascade, and the ability to count a type's usage. The explicit join model is what the project already does for every many-to-many relation — `VideosToVideoTags`, `PostsToContentTags`, `HikesToTracks` — with the same composite primary key and the same `assignedAt` timestamp.

**Why `Cascade` on the activity-type foreign key:** `Track.activityTypeId` is `Restrict`, and the deletion flow honours that by counting tracks and refusing the delete. The same delete of a type that gear still uses must not hit a foreign-key violation the flow does not check for — an unhandled database error instead of a message. With `Cascade` on the join rows, the deletion drops the link and the gear record survives with its other types intact; `deleteTrackActivityType` (`app/_data/track-activity-types.ts:83`) is not touched, so `outdoor-track-activity-types` keeps its current behaviour. Making gear block the deletion would mean teaching the activity-type flow about gear, which widens this slice past the inventory.

**Why `Cascade` on the gear foreign key:** the owner relation is `Cascade`, matching `Track`, so a deleted user's gear goes with them, and its join rows go with the gear.

**Alternative considered:** `Restrict` plus an extension of `deleteTrackActivityType` to count and reassign gear. Correct for a single foreign key, but it modifies `outdoor-track-activity-types` and adds an admin-facing reassignment flow. That belongs in the slice that actually needs it, if it ever does.

**Alternative considered:** an implicit Prisma many-to-many (`activityTypes TrackActivityType[]`). It creates the join table, but the project names its join tables explicitly and the explicit model gives the data migration a table to carry the existing rows into.

### 3. A new `app/_data/gear.ts`, not more functions in `app/_data/tracks.ts`

**Decision:** a separate `"use server"` module for the gear domain.

**Why:** the project's convention is an explicit domain name per data file (`video-channels`, `track-activity-types`, `tracks`). Gear is its own domain that the assignment slice will grow into a relationship between two domains; keeping it in `tracks.ts` would tie the two together in the first file they touch.

**Alternative considered:** adding `createGear`/`deleteGear` to `tracks.ts`. Rejected — it would pull a non-track concept into the track module and grow that file past 1200 lines.

### 4. The owner id comes from `requireActionUser()`, not a client-supplied id

**Decision:** every gear action calls `await requireActionUser()` from `@/lib/auth-utils` and uses `user.id` as the owner. The client never sends an owner id.

**Why:** `requireActionUser()` (`lib/auth-utils.ts:68`) is the existing shared helper that throws `AuthorizationError` for an anonymous caller and returns the session user. It is the non-redirect counterpart of `requireAuth()` and avoids duplicating `tracks.ts`'s private `getRequiredUserId()` helper in a second file.

**Why not `requireAuth()`:** it calls `redirect("/sign-in")`, which is right for a page and wrong for a server action — a redirect inside an action is not an answer the client can act on.

**Ownership guard on mutations:** the update and the delete first read the row with `findFirst({ where: { id, userId } })` and refuse when it is missing, exactly as `updateTrack` (`app/_data/tracks.ts:618`) and `deleteTrack` (`:973`) do. A row owned by somebody else is therefore never reached, not merely refused after the fact.

### 5. Mutations return a typed result instead of throwing

**Decision:** create, update, and delete each return a discriminated result — `{ ok: true, … }` or `{ ok: false, code, message }` — with the codes `VALIDATION`, `NOT_FOUND`, and `UNAUTHORIZED`.

**Why:** the gear form has to say *why* a save failed: an empty name, a name that is too long, and an activity type that is no longer active are three different messages a user can act on, while "not found" and "not yours" are not the user's fault. `createManualTrack` (`app/_data/tracks.ts:1034`) already establishes this shape for exactly this reason.

**Alternative considered:** plain `throw new Error(...)`, as `app/_data/track-activity-types.ts` does. Simpler, but it makes every failure look like a crash in the toast, and the admin flow never needs to distinguish "invalid" from "not permitted".

### 6. The activity types are validated on the server, against the *active* list

**Decision:** every submitted activity-type id is accepted only when `getTrackActivityTypeById(id)` returns a row — that helper already returns `null` for unknown *and* inactive ids (`app/_data/track-activity-types.ts:24`) — with one exception: a type that is already attached to the record being edited is accepted even when it has since been deactivated.

**Why:** the client offers only active types, but the client is not the authority. A type deactivated between opening the form and saving must not be silently accepted, and a hand-crafted request must not attach a type the owner cannot see.

**Why the exception:** the classification of a gear record must survive the deactivation of its type, and that promise is only worth something if the record stays editable. Without the exception, renaming a pair of shoes would fail on a type the owner never chose to remove. The exception is narrow — it applies only to a type already linked to the very record being saved, never to a type attached afresh.

**Consequence:** an activity type that is deactivated after a gear record was saved keeps that record's classification — the row still exists, and deactivation is not a delete.

### 7. No trust gate and no quota on gear creation

**Decision:** creating a gear record is a plain owner action.

**Why:** `createTrack` runs `requireTrustGatedAction("track-upload")` and a verified-resource quota because it uploads a GPX file and produces a public artifact. A gear record is one text row with no file and no public surface, so gating it would add a quota resource type — a change to the `account-trust-quotas` capability — for no protective value.

### 8. The page reuses the owner-page shell and the shared table

**Decision:** `app/(public)/my/gear/page.tsx` is the 29-line shape of `/my/tracks` — `requireAuth()`, `dynamic = "force-dynamic"`, a `buildPageMetadata` export, `Promise.all([...])`, and a `PageLayout` with `contentWidth="wide"`. The list itself is the shared `DataTable` with a small column factory, mirroring `components/admin-pages/tracks-workout-columns.tsx`.

**Why:** `/my/tracks` and `/my/workouts` are already tables, so a third owner page that is a table reads as one family. The columns are deliberately few — name, activity types, created date, actions — because the inventory's whole value is that it is short.

**The activity types are toggled as chips, not picked from a single-select:** a set of types has no native single-select, and the project has no multi-select primitive. The form therefore renders one toggleable badge per type, with `aria-pressed` for the selected state — the existing `Badge` primitive in the existing Tailwind theme, no new dependency and no new UI primitive. The video form's `react-select` tags field is the one multi-select in the codebase, but it carries its own emotion styling rather than the project's theme, so it is not the pattern to copy here.

**Delete confirmation:** the shared `useDeleteRowConfirm` hook and the shared `ConfirmDialog`, the same ones the track tables use, so a deletion reads the same everywhere.

### 9. The user menu gains one entry

**Decision:** a `My gear` link with the lucide `Footprints` icon, next to `My tracks` (`Route`) and `My workouts` (`Dumbbell`), in `components/blog-pages/navbar-user-menu.tsx`.

**Why:** the inventory is only useful if it is reachable from where the owner already goes. `Footprints` reads as the shoes case the feature started from and does not pretend to be a general catalogue.

## Risks / Trade-offs

- **[The activity-type deletion flow drops a gear's link silently]** → A type that gear still uses can be deleted, and the cascade removes that link — the gear keeps its other types. Mitigation: the gear list renders an explicit "Unclassified" badge rather than a blank when nothing is left, so the state is visible; no gear record is ever removed or hidden by it. If the flow ever needs to protect gear as well, that is a change to `outdoor-track-activity-types` and belongs in its own slice.
- **[A gear record can carry many activity types, and the table cell grows with it]** → The type cell wraps its badges. Mitigation: the inventory needs few types per item in practice, the cell wraps instead of overflowing, and the column stays narrow next to the name.
- **[`migrate dev` refuses to run because of the pre-existing checksum drift on `20261013211113_feature_112_outdoor_track_creation_public_metadata`]** → Mitigation: generate the migration SQL with `npx prisma migrate diff --from-schema <old> --to-schema <new> --script` and apply it with `npx prisma migrate deploy`, which does not re-verify already-applied checksums — the path `feature-120` used. **Do not reset the database.** The drift itself stays open as its own issue.
- **[A name is the only handle on a gear record]** → Two pairs of identical shoes are indistinguishable in the MVP. Mitigation: the id is what the system keys on, so the later `brand` / `size` / `year` columns and the assignment slice can tell them apart without a data migration; the MVP simply does not offer a way to tell them apart yet.
- **[The owner list is not searchable]** → With more than a handful of items the page gets long. Mitigation: the shared `DataTable` paginates; search is a follow-up if the inventory grows.
- **[The data layer duplicates the ownership guard three times]** → Every gear mutation re-reads the row to check the owner. Mitigation: the three calls share one private helper inside `app/_data/gear.ts`, so the pattern appears once in the file.

## Migration Plan

1. Add `model Gear` to `prisma/schema.prisma` and the inverse `gears Gear[]` to `model User`.
2. `npx prisma generate` — the generated client is written to `generated/prisma` and is never edited by hand.
3. Produce the migration with `migrate diff --script` and apply it with `npx prisma migrate deploy`, because `migrate dev` will refuse to run against the drifted checksum history (see Risks).
4. **The many-to-many revision is a second migration, not a rewrite.** The first migration is applied and the migrations are never rewritten: `20261024194221_gear_multiple_activity_types` creates `GearToTrackActivityTypes`, copies the `activityTypeId` of every existing gear row into it, and only *after* that copy drops the old column, its index, and its foreign key. The copy runs first, so the gear records an owner already created keep their classification.
5. Rollback: the first migration is additive — one new table, no existing table altered — so reverting it is `DROP TABLE "Gear";` plus `npx prisma generate` on the previous schema. The second migration is not losslessly reversible: a set of activity types cannot collapse back into one column per record, so a rollback would keep the first type and drop the rest. The safe direction for it is forward. No existing row is read or written by the new code before the tables exist, and no public path touches gear at all, so a rollback of the first migration loses only gear records the owner created.

## Open Questions

None. The deferred questions — which fields the extended slice adds, whether the brand dictionary is admin-managed, and how a track references a gear record — belong to the later slices and change neither this design nor this task breakdown.
