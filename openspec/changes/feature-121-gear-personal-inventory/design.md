# Design

## Context

See `proposal.md` for the motivation. The shape of the solution is already established by two neighbouring domains, and this change copies them rather than inventing a third pattern:

- **`outdoor-tracks`** — owner-scoped content under `app/(public)/my/…`, with `app/_data/tracks.ts` as a `"use server"` module of owner-scoped helpers, a `select` constant that derives the exported row type, and `findFirst({ where: { id, userId } })` as the ownership guard before every mutation.
- **`outdoor-track-activity-types`** — the admin-managed dictionary (`key` / `nameEn` / `nameRu` / `isActive`) that a gear record borrows its optional activity type from.

Both live in `app/(public)/my/` behind `requireAuth()`, and both are listed in the same user menu (`components/blog-pages/navbar-user-menu.tsx`).

Two constraints shape the work:

1. **`Track.activityTypeId` uses `onDelete: Restrict`, and the activity-type deletion flow only counts tracks.** `deleteTrackActivityType` (`app/_data/track-activity-types.ts:83`) checks `type._count.tracks` and refuses to delete a type that tracks still use, then reassigns them in a transaction. It does not know about any other referent.
2. **The project has a live migration-checksum drift.** `npx prisma migrate dev` refuses to run because `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied, and it offers a database reset. That reset must not happen.

## Goals / Non-Goals

**Goals:**

- A `Gear` record that an owner can create, list, edit, and delete from one private page, with the ownership check enforced in the data layer rather than in the UI.
- A shape that the next two slices extend without reshaping: brand, size, and year arrive later as nullable columns; the assignment of gear to tracks arrives later as a nullable FK on `Track`.
- Server-side validation of both fields, so the same rules hold no matter which client calls the action.

**Non-Goals:**

- Design decisions for the later slices (the assignment slice, the brand dictionary, the extended fields). This design only has to leave room for them.
- Changing how activity types are created, renamed, deactivated, or deleted. `outdoor-track-activity-types` keeps its current requirements.
- Any public representation of gear, and any administrative listing of it.

## Decisions

### 1. A separate `Gear` model, not columns on `Track`

**Decision:** a new `model Gear` with its own owner relation.

**Why:** a gear record has a lifecycle of its own — it is created before it is ever used, it can sit unused for a season, and it is deleted on its own terms. It also outlives any single track: the assignment slice points many tracks at one pair of shoes. A column on `Track` could express neither.

**Alternative considered:** a `gear` JSON blob on `Track`. Rejected — it cannot be listed, cannot be validated, and cannot survive being referenced by a second track.

### 2. `onDelete: SetNull` on `Gear.activityTypeId`, not `Restrict`

**Decision:** the optional activity-type relation uses `onDelete: SetNull`.

**Why:** `Track.activityTypeId` is `Restrict`, and the deletion flow honours that by counting tracks and refusing the delete. If `Gear.activityTypeId` were `Restrict` too, the same delete would hit a foreign-key violation that the flow does not check for — an unhandled database error instead of a message. Making gear block the deletion would mean teaching the activity-type flow about gear, which changes another capability's behaviour and widens this slice past the inventory.

`SetNull` keeps the two domains independent: the gear record survives, and only its optional label is cleared. Nothing is lost, because the label is a private grouping hint on the owner's own list and no statistic is derived from it yet. Deactivation — the normal way an activity type retires — is unaffected either way, because the row still exists and the gear keeps its classification.

**Alternative considered:** `Restrict` plus an extension of `deleteTrackActivityType` to count and reassign gear. Correct, but it modifies `outdoor-track-activity-types` and adds an admin-facing reassignment flow. That belongs in the slice that actually needs it, if it ever does.

**Alternative considered:** `onDelete: Cascade` on the owner relation only — the owner relation is `Cascade`, matching `Track`, so a deleted user's gear goes with them.

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

### 6. The activity type is validated on the server, against the *active* list

**Decision:** a submitted `activityTypeId` is accepted only when `getTrackActivityTypeById(id)` returns a row — that helper already returns `null` for unknown *and* inactive ids (`app/_data/track-activity-types.ts:24`).

**Why:** the client offers only active types, but the client is not the authority. A type deactivated between opening the form and saving must not be silently accepted, and a hand-crafted request must not attach a type the owner cannot see.

**Consequence:** an activity type that is deactivated after a gear record was saved keeps that record's classification — the row still exists, and deactivation is not a delete.

### 7. No trust gate and no quota on gear creation

**Decision:** creating a gear record is a plain owner action.

**Why:** `createTrack` runs `requireTrustGatedAction("track-upload")` and a verified-resource quota because it uploads a GPX file and produces a public artifact. A gear record is one text row with no file and no public surface, so gating it would add a quota resource type — a change to the `account-trust-quotas` capability — for no protective value.

### 8. The page reuses the owner-page shell and the shared table

**Decision:** `app/(public)/my/gear/page.tsx` is the 29-line shape of `/my/tracks` — `requireAuth()`, `dynamic = "force-dynamic"`, a `buildPageMetadata` export, `Promise.all([...])`, and a `PageLayout` with `contentWidth="wide"`. The list itself is the shared `DataTable` with a small column factory, mirroring `components/admin-pages/tracks-workout-columns.tsx`.

**Why:** `/my/tracks` and `/my/workouts` are already tables, so a third owner page that is a table reads as one family. The columns are deliberately few — name, activity type, created date, actions — because the inventory's whole value is that it is short.

**Delete confirmation:** the shared `useDeleteRowConfirm` hook and the shared `ConfirmDialog`, the same ones the track tables use, so a deletion reads the same everywhere.

### 9. The user menu gains one entry

**Decision:** a `My gear` link with the lucide `Footprints` icon, next to `My tracks` (`Route`) and `My workouts` (`Dumbbell`), in `components/blog-pages/navbar-user-menu.tsx`.

**Why:** the inventory is only useful if it is reachable from where the owner already goes. `Footprints` reads as the shoes case the feature started from and does not pretend to be a general catalogue.

## Risks / Trade-offs

- **[The activity-type deletion flow clears a gear's label silently]** → A type that gear still uses can be deleted, and the gear becomes "Unclassified". Mitigation: the gear list renders an explicit "Unclassified" badge rather than a blank, so the state is visible; no gear record is ever removed or hidden by it. If the flow ever needs to protect gear as well, that is a change to `outdoor-track-activity-types` and belongs in its own slice.
- **[`migrate dev` refuses to run because of the pre-existing checksum drift on `20261013211113_feature_112_outdoor_track_creation_public_metadata`]** → Mitigation: generate the migration SQL with `npx prisma migrate diff --from-schema <old> --to-schema <new> --script` and apply it with `npx prisma migrate deploy`, which does not re-verify already-applied checksums — the path `feature-120` used. **Do not reset the database.** The drift itself stays open as its own issue.
- **[A name is the only handle on a gear record]** → Two pairs of identical shoes are indistinguishable in the MVP. Mitigation: the id is what the system keys on, so the later `brand` / `size` / `year` columns and the assignment slice can tell them apart without a data migration; the MVP simply does not offer a way to tell them apart yet.
- **[The owner list is not searchable]** → With more than a handful of items the page gets long. Mitigation: the shared `DataTable` paginates; search is a follow-up if the inventory grows.
- **[The data layer duplicates the ownership guard three times]** → Every gear mutation re-reads the row to check the owner. Mitigation: the three calls share one private helper inside `app/_data/gear.ts`, so the pattern appears once in the file.

## Migration Plan

1. Add `model Gear` to `prisma/schema.prisma` and the inverse `gears Gear[]` to `model User`.
2. `npx prisma generate` — the generated client is written to `generated/prisma` and is never edited by hand.
3. Produce the migration with `migrate diff --script` and apply it with `npx prisma migrate deploy`, because `migrate dev` will refuse to run against the drifted checksum history (see Risks).
4. Rollback: the change is additive — one new table, no existing table altered — so reverting is `DROP TABLE "Gear";` plus `npx prisma generate` on the previous schema. No existing row is read or written by the new code before the table exists, and no public path touches gear at all, so a rollback loses only gear records the owner created.

## Open Questions

None. The deferred questions — which fields the extended slice adds, whether the brand dictionary is admin-managed, and how a track references a gear record — belong to the later slices and change neither this design nor this task breakdown.
