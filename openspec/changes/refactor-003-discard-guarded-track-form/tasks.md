# Tasks

## 1. Add the hook

- [x] Create `lib/use-discard-guarded-track-form.ts` with the signature from `design.md`: options `{ savedFileAssetId, hasUnsavedChanges, hasUnsavedPoints, resetFormState, onOpenChange, discardedMsg }`, returning `{ registerUploadedFileAssetId, discardableFileAssetIds, hasUnsavedUploads, hasGuardedChanges, closeWithoutGuard, handleOpenChange, resetDiscardState, confirmDialogProps }`.
- [x] Body reproduces the current lifecycle exactly: `uploadedFileAssetIds` state, `discardConfirmOpen` state, `useTransition` for the discard, the guarded `handleOpenChange` (open → forward; close with changes → open the confirm dialog; close without changes → `closeWithoutGuard`), and `handleConfirmDiscard` calling `markDiscardedTrackGpxFileAssetsPendingDelete`.
- [x] Derive `discardableFileAssetIds` as the uploaded ids minus `savedFileAssetId`; derive `hasUnsavedUploads` from that list, and `hasGuardedChanges` as `hasUnsavedUploads || hasUnsavedPoints || hasUnsavedChanges`.
- [x] Keep the shared dialog copy inside the hook, including the three-branch title and description and the `"Discard and remove file"` / `"Discard changes"` confirm label. `confirmVariant` stays `"destructive"`.
- [x] Apply the toast options exactly: show the success toast only when `discardedMsg` is supplied; always use the hardcoded fallback `result.message || "Uploaded GPX file could not be removed"` for the error toast — the action never returns an empty message, so unifying the dead fallback branch is not observable.
- [x] Add `"use client";` as the first line. Do **not** add an open-time reset — the hook must not reset the uploaded ids when the dialog opens.

## 2. Wire the admin track form

- [x] In `components/admin-pages/tracks-admin-panel.tsx` (`TrackFormDialog`), call the hook with `savedFileAssetId` (`track?.fileAssetId ?? null`), `hasUnsavedChanges: form.formState.isDirty`, `hasUnsavedPoints: placedPoints.length > 0`, a `resetFormState` that clears staged points and resets the form to `defaultValues`, and `discardedMsg: "Uploaded GPX file discarded"`.
- [x] Replace the `<ConfirmDialog>` block at lines 902-935 with `<ConfirmDialog {...discardGuard.confirmDialogProps} />`.
- [x] Point the dialog's `onOpenChange` at `discardGuard.handleOpenChange`.
- [x] Replace the two `closeWithoutGuard()` calls in the submit handler (lines 491 and 500) with `discardGuard.closeWithoutGuard()`.
- [x] Update `cleanupSupersededUploads` to read `discardGuard.discardableFileAssetIds` instead of the local `discardFileAssetIds`. Leave its own call to `markDiscardedTrackGpxFileAssetsPendingDelete` and its `"Earlier uploaded GPX file could not be removed"` message alone — that is the post-save cleanup lifecycle, not the discard guard.
- [x] Replace the upload wiring `setUploadedFileAssetIds((current) => uniqueIds([...current, fileAssetId]))` with `discardGuard.registerUploadedFileAssetId(fileAssetId)`.
- [x] Remove `const [uploadedFileAssetIds, setUploadedFileAssetIds]`, `const [discardConfirmOpen, setDiscardConfirmOpen]`, `const [isDiscarding, startDiscarding]`, the local `closeWithoutGuard` / `handleOpenChange` / `handleConfirmDiscard`, the local `hasUnsavedUploads` / `hasUnsavedPoints` / `hasGuardedChanges` / `discardFileAssetIds` consts, and the local `uniqueIds` helper — **after** confirming `uniqueIds` and `useTransition` have no other use in this file.
- [x] Leave the "mark as manual" `ConfirmDialog`, the recording-timezone dialog, the `useDeleteRowConfirm` lifecycle, and the `onOpenChange(false)` call inside `handleMarkAsManual` untouched.

## 3. Wire the public trip-page track form

