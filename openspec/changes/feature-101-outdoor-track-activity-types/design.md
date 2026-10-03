# Design

## Context

See [proposal.md](./proposal.md) for motivation. `Track` currently stores GPX, visibility, parse metadata, recording timezone, owner, and trip associations, but no activity classification. `Hike` (presented publicly as Trip) has a fixed `HikeType` enum, which is a separate trip-level concept. Existing `/admin/tracks` and `/my/tracks` reuse the same owner-scoped management panel and server actions; administrator-only controls are separated by the workspace access policy.

## Goals / Non-Goals

**Goals:**

- Add a reusable, administrator-controlled activity-type catalog for individual tracks.
- Preserve existing records with a nullable classification and no inferred values.
- Keep lifecycle mutations and owner classification server-authorized.
- Make a later owner-track filter and GPX-derived slug suggestion able to rely on a stable activity-type identity.

**Non-Goals:**

- Replacing, migrating, or synchronizing the `HikeType` enum.
- Public type display, discovery, search, or filtering.
- Automatic classification from GPX content, trip type, title, or filename.
- A generic taxonomy system shared with posts, videos, photos, or trips.

## Decisions

### Use a dedicated relational catalog and nullable foreign key

Add `TrackActivityType` with a unique normalized key, required `nameEn`, optional `nameRu`, `isActive` flag, and timestamps. Add nullable `Track.activityTypeId` referencing that table with a restrictive delete policy. This gives types stable identities across renames and permits deactivation without losing existing assignments.

Alternative considered: a Prisma enum on `Track`. Rejected because administrators need to add, rename, and deactivate values without a schema migration or deployment.

Alternative considered: a free-text track field. Rejected because it would create inconsistent spellings and cannot safely support later filters or slug suggestions.

### Preserve current data as `NULL`, not a placeholder record

The forward migration adds the nullable relation without backfilling. Management UI renders a missing relation as `Unclassified` or `Not selected`; it is not stored as a synthetic catalog record. This avoids assigning incorrect values and keeps the empty state semantically distinct from a genuine `Other` activity.

Alternative considered: infer type from the associated trip's `HikeType`. Rejected because a single trip can contain tracks with different activities, and trip types use different semantics.

### Separate type lifecycle from track ownership

Administrator-only server actions manage catalog records and protect the management route. Existing track create/update actions accept an optional type ID, validate that a selected type exists and is active, and retain their existing owner-or-administrator authorization. Normal users can read active options only in the context of their own track form; an administrator can select types while editing tracks allowed by the workspace policy.

Alternative considered: let every user create activity types as needed. Rejected because it would fragment the shared vocabulary and make moderation/merging necessary immediately.

### Make deletion explicit and atomic for assigned types

An unused type may be deleted directly. For an assigned type, the administrator must explicitly choose a replacement active type or clear the association; the server performs reassignment/clearing and deletion in one transaction. A plain delete is rejected when references exist.

Alternative considered: cascade deletion and silently clear tracks. Rejected because it destroys meaningful classification without an administrator decision.

### Localize catalog names with English as the fallback

Administrators maintain the required English name and optional Russian translation for every type. UI reads the Russian value only for Russian locale when it is non-empty; otherwise it displays English. The unique key is derived from the normalized English name, so Russian translations do not affect identity, URLs, or future slug suggestions.

Alternative considered: storing localized names in JSON. Rejected because this feature supports exactly two existing interface locales and explicit columns make validation and administration simpler.

### Seed a small initial catalog without coupling to legacy enums

The data migration seeds a reviewable starter set such as Walking, Running, Cycling, Skiing, Rowing, and Other, with Russian translations. Names are managed records rather than enum values, so administrators can adjust the catalog later. The seed is idempotent and does not modify tracks or trip types.

Alternative considered: leave the catalog empty. Rejected because first-use setup would make the track form appear broken and delay the feature's practical value.

## Risks / Trade-offs

- [Renaming can make historic labels appear to change] → Stable IDs preserve the assignment; the administrator-facing UI will make rename scope clear before save.
- [Deactivating a type could hide an existing track's value] → Reads include the assigned inactive type; only new selection lists are restricted to active types.
- [A migration or seed is rerun] → Use a forward Prisma migration with unique constraints and idempotent inserts; never edit applied migrations.
- [Client options become stale before save] → The server revalidates activity-type existence and active status for every track mutation.
- [An ordinary user calls administrator endpoints directly] → Apply the existing server-side administrator gate independently of navigation visibility.

## Migration Plan

1. Keep the applied catalog migration immutable; add a second forward migration that renames `name` to `nameEn`, adds nullable `nameRu`, and preserves existing English values.
2. Add Russian translations for starter rows with conflict-safe updates; leave every existing track relation `NULL`.
3. Deploy server validation and management UI together so a type can never be selected without server enforcement.
4. Roll back application behavior by hiding the new controls if necessary; preserve the new nullable column and catalog records rather than deleting classifications or rewriting the migration history.
