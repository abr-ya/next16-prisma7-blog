# Proposal

## Why

**The gear inventory answers "what do I own"; nothing yet answers "what did I wear for this walk".** `feature-121-gear-personal-inventory` shipped the private list of shoes and bicycles, and the `outdoor-track-gear-assignment` candidate has been waiting in the backlog since that slice landed. The pairing is what makes the inventory worth keeping: a track that names the pair of shoes it was run in is a record the owner can come back to ("which shoes did the 12 km on the 3rd of May actually wear"), and it is the precondition for every later gear statistic — mileage, wear, replacement.

The shapes for both sides already exist and are deliberately simple: a track already carries an optional activity type (`Track.activityTypeId`, borrowed from the admin-managed dictionary) and a gear item already carries a *set* of activity types (`GearToTrackActivityTypes`) — the same shoes serve for running and for walking. What is missing is the single link between them, and the rules that keep the link honest: only the owner's own gear may be attached, a track's activity type and a gear item's activity types must not contradict each other, and an attachment the owner did not make must never be silently dropped.

This slice adds the link and the rules. It does not build the quick-upload flow on top of it (`feature-123-outdoor-quick-workout-upload`) and it does not remember which shoes the owner prefers for a given activity type (`feature-124-outdoor-gear-preferred-per-activity`) — those two build on the link this change creates.

## What Changes

- **A track may carry one gear item.** `Track` gains a nullable `gearId` pointing at one `Gear` record. A track without a gear stays exactly as it is — unassigned tracks are the normal case, not a degraded one.
- **The owner attaches gear from the track form.** The owner-facing track form (`/my/tracks`, `/my/workouts`) gains a `Gear` select offering the owner's own gear, narrowed to the gear that fits the activity type selected in the same form. The admin track surface keeps no gear field and never receives gear data at all.
- **The server is the authority.** An attachment is accepted only when the gear belongs to the signed-in owner and when the gear's activity types do not contradict the track's activity type. A hand-crafted request cannot attach somebody else's shoes, and the browser's filtered list is a convenience, not the rule.
- **An attachment is never dropped behind the owner's back.** Deleting a gear item that is still attached to a track is refused until the owner clears the attachment, and changing a track's activity type to one the attached gear does not fit is refused for the same reason. Both refusals name what to clear.

### Non-goals

- **No gear column in the track tables.** The assignment is visible and editable in the owner track form; the admin and owner tables stay exactly as they are. A column would also put a gear name into the admin payload, which the `outdoor-gear` spec forbids.
- **No public exposure.** Gear never reaches a public track page, a public list, a shared feed, or an administrative listing. The relation is owner-private on both sides.
- **No preferred-gear memory.** Which shoes the owner likes for which activity type is `feature-124-outdoor-gear-preferred-per-activity`; this change stores the attachment, not a preference.
- **No quick-upload modal.** The one-click upload flow is `feature-123-outdoor-quick-workout-upload`; it will attach gear through the server path this change adds.
- **No brand, model, size, or year.** Those stay in the `outdoor-gear-extended-fields` candidate.
- **No multiple gear items per track.** One track names one pair of shoes. A join table would allow several, which the owner did not ask for and which would multiply every rule above.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks` — a track may carry one gear item, assigned and cleared by its owner under server-authoritative ownership and activity-type rules.
- `outdoor-gear` — a gear item that is attached to a track can no longer be deleted until the owner clears the attachment.

## Impact

- **Schema**: one nullable column on `Track` (`gearId`) with a foreign key to `Gear` and an index, plus the matching back-relation on `Gear`. One additive migration; no existing table is altered and no existing row changes.
- **Data layer**: `app/_data/tracks.ts` gains a private `ensureEligibleTrackGear` guard and carries `gearId` through `TrackActionValues`, `createTrack`, and `updateTrack`; `app/_data/gear.ts` refuses to delete a gear item that is still attached. The owner-scoped track list queries gain an opt-in `includeGear` projection — the admin query does not use it, so no gear name enters the admin payload.
- **Components**: one shared gear select used by the owner track form; the shared track panel takes the owner's gear as an optional prop and renders the field only when it is given.
- **Routes**: none. The change touches the two owner pages that already host the track form; no public route reads the new column.
- **Public surfaces**: none. The public track read path does not select `gearId`.
- **Depends on**: `feature-121-gear-personal-inventory` (the inventory and its activity-type set), `feature-101-outdoor-track-activity-types` (the dictionary the compatibility rule is checked against), `feature-120-track-workout-kind` (the kind is what makes "the equipment I used for this training" a meaningful pairing).
