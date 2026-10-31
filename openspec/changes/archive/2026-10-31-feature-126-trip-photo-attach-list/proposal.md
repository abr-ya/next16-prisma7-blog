# Proposal

## Why

The admin **Manage photos** dialog for a trip lists every photo in the workspace that is not already attached to that trip, so a photo that already belongs to another trip appears side by side with a genuinely unused one. Administrators re-attaching an existing trip's photo therefore have to scan for the title they already know, and the list grows with every trip a photo has been used on. The workspace already records those associations — the same photo may be linked to several trips, and each trip keeps its own ordering for it — so the admin surface can show the distinction instead of hiding it.

## What Changes

- In the admin trip **Manage photos** dialog, the photos offered for attachment no longer include, by default, the photos that are already associated with another trip.
- The **Available photos** section gains a control that reveals the omitted photos, so an administrator who wants to re-use a photo from another trip can still attach it.
- The photos attached to the trip being managed, their order, and every attach, detach, and reorder action stay exactly as they are; the omission is a default view, not a restriction.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: The admin trip photo-association surface separates the photos available to attach from the photos that already belong to another trip, and lets the administrator reveal the latter on demand.

## Impact

- Affected surface: the admin trips page (`/admin/trips`, and the `/admin/hikes` path it shares) and its **Manage photos** dialog.
- Likely implementation areas: `app/_data/hikes/queries.ts` (the photo option query and its payload), `app/_data/hikes/types.ts` (the option type), `components/admin-pages/hikes-admin-panel.tsx` (the dialog's available-photos section).
- No Prisma schema, migration, new dependency, new route, or public behavior change. The `HikesToPhotos` rows the filter reads are already stored and already mean "this photo is on that trip".

## Non-goals

- No restriction on attaching a photo that is also on another trip: the reveal control makes those photos attachable again, and the existing per-trip ordering and the multi-trip associations stay untouched.
- No indication of *which* trip a photo belongs to, and no per-photo badge for it — the reveal control and its count are the whole addition.
- The admin photo list, the public trip gallery, the public map markers, and the photo upload path are unchanged.
