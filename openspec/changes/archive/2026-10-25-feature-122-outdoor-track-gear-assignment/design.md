# Design

## Context

See `proposal.md` for the motivation. Both sides of the relation already exist, and the project has an established shape for a relation between two owner-scoped domains:

- **`Gear`** (`prisma/schema.prisma:384`) — `id`, `name`, `userId` → `User` (`onDelete: Cascade`), and a set of activity types through `GearToTrackActivityTypes` (`@@id([gearId, activityTypeId])`, `Cascade` on both foreign keys).
- **`Track`** (`prisma/schema.prisma:341`) — `activityTypeId String?` → `TrackActivityType` (`onDelete: Restrict`), `kind`, `fileAssetId` → `FileAsset` (`onDelete: Restrict`), `userId` → `User` (`onDelete: Cascade`).
- **`app/_data/tracks.ts`** — the track mutation layer. `getTrackData` (`:193`) normalizes and validates the form values, `ensureSlugAvailable` (`:237`) guards the slug, and `ensureEligibleTrackFileAsset` (`:249`) is the ownership-scoped guard for the uploaded file: it reads the row with the owner in the `where` clause, so a record owned by somebody else is never reached. `createTrack` (`:591`) and `updateTrack` (`:618`) are the two write paths.
- **`app/_data/gear.ts`** — the owner-scoped inventory. `getOwnerGear` resolves the owner through `requireActionUser()` and reads only that owner's rows; `deleteGear` re-reads the row with `findFirst({ where: { id, userId } })` before deleting.

Two constraints shape the work:

1. **The `outdoor-gear` spec forbids gear in administrative listings** — "An administrator opens an administrative listing of the site's content → no listing includes the owners' personal gear records". The admin track panel and the owner track panel are *the same component* (`components/admin-pages/tracks-admin-panel.tsx`), so "render the field only on owner pages" is not a rendering decision — it is a data-flow decision.
2. **The project has a live migration-checksum drift.** `npx prisma migrate dev` refuses to run because `20261013211113_feature_112_outdoor_track_creation_public_metadata` was edited after it was applied, and it offers a database reset. That reset must not happen.

## Goals / Non-Goals

**Goals:**

- One gear item per track, set and cleared by the owner, with the ownership and activity-type rules enforced in the data layer rather than in the UI.
- No gear data on any surface the `outdoor-gear` spec forbids, enforced by construction rather than by remembering to hide a column.
- A shape the next two slices extend without reshaping: `feature-123` attaches gear through the same server path during a quick upload, and `feature-124` points a per-activity-type preference at the same gear records.

**Non-Goals:**

- Any public representation of the attachment. A published track does not show the shoes it was run in.
- A gear column in the track tables, on any surface.
- Preferred-gear memory, a quick-upload modal, brand/size/year fields, or gear statistics — each is its own slice.
- Changing how the activity-type dictionary behaves. `outdoor-track-activity-types` keeps its current requirements.

## Decisions

### 1. A nullable foreign key on `Track`, not a join table

**Decision:** `Track.gearId String?` with `gear Gear? @relation(fields: [gearId], references: [id], onDelete: Restrict)`, plus the back-relation `tracks Track[]` on `Gear`, and an index on `gearId`.

**Why:** the relation is one gear item to many tracks — one pair of shoes runs hundreds of walks, and a walk uses one pair of shoes. A join table would express many-to-many, which is a different product claim: a track would then be able to name several pieces of equipment at once, and every rule below (one assignment, one refusal message, one select) would need to become a set. The project's join models (`HikesToTracks`, `GearToTrackActivityTypes`, `VideosToVideoTags`) are all genuinely many-to-many; this one is not.

**Why the nullable column:** "no gear" is the normal state for a track, including every track that already exists. A nullable column makes "unassigned" an ordinary value instead of an absence, and the later slices (a preferred gear per activity type, a quick upload with no shoes) all want to write a track without one.

**Alternative considered:** a `gearId` on `Gear` — one gear, one track. Rejected: it caps every pair of shoes at a single walk.

### 2. `onDelete: Restrict`, and the refusal is explicit

**Decision:** the foreign key is `Restrict`, and `deleteGear` checks for attached tracks first and refuses with a message that names the blocker.

**Why:** the backlog candidate for this slice says it outright — "Preserve unassigned tracks and require explicit clearing before gear deletion". An owner who deletes a pair of shoes has two possible intents: they are done with them, or they are tidying up. Silently clearing the attachment answers neither: forty walks quietly lose the fact that they were run in those shoes, and the owner never learns that the deletion took something with it. Refusing keeps the owner's intent visible and gives them the two real options — clear the attachment first, or keep the shoes.

