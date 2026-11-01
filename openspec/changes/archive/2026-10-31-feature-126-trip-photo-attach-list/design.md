# Design

## Context

The admin trips page renders one **Manage photos** dialog per trip row (`components/admin-pages/hikes-admin-panel.tsx`). The dialog has two sections:

- **Attached photos** — the photos already associated with the trip being managed, in the trip's stored order.
- **Available photos** — every photo in the workspace that is *not* associated with that trip, each with an **Attach** button.

The available list is computed client-side as `photos.filter((photo) => !associatedPhotoIds.has(photo.id))`, where `photos` is the `HikePhotoOption[]` payload the page loaded once through `getHikePhotoOptions()`. That payload carries a photo's identity, title, status, track-time match, map coordinate, and preview image — but nothing about the trips the photo is on. So today the dialog cannot tell a genuinely unused photo from a photo that is already on three other trips; it lists both, and the administrator has to recognize titles.

The workspace already stores the missing fact: `HikesToPhotos` is the join table between trips and photos, keyed `@@id([hikeId, photoId])`, with a per-association `position`. A photo may be attached to several trips at once, and the live `outdoor-hike-media-map` spec already states that *"the same photo may keep a different order when associated with another hike"*. Multi-trip photos are a supported, ordinary state — not an error.

## Decision: what the default available list contains

The request is that the "можем прикрепить" list not show, by default, the photos that are already attached to other trips.

**Chosen: the default available list omits the photos that are associated with at least one other trip, and a control in the section header reveals them together.**

The omitted photos are not removed from the workspace and not made unattatchable — the reveal control brings them back into the same list, with the same **Attach** button and the same behavior. The trip being managed is the reference point: a photo already attached to *this* trip lives in the **Attached photos** section and is not part of the available list at all, so "attached to another trip" means "attached to some trip other than the one being managed".

Rejected alternatives:

- *Refuse to attach a photo that is on another trip.* That contradicts the live spec's multi-trip scenarios and turns a listing default into a data rule. It would also need a server-side rule and an error path, for no gain: the administrator can already reach the photo through the reveal control.
- *Hide the omitted photos with no way to reveal them.* The photo is a legitimate candidate for a second trip — the workspace records each trip's own ordering for it — so a permanent hide would remove a supported action from the UI.
- *Show a badge on each photo naming the trip it is on.* Adds a per-row field and a second data shape (trip titles) for a question the request did not ask. The count in the reveal control is enough to tell the administrator that something is being held back.

## Decision: how the panel learns which trips a photo is on

The photo option payload is the only channel between the server and the dialog, and it is loaded once per page render.

**Chosen: `getHikePhotoOptions` selects each photo's `HikesToPhotos` rows and returns the associated hike ids alongside the existing fields.**

The association is selected as `hikes: { select: { hikeId: true } }` — ids only, no trip title, no ordering, nothing the panel would have to join. The panel compares those ids against the id of the trip it is managing.

The alternative — a second query that returns a photo-id → hike-ids map — would split one payload across two round trips and add a second server helper for the same page. Extending the existing payload keeps one query, one type, one prop.

`getAllHikes` filters by the session user's own hikes, so the *trip list* the panel renders is owner-scoped. The photo option query is admin-scoped (`getRequiredAdminUserId`) and returns every photo in the workspace. Those two scopes do not have to agree: a photo owned by somebody else, or attached to a trip the administrator does not own, still carries its association ids, and the panel still hides it by default. This asymmetry is deliberate and is the reason the association is read from `HikesToPhotos` rather than derived from the rendered trip list.

## Decision: where the reveal control lives and what it says

The control sits in the **Available photos** section header, next to the section title, and is a checkbox in the same visual language the admin panels already use (`<input type="checkbox" className="… accent-primary">`, as in `content-tags-inventory.tsx` and `tags-legacy-migration-panel.tsx`). It is a plain checkbox rather than a Radix `Switch` so no new UI primitive is introduced for one control.

The label names the count of the omitted photos, so the administrator can tell whether anything is being held back without opening the section. The label is a plain string; the admin trips panel is English-only today (no `useTranslation` in `components/admin-pages/`), so this change adds no localization surface.

The control is hidden entirely when there is nothing to reveal — with no photo attached to another trip, the section is unchanged from today. When photos are omitted and the control is unchecked, the section's empty state says so instead of claiming that every available photo is already attached, because that claim is no longer true.

## Decision: the state of the reveal control

The control's state is client state in the dialog, reset to unchecked whenever the dialog opens.

Resetting on open keeps the "by default" promise honest: the dialog always starts from the narrowed list, and an administrator who revealed the omitted photos for one trip does not find them revealed for the next trip they open. The existing dialog already resets its per-trip state (`attachedPhotoIds`) on open through the same effect, so the reset rides along there.

## Data model

No change. No Prisma schema edit, no migration, no new column. `HikesToPhotos` already stores the association; the change reads it.

## Server/client boundary

`getHikePhotoOptions` stays a server-side helper behind `getRequiredAdminUserId`, so the association ids are still fetched under the administrator check. The payload grows by one id array per photo; the panel filters it client-side, which is what the dialog's existing filtering already does.

## Security and visibility

No new route, no new permission, and no change to who may attach a photo to a trip. The payload is already admin-only, and it now also carries the trip ids a photo is on — ids the administrator can already reach through the trip list and the trip's own attached photos. No public surface reads the photo option payload.

## Data preservation

Nothing is written. The change only alters which rows the available list renders by default, and the association rows it reads are untouched.

## Risk

Low. The query gains one relation select on an existing join table; the panel's filtering is local. The main edge case is a photo that is attached to the trip being managed *and* to another trip — it belongs to the **Attached photos** section and is never part of the available list, so it is unaffected by the omission.
