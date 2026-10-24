# Design

## Where the hook lives

`lib/use-discard-guarded-track-form.ts`, next to `lib/use-delete-row-confirm.ts`.

That is the direct precedent: `refactor-001-delete-row-confirm` shipped a panel-facing lifecycle hook in `lib/`, consumed by three admin panels, and it is already imported by `tracks-admin-panel.tsx:54`. The root `hooks/` directory was rejected by refactor-001 for good reason — of its four barrel exports only `useIsMobile` is a real React hook.

## The hook

```ts
"use client";

import { useCallback, useMemo, useState, useTransition } from "react";
import { toast } from "sonner";

import { markDiscardedTrackGpxFileAssetsPendingDelete } from "@/app/_actions/files";

type DiscardGuardedTrackFormOptions = {
  /** Id of the file asset already saved on the edited record, if any. Uploads with this id are kept, not discarded. */
  savedFileAssetId?: string | null;
  /** Whether the form itself holds unsaved edits. */
  hasUnsavedChanges?: boolean;
  /** Whether unsaved map points are staged (the admin "place on map" flow). */
  hasUnsavedPoints?: boolean;
  /** Resets the form fields and any staged map points. */
  resetFormState: () => void;
  /** Opens / closes the surrounding dialog. */
  onOpenChange: (open: boolean) => void;
  /** Success toast after a successful discard. Omit for no success toast. */
  discardedMsg?: string;
};

type DiscardGuardedTrackForm = {
  /** Registers a freshly uploaded file asset id. */
  registerUploadedFileAssetId: (fileAssetId: string) => void;
  /** Uploaded ids that a discard would actually delete. */
  discardableFileAssetIds: string[];
  hasUnsavedUploads: boolean;
  hasGuardedChanges: boolean;
  /** Closes the dialog without asking, resetting the form. */
  closeWithoutGuard: () => void;
  /** The guarded `onOpenChange` for the surrounding dialog. */
  handleOpenChange: (nextOpen: boolean) => void;
  /** Clears the uploaded ids and closes the confirm dialog, keeping the form open. */
  resetDiscardState: () => void;
  confirmDialogProps: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    description: string;
    confirmLabel: string;
    confirmVariant: "destructive";
    isPending: boolean;
    onConfirm: () => void;
  };
};
```

**Why the hook does not render `<ConfirmDialog>` itself.** Same reasoning as refactor-001: it returns a spreadable props object instead, which keeps JSX in the form, keeps `ConfirmDialog` a presentation concern, and lets each form keep its own copy if the wording ever diverges.

**Why the hook calls the server action itself.** Both sites call the *same* action, `markDiscardedTrackGpxFileAssetsPendingDelete`, with the same id list. Passing it in as an option would add a call-site line to save nothing. The hook imports it from `@/app/_actions/files` directly — the same `"use server"` module both forms already import from.

**Why `savedFileAssetId` is an option and not a fixed behavior.** The admin form edits an existing row whose `fileAssetId` is already persisted. Discarding must not delete the persisted file, so the admin form filters that id out of the discard set. The public form only ever creates, so it has nothing to filter. Filtering by `savedFileAssetId` inside the hook keeps one derivation instead of two.

**Why `hasUnsavedChanges` is an option and not read from a form instance.** The hook does not own the react-hook-form instance, and the two forms gate form-dirty differently — see the difference table below.

## The six code-level differences, and how each is preserved

A review of every difference (2026-10-24, after the first draft of this design) separated the **real divergences** from the **same rule with an empty parameter**. Only one difference is real.

| # | Difference | Admin `TrackFormDialog` | Public `HikeTrackContributionDialog` | Real? | How the hook keeps it |
| --- | --- | --- | --- | --- | --- |
| 1 | Which uploaded ids are discardable | `uploadedFileAssetIds` minus `track?.fileAssetId` | all uploaded ids | no — one rule ("never discard an attached file"), empty parameter on the public side | `savedFileAssetId` option |
| 2 | Dialog copy branches | three (uploads / placed points / plain) | two (uploads / plain) | no — one ladder, and the public form cannot stage points, so the middle rung is unreachable | `hasUnsavedPoints` option, `false` on the public side |
| 3 | Error toast | `result.message \|\| "Uploaded GPX file could not be removed"` | `result.message` | no — **dead branch**: the action returns a non-empty message on every failure path | unified in the hook, one spelling for both |
| 4 | Success toast | `"Uploaded GPX file discarded"` | none | **yes — observable** | `discardedMsg` option, present only in the admin form |
| 5 | `hasGuardedChanges` | `isDirty \|\| hasUnsavedUploads \|\| hasUnsavedPoints` | `hasUnsavedUploads \|\| (isDirty && tab === "upload")` | no — each form's term is correct for its own submit path | `hasUnsavedChanges` option carries each form's own dirty term |
| 6 | What closing clears | ids, confirm dialog, staged map points, form values | ids, confirm dialog, form values | no — one rule, nothing to clear on the public side | `resetFormState` option |