- [x] In `components/hike-pages/hike-track-contribution-form.tsx` (`HikeTrackContributionDialog`), call the hook with `hasUnsavedChanges: isFormDirty && tab === "upload"`, a `resetFormState` that resets the form to `defaultUploadValues`, and **no** `savedFileAssetId`, `hasUnsavedPoints`, or `discardedMsg` options.
- [x] Replace the `<ConfirmDialog>` block at lines 397-410 with the spread, and point the dialog's `onOpenChange` at `discardGuard.handleOpenChange`.
- [x] Replace the two `closeWithoutGuard()` calls (the attach handler and the upload submit handler) with `discardGuard.closeWithoutGuard()`.
- [x] Replace the upload wiring `setUploadedFileAssetIds((current) => uniqueIds([...current, newFileAssetId]))` with `discardGuard.registerUploadedFileAssetId(newFileAssetId)`.
- [x] Update the `open` effect to call `discardGuard.resetDiscardState()` in place of `setUploadedFileAssetIds([])` and `setDiscardConfirmOpen(false)`, and add `discardGuard.resetDiscardState` to the dependency list. Keep `form.reset(defaultUploadValues)` and the tab reset in the effect.
- [x] Remove `const [uploadedFileAssetIds, setUploadedFileAssetIds]`, `const [discardConfirmOpen, setDiscardConfirmOpen]`, `const [isDiscarding, startDiscarding]`, the local `closeWithoutGuard` / `handleOpenChange` / `handleConfirmDiscard`, the local `hasUnsavedUploads` / `hasGuardedChanges` consts, the local `uniqueIds` helper, and the now-unused `markDiscardedTrackGpxFileAssetsPendingDelete` import — **after** confirming each has no other use in this file. Leave the `toast` import: it is still used by the attach and submit handlers.

## 4. Validate

- [x] `npm run tsc` — must pass clean.
- [x] `npx eslint components/admin-pages/tracks-admin-panel.tsx components/hike-pages/hike-track-contribution-form.tsx lib/use-discard-guarded-track-form.ts --quiet` — these are outside `app/`, so the root lint script will not cover them. Run without `--quiet` too: the first pass reported one `react-hooks/exhaustive-deps` warning on the public form's `open` effect (see `design.md`, "The memo dependency in the public form").
- [x] `npx prisma generate` — not needed; no schema change.
- [ ] Ask the user to run `npm run build` and `npm run dev` — the agent does not start either.

## 5. Browser check

- [ ] Admin track form: open the edit dialog, type a title, close it, and confirm the discard dialog still appears with the unchanged copy ("Discard track changes?"); confirm the dialog closes without saving and the row is untouched.
- [ ] Admin track form: upload a GPX file, close the dialog, and confirm the dialog now reads "Discard track and uploaded GPX?" with the "Discard and remove file" label and that confirming marks the file `PENDING_DELETE` and shows the "Uploaded GPX file discarded" toast.
- [ ] Admin track form: stage points on the map and close without other changes — confirm the dialog reads "Discard placed points?".
- [ ] Admin track form: press Cancel on the discard dialog and confirm the form stays open with the typed values intact.
- [ ] Public trip-page form: open the "Add track" dialog, upload a GPX file, close it, and confirm the discard dialog appears and the uploaded file is marked `PENDING_DELETE` — and that **no** success toast appears, as today.
- [ ] Public trip-page form: type a slug on the upload tab and close — confirm the guard fires; switch to the "attach" tab with a dirty form and close — confirm the guard does **not** fire (the dirty term is upload-tab-only).

## 6. Docs

- [x] Update `openspec/refactor-backlog.md`: `discard-guarded-track-form` moves from `Candidate` to `In Progress` with the `refactor-003` number and a note on the six carried differences. The `hikes-admin-panel-split` and `photos-admin-panel-split` rows now record that the `refactor-001-delete-row-confirm` prerequisite is satisfied. Move the row to `Done` in `refactor-history.md` at archive time.
- [x] No spec update — `skip_specs: true`, no observable behavior change.

## Not in this change

- The shared track timezone input + datalist → the `timezone-input` candidate.
- The three panel splits → `hikes-admin-panel-split`, `photos-admin-panel-split`, `hike-photo-gallery-extract`.
- `useDeleteRowConfirm` → already shipped as `refactor-001-delete-row-confirm`.
- The public form's missing discard confirmation → prepared as `fix-008-public-track-discard-success-toast` (artifacts written, code deliberately left out of this refactor's commit so the two changes can be committed separately).
- Any behavior fix discovered while extracting. If the browser check surfaces one, it becomes its own `fix-` candidate in `openspec/backlog.md` — this refactor preserves the current behavior rather than correcting it.
