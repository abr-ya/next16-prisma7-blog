# Proposal

## Why

**A track records what happened, but never what the owner wore or rode.** Every owner of running shoes or a bicycle has the same question their records cannot answer: which pair did I take out on that 12 km morning run, and which of the three is still good for the trail? The activity type on a track answers "running", not "which shoes".

The track domain already has the classification vocabulary (`TrackActivityType` — running, cycling, hiking) and the owner-only private-surface pattern (`/my/tracks`, `/my/workouts`). What is missing is the other half of the pair: a private inventory of the physical equipment an owner actually uses. Without it, "the equipment I used for this training" cannot be expressed at all, and no mileage or wear statistic can ever be computed.

This is the foundation slice of a three-part series: the inventory first (this change), the assignment of gear to tracks second, the extended fields and the brand dictionary third. The MVP deliberately keeps the inventory to a name and a set of activity types so the later slices stay additive — no field is removed or reshaped once it exists.

## What Changes

- **A new `Gear` model holds one item of equipment.** A record has a required display name, any number of activity types borrowed from the existing `TrackActivityType` dictionary — the same shoes serve for running and for walking — and an owner. It carries no brand, model, size, or year — those arrive as nullable columns in a later slice, so nothing has to be migrated or rewritten later.
- **A new private page `/my/gear` lists and manages the owner's gear.** It offers create, edit, and delete over the owner's own rows, in the same shape as the other owner pages (`/my/tracks`, `/my/workouts`).
- **The user menu gains a `My gear` entry** next to `My tracks` and `My workouts`, so the inventory is reachable from the same place as the rest of the owner's private pages.
- **Gear is private to its owner.** Another signed-in user can neither see nor touch it, and no gear ever reaches a public page, a public track, or an admin listing. The activity types on a gear record are borrowed dictionary values used for grouping and later hints — they are not new classifications the owner invents.

### Non-goals

- **No brand, model, size, or year fields.** Deferred to a follow-up slice; the columns will be added as nullable so no existing row changes.
- **No brand dictionary.** The admin-managed brand list (`key` / `nameEn` / `nameRu` / `isActive`, mirroring `TrackActivityType`) is its own slice with its own admin surface.
- **No assignment of gear to tracks.** The inventory stands on its own here; attaching a pair of shoes to a run is the next slice.
- **No mileage, wear, or lifecycle statistics.** Nothing is computed from gear yet, so nothing is stored for it.
- **No photos or images.** A gear record is a name and a set of types, not a media item.
- **No admin surface for personal gear.** Gear is personal, not a global catalogue; there is nothing for an administrator to manage.
- **No public visibility rules.** Gear has no public page and no public representation — it is private data, not a publishable one.

## Capabilities

### New Capabilities

- `outdoor-gear` — a private, owner-only inventory of personal equipment: the records, the owner's CRUD over them, and the rule that gear is never visible outside its owner's pages.

### Modified Capabilities

None. `outdoor-track-activity-types` keeps its current requirements — this change only *reads* the active activity types as a lookup list; it does not change how they are created, renamed, deactivated, or deleted.

## Impact

- **Schema**: one new Prisma model, `Gear`, with an owner relation, and the `GearToTrackActivityTypes` join model that carries its set of activity types; `TrackActivityType` gains the matching back-relation. Two additive migrations: the first creates `Gear`, the second creates the join table and carries the existing rows' activity type into it. No existing table changes, no existing row is lost.
- **Routes**: one new page, `/my/gear`, inside the existing `(public)` route group but behind authentication — the same shape as `/my/tracks` and `/my/workouts`.
- **Data layer**: a new `app/_data/gear.ts` with the owner-scoped list / create / update / delete helpers, following the ownership check the track helpers already perform.
- **Components**: the owner-facing gear table and its create/edit dialog, plus one `My gear` entry in the user menu.
- **Public surfaces**: none. No gear data is written into a public track, a public page, or a shared feed.
- **Depends on**: `feature-101-outdoor-track-activity-types` (the activity-type dictionary the optional type is drawn from). Does **not** depend on `feature-120-track-workout-kind` — the assignment slice needs the kind, the inventory does not.