### Why #5 is not drift

Each form's dirty term is correct for what its submit path actually uses:

- The admin's place-on-map path calls `createManualTrack(trackPayload, placedPoints)`, and `trackPayload` carries `title`, `slug`, and `description` from the form values. A title typed before switching to the place-on-map tab is part of the track that gets created, so form-dirty must count there.
- The public form's attach path calls `attachCreatorTrackToHike({ hikeId, trackId })` and uses **no** form values at all. A title typed on the upload tab is irrelevant to attaching an existing track, so form-dirty must not count there.

The `tab === "upload"` condition is not redundant either: neither form sets `shouldUnregister`, so the upload-tab values stay in the form state after the tab switch and `formState.isDirty` remains `true`.

### Why #3 is safe to unify

`markDiscardedTrackGpxFileAssetsPendingDelete` returns `success: false` from exactly one place, and both of its messages are non-empty literals ("An uploaded GPX file is no longer safe to discard." / "You can only discard GPX files you uploaded."). Every other path returns `success: true`. The `|| "Uploaded GPX file could not be removed"` fallback therefore never fires, so unifying on the fallback spelling changes nothing a user can observe.

The hook keeps the fallback — it is the defensive spelling, and `toast.error(undefined)` is the degenerate alternative. The `discardFailedMsg` option is dropped; the fallback is hardcoded.

### Why #4 stays an option

This is the only difference a user can observe: the public form deletes the user's uploaded GPX and says nothing. Adding the toast is a user-visible change, which by the hybrid rule does not belong in the `refactor-XXX` pool. It is filed as `fix-008-public-track-discard-success-toast` in [`openspec/backlog.md`](../../backlog.md), with its own artifacts in [`openspec/changes/fix-008-public-track-discard-success-toast/`](../fix-008-public-track-discard-success-toast/); when it lands, it hardcodes the toast in the hook and the `discardedMsg` option disappears with it.

## Shared rather than parameterized

These are byte-identical at both sites and are implied by the hook's meaning:

| Value | Value used |
| --- | --- |
| uploads title | `"Discard track and uploaded GPX?"` |
| points title | `"Discard placed points?"` |
| plain title | `"Discard track changes?"` |
| uploads description | `"This form has unsaved changes and an uploaded GPX file. Discarding will mark the unsaved uploaded GPX file for deletion before closing."` |
| points description | `"This form has unsaved changes and placed map points. Discarding will close the modal without saving them."` |
| plain description | `"This form has unsaved changes. Discarding will close the modal without saving them."` |
| `confirmLabel` | `"Discard and remove file"` (with uploads) / `"Discard changes"` (without) |
| `confirmVariant` | `"destructive"` |
| error toast | `result.message \|\| "Uploaded GPX file could not be removed"` — unified, see #3 above |

The dialog copy lives in the hook, which is the point of the extraction: ~20 lines of nested ternaries per site disappear and there is now exactly one copy of the wording.

## Behavior that must be preserved exactly

**1. The hook does not reset the uploaded ids when the dialog opens.** This is the subtle one.

Both dialogs are mounted permanently — `TrackFormDialog` is rendered unconditionally with `open={formOpen}` (`tracks-admin-panel.tsx:1045`), and the public `HikeTrackContributionDialog` likewise (`hike-track-contribution-form.tsx:453`). Component state therefore survives close → open, and the two forms differ here:

