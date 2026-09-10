## Context

See `proposal.md` for motivation and the delta specs for behavior. Feature-070 provides `HikeParticipant` invitation lifecycle and `isAcceptedHikeParticipant`; public Trip routes are aliases over the retained internal `Hike` domain. Existing photo creation is admin-only, owns one-to-three `OUTDOOR_PHOTO_IMAGE` file assets, and photo-to-trip association already stores an ordered position. UploadThing's existing outdoor-photo endpoint authenticates and records private file assets but is not trip-scoped.

## Goals / Non-Goals

**Goals:**

- Reuse the existing photo file, model, gallery, and participant primitives rather than create a parallel contributor-media domain.
- Make authorization and quota enforcement server-authoritative and safe against direct action calls and races.
- Leave no new partial photo/association records after a failed contribution.

**Non-Goals:**

- New Prisma tables, a quota-override/rating model, per-file quota accounting, moderation states, or a participant track contribution path.
- Reordering, editing, deleting, or changing the visibility of a participant's contribution from this page.

## Decisions

### Use a dedicated trip contribution server action and a shared photo dialog

Extract the admin photo dialog's common title, optional description, one-to-three-image selection, and UploadThing UI into a reusable dialog/form component with explicit modes. The existing administrator mode retains status, EXIF refresh, create/update, and other administrator-only behavior. The trip-contribution mode is opened from a compact `Add photo` trigger on the public trip detail page and submits only the contribution-safe payload to the dedicated action.

Render the trigger only when a server-derived capability result says the current user is creator, accepted participant, or admin. A dedicated server action receives the trip identity, title/optional description, and uploaded file-asset ids. It reloads session, trip, role, membership, and file ownership/eligibility; dialog visibility is never authorization. A quota-reached eligible user sees an explanatory disabled trigger rather than an open contribution dialog.

Alternative: expose the existing admin `createPhoto` action. It is intentionally admin-only and lacks trip context, contribution authorization, quota enforcement, and atomic association.

### Create published standard photos in one database transaction

The action validates the existing one-to-three image-asset constraints, creates one `Photo` owned by the submitter with `PUBLISHED` status, creates ordered `PhotoImage` bindings, and creates the next `HikesToPhotos` association in one transaction. The action reuses existing safe file-asset ownership rules. On success, revalidate the trip/hike detail and relevant photo/admin paths.

Photos publish immediately because the purpose is direct contribution to the public trip gallery. A moderation workflow would require an explicit draft/review surface and is outside the accepted feature.

### Enforce ten-record quota transactionally, with admins exempt

For non-administrators, the contribution transaction serializes quota allocation for the `(trip, user)` pair (for example by locking the trip/user scoped count source or using a database-enforced allocation strategy), counts associations whose photos are owned by the submitter, and only creates the record if fewer than 10 exist. The creator uses the same non-admin limit. Administrators retain an operational override and are not limited through this public contribution path.

Alternative: perform a count before the transaction. Concurrent requests could both observe remaining capacity and exceed the limit. Alternative: count image assets. That conflicts with the existing multi-image `Photo` unit and would make a one-to-three-file submission inconsistently priced.

### Preserve uploaded files after rejected creation

UploadThing records files before form submission. A rejected quota or form action does not delete those assets automatically; they remain private, user-owned, unbound assets managed by the existing file lifecycle. The client explains that the contribution was not created and allows a later retry when eligible.

Alternative: delete files on rejection. Upload and action failure paths are independent, and automatic deletion risks removing a user asset after an ambiguous network result; a future cleanup feature can address abandoned uploads deliberately.

## Risks / Trade-offs

- Orphaned uploaded file assets after a quota rejection → Keep them private and rely on the existing file lifecycle; do not risk destructive automatic cleanup.
- A naive count can allow a race above ten → Serialize allocation inside the write transaction and include concurrent-submission verification.
- Immediate publication can expose unsuitable content → This is the intentionally selected direct-contribution policy; moderation is a separate product decision.
- Existing public page uses legacy `/hikes` implementation behind Trip compatibility → Keep route aliases and revalidation paths aligned so neither public URL serves stale gallery data.

## Migration Plan

1. No schema migration is expected: quota is derived from existing photo ownership and trip-photo associations.
2. Extract the shared photo dialog and add the conditional trip-page contribution trigger/dialog UI.
3. Validate direct-action authorization, quota, and transaction behavior before exposing the control.
4. Rollback by removing the contribution UI/action wiring; existing uploaded file assets and successfully created standard photo records remain intact and manageable through existing admin workflows.