**Why `Restrict` and not `SetNull`:** `SetNull` would make the database perform exactly the silent clearing the refusal exists to prevent. `Restrict` turns the mistake into a database-level backstop, and the friendly message in `deleteGear` is what the owner actually sees.

**Why the check and not the raw error:** a raw foreign-key violation surfaces as an internal error, not as an instruction. `deleteGear` therefore counts the attached tracks and returns the same discriminated failure shape the other gear mutations use.

**Alternative considered:** `Cascade` on the track side — deleting a track clears nothing on the gear, so the two directions are asymmetric; the gear side is the one that needs a rule. Left as is.

### 3. The compatibility rule: an unclassified gear item fits anything; otherwise the track's activity type must be among the gear's

**Decision:** a gear item with no activity types may be attached to any track. A gear item with activity types may be attached only to a track whose activity type is one of them. A track with no activity type accepts any gear item.

**Why:** the inventory lets an owner leave a gear item unclassified ("I have not decided where these belong yet"), and refusing to attach unclassified shoes would make the inventory useless for exactly the items it exists for. The symmetric case — a track with no activity type — has no classification to contradict, so there is nothing to refuse. Every other combination is a real contradiction: running shoes on a cycling track, or a bicycle on a walk.

**Why the rule is checked against the *stored* values and not the form:** the browser filters the list for the owner's convenience, but the form is not the authority. A request that pairs a bicycle with a rowing track is refused by the data layer even though the browser would never have offered that combination.

### 4. Changing a track's activity type to an incompatible one is refused, not silently unpaired

**Decision:** when an update changes the activity type of a track that already carries gear, the new activity type is checked against the attached gear. An incompatible pair is refused with a message telling the owner to clear the gear first.

**Why:** this is the same rule as the deletion refusal — the owner asked for the change, but the change contradicts a fact they recorded earlier, and one of the two has to give. Clearing the gear silently would lose the attachment; refusing the activity-type change makes the owner decide which fact they meant. It also keeps the record internally consistent: a track never carries running shoes while claiming to be a cycling route.

**Alternative considered:** clearing the attachment when the activity type changes. Rejected — the owner did not ask to remove the shoes, and a silent removal is the failure mode this whole slice is built to avoid.

### 5. Three states on the write path: unchanged, cleared, set

**Decision:** `TrackActionValues.gearId` is `string | null | undefined`. On update, `undefined` leaves the current attachment alone, `null` clears it, and an id sets it.

**Why:** the project already needs this distinction for `kind` (`app/_data/tracks.ts:663` — `...(values.kind ? { kind: data.kind } : { kind: undefined })`), because a caller that does not know about the column must not reset it. The same reasoning applies here: `createTrackAndAttachToHike` (`app/_data/hikes/mutations.ts:572`) calls `getTrackData` and must keep producing gear-free tracks, while the owner form always sends a value. A single nullable field cannot express "the caller said nothing" — `undefined` can.

**Where the value is resolved:** the update reads the existing row (including its current `gearId`) and computes the *effective* gear id — the sent value when one was sent, the stored value otherwise — then validates that effective value against the owner and the activity type that the same update is about to write. One validation covers both the attachment and the activity-type change.

### 6. The guard lives in `app/_data/tracks.ts`, next to the file-asset guard

**Decision:** a module-private `ensureEligibleTrackGear({ gearId, userId, activityTypeId })` in `app/_data/tracks.ts`, called by `createTrack` and `updateTrack`.

**Why:** it mirrors `ensureEligibleTrackFileAsset` (`:249`) exactly — the same read-with-owner-in-the-`where` shape, the same "not found" refusal, the same placement inside the track mutation module rather than in the gear one. The gear module is a `"use server"` file, and everything it exports becomes a callable action; a helper there would be reachable with a caller-supplied owner id. Keeping the guard private to the track module means the owner id always comes from the session.

**What it refuses:** a gear id that is not the caller's (refused exactly like an unknown id — the message does not disclose whether the record exists), and a gear item whose activity types contradict the track's.

### 7. The gear field exists only where the owner is the only audience

**Decision:** the shared track panel takes the owner's gear as an optional prop. The field renders only when that prop is given. `/my/tracks` and `/my/workouts` pass it; `/admin/tracks` does not.