- The public form resets in its `open` effect: `form.reset(defaultUploadValues); setUploadedFileAssetIds([]); setDiscardConfirmOpen(false);` — the effect's deps are `[form, open, ownerTracks.length]`, so it also re-runs when the owner's track count changes while the dialog is open.
- The admin form does **not** reset the uploaded ids on open. Its only reset of that state is `closeWithoutGuard`. The admin form's "mark as manual" button closes the dialog through the parent's `onOpenChange(false)` directly (`tracks-admin-panel.tsx:282`), bypassing `closeWithoutGuard` — so an id uploaded in a previous dialog session survives the close and is still there on the next open.

If the hook reset the ids on open, the admin form's behavior would change: after a mark-as-manual close, the next open would no longer show the discard guard for that leftover upload. That is observable, so it does not happen here.

The hook therefore exposes `resetDiscardState()` and only the public form calls it, from inside its existing effect:

```ts
useEffect(() => {
  if (!open) return;
  form.reset(defaultUploadValues);
  resetDiscardState();
  setTab(ownerTracks.length > 0 ? "attach" : "upload");
}, [form, open, ownerTracks.length, resetDiscardState]);
```

`resetDiscardState` is a `useCallback` with no dependencies, so adding it to the dep array does not change when the effect fires.

**2. The admin form's "mark as manual" close path stays outside the guard.** It calls the parent's `onOpenChange(false)` directly, not `closeWithoutGuard`. Keep it that way — routing it through the guard would add a confirmation the admin does not get today.

**3. The admin form's `cleanupSupersededUploads` keeps its own call to the action.** After a successful save it marks every uploaded id *except* the one just saved as `PENDING_DELETE`. That is a different lifecycle from the discard guard — it runs on success, not on discard — and it stays in the form, reading the hook's `discardableFileAssetIds`:

```ts
const cleanupSupersededUploads = async (savedFileId: string) => {
  const supersededFileIds = discardGuard.discardableFileAssetIds.filter(
    (uploadedFileAssetId) => uploadedFileAssetId !== savedFileId,
  );
  // ...
};
```

**4. `closeWithoutGuard` clears the form before closing, in both forms.** The admin's clears staged map points too, and does so *before* `form.reset(defaultValues)`. The order is preserved inside the admin's `resetFormState` callback.

**5. The public form's `handleConfirmDiscard` passes every uploaded id, not a filtered set.** With no `savedFileAssetId`, the hook's `discardableFileAssetIds` is the full list — same set.

**6. The public form's `uniqueIds` dedupe moves into the hook.** Both forms dedupe on upload with `uniqueIds([...current, id])` (`Array.from(new Set(...))`), and the public form dedupes a second time at discard time. The hook dedupes on registration and returns an already-unique list, so the second dedupe is redundant — and removing it changes nothing, because the list it produced was already unique.

## What `ConfirmDialog` already does — do not duplicate

From `components/common/confirm-dialog.tsx`:

- `handleConfirm` already does `if (isPending) return` before awaiting `onConfirm`, so double-submit is blocked at the dialog level.
- `onOpenChange` is already suppressed mid-flight: `<Dialog onOpenChange={(nextOpen) => !isPending && onOpenChange(nextOpen)}>`.

The hook therefore adds no pending guard of its own, exactly like `useDeleteRowConfirm`. Duplicating it would be dead code.

## Per-form wiring

```ts
// tracks-admin-panel.tsx (TrackFormDialog)
const resetFormState = useCallback(() => {
  setPlacedPoints([]);
  form.reset(defaultValues);
}, [form]);

const discardGuard = useDiscardGuardedTrackForm({
  savedFileAssetId,
  hasUnsavedChanges: form.formState.isDirty,
  hasUnsavedPoints: placedPoints.length > 0,
  resetFormState,
  onOpenChange,
  discardedMsg: "Uploaded GPX file discarded",
});
```

```ts
// hike-track-contribution-form.tsx (HikeTrackContributionDialog)
const resetFormState = useCallback(() => {
  form.reset(defaultUploadValues);
}, [form]);

const discardGuard = useDiscardGuardedTrackForm({
  hasUnsavedChanges: isFormDirty && tab === "upload",
  resetFormState,
  onOpenChange,
});
```

The dialog then collapses to a spread:

```tsx
<ConfirmDialog {...discardGuard.confirmDialogProps} />
```

and the guarded close handler becomes `discardGuard.handleOpenChange`.

## The memo dependency in the public form

The public form's `open` effect calls the hook's reset, and the first lint pass reported:

```
react-hooks/exhaustive-deps  React Hook useEffect has a missing dependency: 'discardGuard'.
```

