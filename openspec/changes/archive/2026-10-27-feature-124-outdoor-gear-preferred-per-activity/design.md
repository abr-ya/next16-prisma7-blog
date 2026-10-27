# Design

## Context

See `proposal.md` for the motivation. The owner settled the semantics ("предпочитаемую … для типа тренировки"), and the shape follows from the wording:

- **The scope is the activity type.** Walking shoes and running shoes are different preferences, so the key is the activity type, not the gear.
- **The direction is from the type to the gear.** The owner asks "what do I prefer for walks?", and the answer is one of their gear records — not "what do I prefer this pair of shoes for?", which would allow one pair to be preferred for several types and would need a different key.

The pieces this change builds on:

- **`Gear`** (`prisma/schema.prisma:384`) — `id`, `name`, `userId`, and a set of activity types through `GearToTrackActivityTypes`.
- **`app/_data/gear.ts`** — the owner-scoped inventory module: `getOwnerGear()`, `createGear`, `updateGear`, `deleteGear`, all resolving the owner through `requireActionUser()` and all reading their row with the owner in the `where` clause before a mutation.
- **`ensureEligibleTrackGear`** — added by `feature-122-outdoor-track-gear-assignment` in `app/_data/tracks.ts`: the ownership and compatibility check for attaching a gear record to a track.
- **The quick upload dialog** — added by `feature-123-outdoor-quick-workout-upload`: the surface where the owner picks the shoes for a workout.

Two constraints shape the work:

1. **The activity-type deletion flow only counts tracks.** `deleteTrackActivityType` (`app/_data/track-activity-types.ts:83`) refuses to delete a type that tracks still use and reassigns them; it knows nothing about gear or preferences. A preference that blocks that delete would turn it into an unchecked foreign-key violation.
2. **The `outdoor-gear` spec forbids gear in administrative listings and on every public surface.** A preference names a gear record, so it inherits that rule — with one extra step: the preference must not become a back door into somebody else's gear.

## Goals / Non-Goals

**Goals:**

- One preferred gear record per activity type, per owner, that the owner sets deliberately and can change or clear.
- The preference is a default, never a lock: the owner may pick a different pair for a single workout.
- The preference always points at gear that fits the type, and it stops pointing at gear that no longer does.
- Nothing about the preference is visible outside its owner's pages.

**Non-Goals:**

- Recording which shoes were used in past workouts beyond the attachment `feature-122` stores.
- A global default across activity types.
- Any automatic promotion of a pair into a preference.
- Changing how the gear inventory behaves, or how activity types are administered.

## Decisions

### 1. A dedicated model keyed by `(userId, activityTypeId)`

**Decision:** a new `GearPreference` model — `userId`, `activityTypeId`, `gearId`, `createdAt`, `updatedAt`, `@@id([userId, activityTypeId])`, `@@index([gearId])` — with a relation to `User`, to `TrackActivityType`, and to `Gear`.

**Why the composite key:** it *is* the rule. One row per owner and activity type means "the preferred gear for walks" is a single value, and changing it is an update of that row rather than a delete-then-insert that could momentarily leave the type with no preference. A `@@unique([userId, activityTypeId])` with a surrogate id would say the same thing and cost an extra column.

**Why the preference points at the gear instead of the gear carrying a `preferredForActivityTypeId`:** the direction of the question. The owner asks per type ("what do I prefer for walks?"). One pair of shoes may be preferred for both walking and running, which a single column on the gear record cannot express — it would take one column per type.

**Alternative considered:** a `preferredGearId` on `User`, per activity type, as JSON. Rejected — a JSON column cannot carry the foreign key, so the pointer could dangle, and the cleanup rules below would have to be written by hand.

### 2. `Cascade` on all three foreign keys

**Decision:** the preference row is deleted when the user, the gear record, or the activity type is deleted.

**Why the activity type:** `deleteTrackActivityType` counts tracks and refuses to delete a type that tracks still use. It does not count preferences, and teaching it to would modify `outdoor-track-activity-types` — a capability this change does not need to touch. With `Cascade`, deleting a type drops its preference rows and the deletion flow behaves exactly as it does today. A preference without a type has no meaning, so nothing is lost.

**Why the gear record:** the preference is a pointer at a record that no longer exists; the cascade removes the pointer rather than leaving it dangling. The gear record's own deletion is already refused while it is attached to a track (`feature-122`), so the owner clears that first — and the preference goes with the record.

**Why the user:** it matches every other owner-scoped relation in the schema (`Gear`, `Track`, `FileAsset`, `Hike` — all `Cascade`).

### 3. The preference is set deliberately, from the dialog where the shoes are picked

**Decision:** the quick upload dialog preselects the preferred gear for its activity type and offers a control — "remember these shoes for walks" — that is **off by default**. When it is on and the owner saves, the pair they picked becomes the preferred one for that activity type.

**Why deliberate:** the owner moved from "last used" to "preferred" precisely because a default should be a choice, not an accident. A control that is on by default and rewrites the preference on every save would be "last used" with extra steps — one walk in borrowed boots and the walking preference would silently become the boots.

**Why the dialog is the place:** it is where the owner already chooses the shoes for a workout, so "make this my default" is one click away from the decision it refers to. A separate preferences page would be a place the owner has to remember to visit.

**Why the control is off by default:** the dialog already preselects the current preference, so the common case — the owner is happy with the default — needs no interaction at all. The control is for the case where the owner wants to *change* the default, and turning it on is how they say so.

### 4. The preference never overrides the owner's choice for a single workout

