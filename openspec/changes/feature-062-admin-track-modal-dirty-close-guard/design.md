## Context

See `proposal.md` for motivation. The current `/admin/tracks` form uses a Radix dialog through local UI primitives and passes close state directly through `onOpenChange`. UploadThing completion stores the uploaded GPX as a tracked `FileAsset` and writes the resulting `fileAssetId` into React Hook Form state. Existing file deletion behavior marks active files as `PENDING_DELETE` and sets `deletedAt`; provider-object removal is a later cleanup boundary.

## Goals / Non-Goals

**Goals:**

- Guard accidental modal dismissal for dirty track forms and newly uploaded unsaved GPX files.
- Make the discard consequence explicit when a GPX file has already been uploaded.
- Mark only safe unsaved uploaded GPX file assets pending delete when discard is confirmed.
- Preserve clean close and successful save behavior.

**Non-Goals:**

- No schema migration or generated Prisma changes.
- No UploadThing provider delete API call.
- No app-wide modal guard abstraction unless the local track implementation naturally reveals a tiny reusable helper.
- No automatic cleanup of older files already saved to existing tracks.

## Decisions

### Intercept dialog close at the track form boundary

`TrackFormDialog` should own a guarded close handler rather than letting every `onOpenChange(false)` immediately close the modal. The handler should allow normal opening, allow pristine close, and route dirty/unsaved-upload close attempts into the existing app-styled confirmation dialog.

Alternative considered: disable outside-click close entirely for the track modal. That prevents data loss but makes normal pristine close clunkier and does not explain uploaded-file cleanup.

### Track unsaved uploaded file identity separately from form dirtiness

When the modal opens, capture the saved file id:

- create mode: no saved file id
- edit mode: current `track.fileAssetId`

When UploadThing completes, store the uploaded `fileAssetId` as the current form value and remember it as a candidate unsaved upload. A file is discard-cleanup eligible only when it differs from the saved file id and has not been successfully saved.

Alternative considered: use only `form.formState.isDirty`. Dirty state is not enough because text edits need a discard prompt but no file cleanup, while uploaded files need explicit cleanup wording and a server mutation.

### Use the existing pending-delete lifecycle for cleanup

Confirmed discard should call a server-authorized cleanup path that marks the unsaved GPX `FileAsset` as `PENDING_DELETE` and sets `deletedAt`. Prefer reusing `markFileAssetPendingDelete` if its authorization and state rules are sufficient; otherwise add a narrower track-upload discard helper that requires admin role and verifies the asset is active, purpose `TRACK_GPX`, and not currently referenced by a `Track`.

Alternative considered: call the UploadThing provider deletion API immediately. That exceeds the current file lifecycle boundary and would skip the audit-friendly `PENDING_DELETE` state.

### Save path clears discard cleanup state

After successful create/update, close the modal without confirmation and treat the selected uploaded file as saved. The close path must not mark that file pending delete.

Alternative considered: always cleanup latest uploaded candidate after close and let save reattach. That would race with normal save behavior and could break the created/updated track.

## Risks / Trade-offs

- Cleanup mutation fails after confirmation -> Keep the modal open or show a visible error; do not silently close while claiming the uploaded file was removed.
- Edit mode replacement discard could delete the existing saved file -> Compare against the saved `track.fileAssetId` and only cleanup a different newly uploaded id.
- Multiple uploads in one open modal could leave earlier unsaved uploads active -> Track every uploaded id that differs from the saved id, or explicitly cleanup superseded uploads when a later upload replaces them. The implementation should avoid leaving earlier replacement attempts active.
- Browser close/reload still bypasses in-app modal confirmation -> This slice covers in-app dialog dismissal; broader beforeunload handling can be considered later if needed.

## Migration Plan

No data migration. Rollback removes the guarded close flow and any new narrow discard helper; existing track records and `FileAsset` lifecycle values remain valid.
