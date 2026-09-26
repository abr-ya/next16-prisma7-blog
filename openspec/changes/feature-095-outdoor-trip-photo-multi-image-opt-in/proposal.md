# Proposal

## Why

Trip contributors normally create one photo record from one image. The current contribution dialog immediately accepts up to three images, making accidental multi-image uploads too easy. Make the ordinary path deliberately single-image while preserving the existing grouped-photo model when a contributor explicitly chooses it.

## What Changes

- Make the public trip photo-contribution dialog on `/trips/[slug]` accept one image by default.
- Add an unchecked, clearly labelled opt-in control that enables a contributor to upload a second or third image as the same photo record.
- Keep the existing maximum of three images, server-side authorization, ownership, publication, trip association, per-trip photo-record quota, and EXIF compatibility unchanged.

### Non-goals

- Changing the administrator photo create/edit form or its existing one-to-three-image behavior.
- Changing the `Photo` data model, UploadThing endpoint-wide maximum, existing photo records, or the 10-photo-per-user-per-trip quota.
- Adding a reputation-based or tiered contribution quota.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-hike-media-map`: Change the public trip contribution dialog from unconditional one-to-three-image upload to single-image-by-default with an explicit multi-image opt-in.
- `outdoor-photos`: Change the trip-submitted photo interaction while retaining the existing one-to-three-image storage model.

## Impact

- Affected public route: `/trips/[slug]` (currently implemented through the compatible hike detail module).
- Affected UI: `HikePhotoContributionButton` and its shared `PhotoUploadDialog` usage, scoped only to the public trip contribution flow.
- Affected validation: client-side selectable/uploadable image count; the existing server-side one-to-three image validation remains the authoritative data-integrity boundary.
- No Prisma migration, API contract, dependency, or admin-surface change is expected.
