# Proposal

## Why

**A trip creator who discards an uploaded GPX never learns that the file was removed.** The trip-side `Add track` dialog marks the uploaded file for deletion and closes the modal silently. The admin track form performs the exact same lifecycle and says so: it shows the toast `Uploaded GPX file discarded`. Same action, same server helper, two different feedback behaviors.

The silent side is the public one — the side where the user has just handed over a file they spent time uploading. The dialog copy already promises the removal ("Discarding will mark the unsaved uploaded GPX file for deletion before closing"), and then it deletes it without a word.

Found while extracting the shared discard lifecycle in `refactor-003-discard-guarded-track-form`: the extraction had to carry the difference as the hook option `discardedMsg`, because unifying it is a user-visible change and the `refactor-XXX` pool forbids those. The existing `outdoor-tracks` requirement "Trip-side Add track dialog reuses the shared GPX upload piece" also says the dirty-close guard SHALL remain identical for both consumers — today the two guards are not identical.

## What Changes

- **The trip-side `Add track` dialog confirms the removal.** When a confirmed discard actually removes an uploaded GPX file, the trip creator now sees the same `Uploaded GPX file discarded` confirmation the admin form shows.
- **The shared hook stops taking the toast text as an option.** The wording is one string in one place and every consumer shows it, so `discardedMsg` disappears from `useDiscardGuardedTrackForm` and the hook drops to five options: `savedFileAssetId`, `hasUnsavedChanges`, `hasUnsavedPoints`, `resetFormState`, `onOpenChange`.

Nothing else changes. A discard that removes no file still shows no confirmation (the toast stays inside the file-removal branch), the error path is untouched, and the admin form's behavior is byte-for-byte what it is today.

### Non-goals

- **No new wording.** The confirmation is the admin form's existing string, `Uploaded GPX file discarded`. It names the action and the object and reads the same for a trip creator as for an administrator.
- **No confirmation for a discard that removed no file.** "Discard track changes?" (a plain dirty form) closes the modal silently, as today — the toast would be false there.
- **Not changing the discard confirmation dialog's copy, title, or buttons.** The dialog already calls the uploaded file out before the discard; only the outcome is unacknowledged.
- **Not touching the `fix-007` stale-upload-ids quirk** (the admin dialog's "mark as manual" close path). Separate candidate, separate decision.
- **Not changing the discard guard itself** — what counts as a guarded change, when the confirmation appears, and what a confirmed discard clears are all unchanged.
- **Not adding a confirmation to the *save* path.** Only the discard path acknowledges a removed file.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks` — the trip-side discard of an uploaded GPX now confirms the removal to the trip creator, and the two track dialogs share one confirmation wording.

## Impact

- **Schemas**: no Prisma migration, no database impact.
- **Routes**: none. One call site is an admin-only component under `/admin`; the other is the public trip-page dialog.
- **Public surfaces**: one new toast on the public trip-page `Add track` dialog. No new markup, no new route, no new data.
- **Code**: 1 hook file modified, 2 components modified (the admin track panel and the quick workout upload dialog, which already passed the same wording), 0 changes in the public form (it gains the toast through the hook).
- **Server actions**: `markDiscardedTrackGpxFileAssetsPendingDelete` is unchanged and still called with the same id set.
- **Depends on**: `refactor-003-discard-guarded-track-form` must land first — see `design.md`.