**Why:** the `outdoor-gear` spec says no administrative listing may include the owners' personal gear records. The admin track page and the owner track page render the same panel, so the guarantee has to come from the data flow: the admin page never receives a gear list, so the admin client bundle never holds a gear name, and there is nothing to forget to hide.

**Why the owner's gear list is the owner's own:** `getOwnerGear()` (`app/_data/gear.ts`) resolves the owner from the session and returns that owner's rows. There is no query that could list somebody else's gear.

### 8. The current attachment reaches the edit form through an opt-in owner-scoped projection

**Decision:** the owner-scoped track list queries gain an opt-in `includeGear` projection (`gear: { id, name }`); the admin query does not use it.

**Why:** the edit dialog has to show which gear is attached. That value comes from the row the table was built from, and the table is built from the list query — so the query has to carry it. Making it opt-in is what keeps it off the admin payload: `getAllTracks()` is called by both `/admin/tracks` and `/my/tracks`, so an unconditional projection would ship every attached gear name to the admin panel.

**Alternative considered:** a separate action that fetches the attachment when the dialog opens. It would keep the list query untouched, at the price of an extra round trip per dialog open and a second code path for the same value. The opt-in projection is one conditional in one place.

### 9. The select narrows itself to the activity type selected in the same form

**Decision:** the gear select offers the owner's gear that fits the currently selected activity type — all of it when the form's activity type is empty. Gear that does not fit is not offered.

**Why:** the compatibility rule is invisible otherwise. When the owner picks "Running" in the same form, the shoes that are not running shoes are simply not in the list; when they pick "Cycling", the running shoes disappear. The rule shows up as the shape of the choice instead of as an error message. The server re-checks the same rule on save, so the narrowing is a convenience and the check is the rule.

### 10. No gear column in the tables

**Decision:** neither the owner tables nor the admin tables grow a gear column.

**Why:** the admin table cannot show one (the spec forbids it), and two tables that differ only by a privacy column would need a variant of every column factory — for a value the owner can already read and change in the form. The assignment is visible where it is editable.

## Risks / Trade-offs

- **[An owner who wants to delete a pair of shoes has to clear its tracks first]** → The refusal names what is attached and how many tracks use it. This is the backlog's explicit-clearing rule, but it is still friction on a page the owner thought was a simple delete. Mitigation: the count is in the message, so the owner knows the size of the job, and clearing an attachment is one field in the edit form.
- **[The compatibility rule can refuse a pairing the owner considers sensible]** → Unclassified gear fits anything, so an owner who wants an unusual pairing has a way out: leave the gear unclassified, or classify it with the type. The rule refuses only a stated contradiction.
- **[A track's activity type can become uneditable while gear is attached]** → The refusal is explicit and reversible: clear the attachment, change the type, re-attach if the gear still fits. The alternative — a track whose type silently drifts away from its shoes — is worse data.
- **[`migrate dev` refuses to run because of the pre-existing checksum drift on `20261013211113_feature_112_outdoor_track_creation_public_metadata`]** → Mitigation: generate the migration SQL with `npx prisma migrate diff --from-schema <old> --to-schema <new> --script` and apply it with `npx prisma migrate deploy`, which does not re-verify already-applied checksums — the path `feature-121` used. **Do not reset the database.** The drift itself stays open as its own issue.
- **[The gear select grows long for an owner with many items]** → The list is the owner's own inventory, which is short in practice; the select scrolls. A searchable picker is a later slice if the inventory grows.
- **[The opt-in projection means the list query has two shapes]** → The projection is one conditional on the select, and the exported row type follows the select, so the two shapes are already distinct types rather than one type with an optional field.

## Migration Plan

1. Add `gearId String?` + the relation to `prisma/schema.prisma` and the back-relation `tracks Track[]` to `model Gear`.
2. `npx prisma generate` — the generated client is written to `generated/prisma` and is never edited by hand.
3. Produce the migration with `npx prisma migrate diff --from-schema <old> --to-schema <new> --script` and apply it with `npx prisma migrate deploy`, because `migrate dev` will refuse to run against the drifted checksum history (see Risks).
4. The migration is additive: one nullable column, one index, one foreign key. No existing row is read or written by it, and every existing track stays unassigned.
5. Rollback: dropping the column, its index, and its foreign key reverts the schema; no attachment is lost, because the column was the only place one was recorded. The safe direction for the feature itself is forward.

## Open Questions

None. The deferred questions — which gear the quick-upload modal preselects (`feature-124`), and whether the gear column ever reaches the owner tables — belong to the later slices and change neither this design nor this task breakdown.
