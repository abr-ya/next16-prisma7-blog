# Proposal

## Why

**The quick upload asks the owner to pick their shoes every single time.** The flow `feature-123-outdoor-quick-workout-upload` builds ends with a saved walk, and the shoes are part of that save — so the owner picks them. But the answer is almost always the same pair, and the owner has to say it again on every walk.

The first instinct was to remember the *last* pair used. That is the wrong thing to remember: "last used" is a fact about the order of events, not about what the owner wants, and it drifts — one walk in the wrong shoes, one walk recorded with borrowed boots, and the default is silently wrong. The owner asked for something better and said so directly: **remember the *preferred* shoes for the type of the workout**.

That is a different object with a different shape. It is scoped to an activity type, not to a moment: the walking shoes are the walking shoes whether the last walk was yesterday's or today's, and the running shoes are a separate preference for a separate type. It is also deliberate rather than incidental — the owner chooses it, and it stays chosen until the owner changes it.

The storage follows from the wording. One preference per activity type, pointing at one of the owner's own gear records. Nothing more: no "last used" pointer on the user, no per-activity-type copy of the gear list, no global default that would apply to every type at once.

## What Changes

- **A preference is stored per activity type.** The system keeps, for each activity type, the one gear record the owner prefers for it. The preference is owned by the owner, points at one of their own gear records, and is created, changed, or cleared by them alone.
- **The quick upload preselects it.** When the owner opens the quick upload for a walk, the walking shoes are already selected. The owner can still choose another pair for this walk — the preference is a default, not a lock.
- **The owner can change the preference where they chose the shoes.** The quick upload offers a control that turns the pair they just picked into the preferred one for that activity type. It is off by default: nothing changes the preference unless the owner asks for it.
- **The owner can see it.** The gear page marks the preferred item for each activity type, and lets the owner clear the preference when it is stale.
- **A preference always fits its activity type.** The same compatibility rule as the attachment applies: an unclassified gear item fits anything, and a classified one fits only the activity types it carries.

### Non-goals

- **No "last used" tracking.** The owner moved away from it deliberately; nothing records which shoes a past workout used beyond the attachment `feature-122` already stores.
- **No global default.** There is no "the shoes I always wear" that applies to every activity type — the preference is per type, and the two most common cases (walking shoes, running shoes) stay separate.
- **No public exposure.** The preference is owner-private. It never reaches a public page, a public track, a shared feed, or an administrative listing — it names a gear record, and gear is private.
- **No per-gear defaults on the gear record.** The preference is a pointer from an activity type to a gear record, not a column on the gear record; one pair of shoes can be preferred for several types.
- **No automatic promotion of a preference.** Picking a pair once does not make it the default; the owner says so.
- **No mileage, wear, or lifecycle statistics.** Nothing is computed from gear yet.

## Capabilities

### New Capabilities

- `outdoor-gear-preferences` — one preferred gear record per activity type and owner: how it is set, how it is shown, when it is dropped, and the rule that keeps it private.

### Modified Capabilities

None. `outdoor-gear` keeps its current requirements — this change stores a pointer to a gear record, not a change to the gear record itself. The only interaction is the cleanup rule when the owner changes a gear item's activity types, which is stated inside the new capability.

## Impact

- **Schema**: one new Prisma model, `GearPreference`, keyed by `(userId, activityTypeId)` and pointing at one gear record. One additive migration; no existing table is altered and no existing row changes.
- **Data layer**: `app/_data/gear.ts` gains the owner-scoped read, the set / clear actions, and the cleanup inside `updateGear` that drops a preference whose activity type no longer fits the gear record.
- **Components**: the quick upload dialog gains the preselection and the "remember these shoes" control; the gear panel gains the per-activity-type badge and the clear action.
- **Routes**: none. Both surfaces already exist.
- **Public surfaces**: none. The preference names a gear record, and gear never leaves its owner's pages.
- **Depends on**: `feature-121-gear-personal-inventory` (the records being pointed at), `feature-122-outdoor-track-gear-assignment` (the compatibility rule and the attachment the quick upload writes), `feature-123-outdoor-quick-workout-upload` (the dialog the preselection and the control live in), `feature-101-outdoor-track-activity-types` (the types the preference is keyed by).
