## Why

Trip creators and accepted participants need to contribute their own photos while viewing the trip, rather than routing every submission through the admin photo workflow. A conservative per-person limit keeps the first contribution surface predictable and prevents one account from overwhelming a trip gallery.

## What Changes

- Add an authenticated photo-upload workflow on published `/trips/[slug]` pages for the trip creator, accepted participants, and administrators.
- Create and attach submitted image-backed photo records to the current trip through the existing first-party file and outdoor-photo workflows.
- Enforce a default maximum of 10 contributed photos per non-admin user per trip, counting each created photo record (not each image inside its existing one-to-three-image model).
- Keep the trip creator and accepted participant authorization checks server-side; reject anonymous, non-member, and inactive-membership submissions.
- Present upload failures, including a reached contribution limit, without creating a partial photo or hike-photo association.

### Non-goals

- Rating-, activity-, post-, or like-based quota increases; this becomes a separately prioritized backlog candidate after the base limit is proven.
- Participant uploads to draft trips, public upload access for guests, or participant GPX track uploads.
- Changing the existing admin photo workflow, one-to-three-images-per-photo model, gallery ordering tools, or existing public image/viewer access boundaries.
- Email notifications, moderation queues, or automatic publication review beyond the existing photo-status behavior.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-hike-media-map`: Add creator/accepted-participant photo contribution from a public trip detail surface, including authorization and per-user trip quota behavior.
- `outdoor-photos`: Define how public trip submissions create and attach existing image-backed photo records without changing the photo asset model.

## Impact

- Affected route: authenticated contribution controls and server actions on `/trips/[slug]` (with legacy hike routing remaining compatible).
- Affected data: photo ownership/creation and trip-photo association queries; no rating model or quota-override schema is introduced in this slice.
- Affected server/UI areas: trip detail data/actions, UploadThing/file-asset upload validation, outdoor photo creation helpers, and public trip detail components.