**Decision:** the preselected pair is only the form's default. The owner may pick another pair, save, and the workout carries the pair they picked.

**Why:** the preference answers "what do I usually wear for this?", not "what did I wear this time?". A preference that overrode the per-workout choice would make it impossible to record a walk in different shoes without changing the default as well.

### 5. The compatibility rule applies to the preference too, and a stale preference is dropped rather than kept

**Decision:** a gear record may only be preferred for an activity type it fits — an unclassified gear record fits any type, a classified one fits only the types it carries. When the owner removes an activity type from a gear record, the preference for that type is dropped in the same save.

**Why the rule:** a preference that points at shoes that cannot be used for walks is noise. The rule is the same one the attachment uses (`feature-122`, decision 3), so the owner learns it once.

**Why the cleanup is automatic:** the owner removed the type from the gear record — that *is* the statement "these shoes are not for walks any more". Keeping a preference for them would contradict the edit the owner just made, and the cleanup happens in the same write, so the two never disagree.

**Alternative considered:** refusing the gear edit while a preference points at it. Rejected — it would make removing a classification a two-step operation for a reason the owner has already given.

**Why a deactivated activity type keeps its preference:** deactivation is not a deletion. The gear record keeps a deactivated type in its classification today (`outdoor-gear`), and the preference keeps it the same way; the type stops being offered for new choices and comes back if it is reactivated.

### 6. The preference is read as one owner-scoped map

**Decision:** one read, `getOwnerGearPreferences()`, returns the owner's preferences as a map from activity type id to gear id. The pages that need it fetch it in the same `Promise.all` as the rest of their data.

**Why:** the quick upload dialog needs the preference for one activity type, and the gear page needs the preferences for all of them. One query, one owner scope, no per-activity-type round trip. The owner is resolved from the session — the client never sends an owner id, and there is no query that could return somebody else's preference.

### 7. The gear page shows the preference, and can clear it

**Decision:** the gear list marks the preferred item for each activity type with a badge ("Default for walking"), and the badge carries a control that clears the preference.

**Why:** a preference the owner cannot see is a setting they cannot trust. The quick upload shows it by preselecting, but the owner has no way to ask "which shoes are my walking shoes?" — except by opening a dialog and reading a select. The gear page is the inventory; the preference belongs on it.

**Why the clear action is here and not only in the dialog:** the dialog's control only writes a preference; it never removes one. Without a clear action, a preference could only be replaced, never dropped — and a stale default would follow the owner around.

### 8. The private rule is enforced by the data flow, not by remembering to hide a badge

**Decision:** the preference is read only on the two owner surfaces — `My workouts` and `My gear` — and it is written only through owner-scoped actions.

**Why:** a preference names a gear record, and the `outdoor-gear` spec keeps gear out of every public page and every administrative listing. The administrative track panel is the same component as the owner one, so the guarantee has to come from the data: the admin page never receives a preference map, so there is nothing there to render by accident.

### 9. The preference is its own capability, not a requirement of the inventory

**Decision:** the change adds the capability `outdoor-gear-preferences` rather than extending `outdoor-gear`.

**Why:** the inventory capability describes records and their CRUD. A preference is a relation between a type and a record, with its own rules (one per type, compatibility, cleanup, privacy) — a different subject with a different lifetime. Keeping it separate also keeps the two deltas from touching the same requirement, which is what makes them merge cleanly.

## Risks / Trade-offs

- **[The owner has to remember to tick "remember these shoes"]** → The control is only needed when the owner wants to *change* the default; the common case needs no interaction. The gear page shows the current default, so the owner can also change it there by editing the item's types or by using the dialog once.
- **[A preference can point at gear that is not classified for the type]** → The server refuses such a preference, and the cleanup drops it when the classification changes. The two rules cannot disagree, because both are checked against the same compatibility helper.
- **[The owner deactivates an activity type and its preference lingers]** → The preference stays, as the gear record's classification stays. It is invisible while the type is inactive (there is no quick upload button for an inactive type) and becomes meaningful again if the type is reactivated.
- **[The preselection can be wrong for one specific walk]** → That is the point of decision 4: the owner changes the selection for that walk, and the preference is untouched unless they ask for it to change.
- **[One more table for one pointer]** → The alternative — a JSON column on the user — loses the foreign key and the cascades, and the cleanup rules would have to be hand-written for every way a gear record or a type can disappear.
- **[The quick upload dialog grows a second control]** → The dialog gains one checkbox and no new field type; it stays a three-field form.

## Migration Plan

1. Add `model GearPreference` to `prisma/schema.prisma` with the three relations and the back-relations on `User`, `TrackActivityType`, and `Gear`.
2. `npx prisma generate` — the generated client is written to `generated/prisma` and is never edited by hand.
3. Produce the migration with `npx prisma migrate diff --from-schema <old> --to-schema <new> --script` and apply it with `npx prisma migrate deploy`, because `migrate dev` will refuse to run against the drifted checksum history on `20261013211113_feature_112_outdoor_track_creation_public_metadata`. **Do not reset the database.**
4. The migration is additive: one new table with its index and its three foreign keys. No existing row is read or written by it, and every existing track and gear record is untouched — a track that already carries gear does not gain a preference.
5. Rollback: dropping the table reverts the schema. Nothing else is lost, because the table holds only preferences the owner set through the UI.

## Open Questions

None. The deferred questions — whether the preference ever applies to a route as well as a workout, and whether the quick upload may publish directly — belong to other slices and change neither this design nor this task breakdown.
