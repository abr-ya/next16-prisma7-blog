# Tasks

## 1. Photo option payload

- [x] 1.1 In `app/_data/hikes/types.ts`, add `attachedHikeIds: string[]` to `HikePhotoOption`, and add the matching `hikes: { hikeId: string }[]` to `HikePhotoOptionRecord`.
- [x] 1.2 In `app/_data/hikes/queries.ts`, extend the `getHikePhotoOptions` select with `hikes: { select: { hikeId: true } }` and map it to `attachedHikeIds: photo.hikes.map((association) => association.hikeId)`. Leave every other selected field and the ordering unchanged.
- [x] 1.3 Confirm the association ids are the raw `HikesToPhotos.hikeId` values — no trip titles, no ordering, no extra join — so the payload stays a set of ids.

## 2. Admin dialog

- [x] 2.1 In `components/admin-pages/hikes-admin-panel.tsx`, add a `showOtherTripPhotos` state (default `false`) to the manage-photos dialog.
- [x] 2.2 Reset that state to `false` in the existing effect that runs when the dialog opens, alongside the `attachedPhotoIds` reset.
- [x] 2.3 Split the available list: a photo is *held back* when `attachedHikeIds` contains a hike id other than the id of the trip being managed. A photo attached to the trip being managed is already excluded by the existing `associatedPhotoIds` filter.
- [x] 2.4 Render the held-back photos in the **Available photos** section only when the reveal control is checked; otherwise render the unchanged list.
- [x] 2.5 Add the reveal control to the **Available photos** section header: a checkbox in the admin panels' existing style, labeled with the number of held-back photos. Render the control only when at least one photo is held back.
- [x] 2.6 Update the section's empty state so it does not claim that every available photo is already attached while photos are being held back.

## 3. Validation

- [x] 3.1 `npm run tsc` — expect no type errors.
- [x] 3.2 `npx eslint app/_data/hikes/queries.ts app/_data/hikes/types.ts components/admin-pages/hikes-admin-panel.tsx --quiet` — expect no errors.
- [x] 3.3 `npm run lint` — expect no errors.
- [x] 3.4 `npx openspec validate feature-126-trip-photo-attach-list --strict` — expect the change to validate.

## 4. Browser check (the owner's)

- [ ] 4.1 Open `/admin/trips`, open **Manage photos** for a trip that has photos attached to other trips, and confirm the **Available photos** list no longer shows them, that the reveal control reports how many are held back, and that checking it lists them with a working **Attach** button.
- [ ] 4.2 Confirm the **Attached photos** section and its ordering are unchanged, that attaching and detaching still work, and that a trip whose photos are on no other trip shows no reveal control.