The rule wants the **object** in the dependency array, because the effect reads `discardGuard.resetDiscardState`. That is the same "inferred less specific property than source" trap refactor-001 documented for the column-def memos — and here it would be a live bug, not a lint nit: `discardGuard` is a fresh object literal on every render, so listing it would re-fire the effect on every render, and `resetDiscardState` calls `setUploadedFileAssetIds([])` with a **new array** each time, which is a state change, which re-renders, which re-fires the effect — an infinite loop.

The fix is the one refactor-001 recommended: destructure the stable callback so the dependency is the function, not the object.

```ts
const { resetDiscardState } = discardGuard;
```

`resetDiscardState` is a `useCallback` with no dependencies, so it is referentially stable, the effect fires on exactly the same conditions as before, and the lint rule is satisfied.

Worth remembering for any future hook whose returned object is read inside an effect: expose the callback as a destructurable stable value, not only as a property of the returned object.

## A pre-existing quirk this refactor preserves

The admin form's "mark as manual" button closes the dialog through the parent's `onOpenChange(false)` (`tracks-admin-panel.tsx:278`) rather than through the shared close path. That path never clears the uploaded-id list, so a file uploaded in that dialog session stays registered: the `FileAsset` row remains `ACTIVE` and unattached, and the next open of the same track shows the "Discard track and uploaded GPX?" guard on a form the administrator never touched.

This refactor preserves that behavior on purpose — clearing it would change what the user sees and would forfeit the change's place in the `refactor-XXX` pool. It is filed as `fix-007-track-form-stale-upload-ids-after-mark-as-manual` in [`openspec/backlog.md`](../../backlog.md).

## State removed from the forms

In both forms:

- `const [uploadedFileAssetIds, setUploadedFileAssetIds] = useState<string[]>([])` — removed; the hook owns it.
- `const [discardConfirmOpen, setDiscardConfirmOpen] = useState(false)` — removed; the hook owns it.
- `const [isDiscarding, startDiscarding] = useTransition()` — removed; the hook owns it. **Verify per form that the transition is not used for anything else** — the admin form has a separate `isMarkingAsManual` state, and the public form has `isSubmitting` / `isAttachingId`, all of which stay.
- `const closeWithoutGuard = …`, `const handleOpenChange = …`, `const handleConfirmDiscard = …` — removed; the hook returns them.
- The local `const uniqueIds = (ids: string[]) => Array.from(new Set(ids))` helper — removed from both forms; the hook dedupes on registration. Confirm no other use remains in each file first.

In the admin form, the local `hasUnsavedUploads`, `hasUnsavedPoints`, `hasGuardedChanges`, and `discardFileAssetIds` consts also go away; the hook returns the derived values.

## Explicitly out of scope

- `tracks-admin-panel.tsx` — the "mark as manual" `ConfirmDialog`, the recording-timezone dialog, and the `useDeleteRowConfirm` lifecycle: unrelated.
- `hike-track-contribution-form.tsx` — the "attach existing track" branch and the upload-submit branch: they call `closeWithoutGuard` and keep doing so, now through `discardGuard.closeWithoutGuard`.
- The track timezone input + datalist — the `timezone-input` candidate.
- The panel splits — `hikes-admin-panel-split`, `photos-admin-panel-split`, `hike-photo-gallery-extract`.

## Risks

| Risk | Mitigation |
| --- | --- |
| Unifying a difference that is not really a difference | The table above marks which are real; only the success toast is observable, and it stays an option |
| Unifying the success toast "while we are here" | Non-goal in the proposal — a visible change belongs to `fix-008-public-track-discard-success-toast` |
| Adding the hook's own open-time reset | Explicitly excluded — see Behavior item 1; it would change the admin form's post-mark-as-manual state |
| Dropping `hasUnsavedPoints` from the admin form's guard | It is one of the three ways the admin guard can be satisfied; dropping it would let a staged-points form close silently |
| Removing a `useTransition` that is still used | Per-form verification task, not an assumption |
| The public form's effect dep list changing what fires | `resetDiscardState` is a dependency-free `useCallback`; the effect fires on the same conditions as before |
| The hook becoming a generic `useConfirmAction` | Out of scope by design — research-001 declined that shape for the delete lifecycle, and this lifecycle has form-specific reset and dirty semantics that a generic hook cannot carry |
