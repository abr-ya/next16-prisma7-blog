## 1. Track Dirty And Uploaded State

- [ ] 1.1 Identify the saved GPX file id when the track modal opens in create and edit modes.
- [ ] 1.2 Track all newly uploaded GPX file ids during one modal session that differ from the saved file id.
- [ ] 1.3 Treat text/select changes and unsaved GPX uploads as guarded dirty state for modal close attempts.
- [ ] 1.4 Clear guarded state after successful track create/update so saved files are not discarded.

## 2. Discard Confirmation And Cleanup

- [ ] 2.1 Intercept modal close attempts from outside click, escape, and close button when guarded state exists.
- [ ] 2.2 Show an app-styled confirmation dialog that distinguishes unsaved text changes from uploaded GPX cleanup.
- [ ] 2.3 On cancel, keep the track modal open with the current form values and uploaded file selection intact.
- [ ] 2.4 On confirmed discard, mark unsaved uploaded GPX file assets pending delete before closing.
- [ ] 2.5 Handle cleanup failures with a visible error and avoid silently closing as if cleanup succeeded.

## 3. Server-Side File Safety

- [ ] 3.1 Reuse `markFileAssetPendingDelete` if sufficient, or add a narrower admin-only helper for discarded track GPX uploads.
- [ ] 3.2 Ensure cleanup only transitions active `TRACK_GPX` file assets that are not currently referenced by a saved track.
- [ ] 3.3 Preserve the existing saved track file in edit mode when a replacement upload is discarded.

## 4. Validation

- [ ] 4.1 Run `openspec validate feature-062-admin-track-modal-dirty-close-guard --strict`.
- [ ] 4.2 Run `npm run tsc`.
- [ ] 4.3 Run `npm run lint` plus targeted ESLint for changed non-`app` files if needed.
- [ ] 4.4 Ask the user to run `npm run build` locally.
- [ ] 4.5 Manually verify pristine close, dirty text close, uploaded-file discard, cleanup failure, successful create, and edit-mode replacement discard on `/admin/tracks`.
