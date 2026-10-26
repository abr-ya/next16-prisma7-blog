# Tasks

## 1. Confirm the precondition

- [ ] `refactor-003-discard-guarded-track-form` is committed and its branch merged — this change edits the hook that refactor introduces. If the hook does not exist yet, stop and land the refactor first.
- [ ] Read the hook as it stands after the refactor and confirm the option is still named `discardedMsg` and the success toast still sits in the `fileIdsToDiscard.length > 0` branch.

## 2. Hardcode the success toast in the hook

- [ ] In `lib/use-discard-guarded-track-form.ts`, remove `discardedMsg` from the `DiscardGuardedTrackFormOptions` type and from the hook's destructured parameter list.
- [ ] Replace `if (discardedMsg) { toast.success(discardedMsg); }` with an unconditional `toast.success("Uploaded GPX file discarded");`.
- [ ] Keep the toast inside the branch that only runs when at least one uploaded file is actually marked for deletion — the `fileIdsToDiscard.length === 0` early return above it must stay untouched, so a discard with no uploaded file still shows no toast.
- [ ] Keep the call order `toast.success` → `closeWithoutGuard`, and keep the error branch returning before the toast.
- [ ] Update the hook's doc comment: it currently says the two forms "toast different messages", which is no longer true. The remaining differences are the per-form parameters.

## 3. Drop the option at the admin call site

- [ ] In `components/admin-pages/tracks-admin-panel.tsx`, remove `discardedMsg: "Uploaded GPX file discarded"` from the `useDiscardGuardedTrackForm` call.
- [ ] The admin's toast is unchanged — same wording, same moment, same place. No other edit in this file.

## 4. Public form

- [ ] No code change in `components/hike-pages/hike-track-contribution-form.tsx` — the public form gains the toast through the hook. Confirm it does not pass `discardedMsg` (it never did) and that no other toast on the discard path would double up.

## 5. Validate

- [ ] `npm run tsc` — must pass clean.
- [ ] `npx eslint lib/use-discard-guarded-track-form.ts components/admin-pages/tracks-admin-panel.tsx components/hike-pages/hike-track-contribution-form.tsx --quiet` — these are outside `app/`, so the root lint script will not cover them. Run without `--quiet` too.
- [ ] `npm run lint`.
- [ ] `npx prisma generate` — not needed; no schema change.
- [ ] `openspec validate fix-008-public-track-discard-success-toast`.
- [ ] Ask the user to run `npm run build` and `npm run dev` — the agent does not start either.

## 6. Browser check

The checks that delete an uploaded file moved here from `refactor-003-discard-guarded-track-form` — this is where that discard branch finally changes, so it gets verified once, on the final code.

- [ ] Public trip-side dialog: type a slug on the upload tab and close — the guard fires ("Discard track changes?"); switch to the "attach" tab with the same dirty form and close — the guard does **not** fire (the dirty term is upload-tab-only). *(Moved here from `refactor-003-discard-guarded-track-form`.)*
- [ ] Public trip-side dialog: upload a GPX file, close the dialog — the confirmation reads "Discard track and uploaded GPX?" with the "Discard and remove file" label. Confirm the discard: the toast `Uploaded GPX file discarded` appears, the uploaded `FileAsset` is marked `PENDING_DELETE`, and the dialog closes.
- [ ] Public trip-side dialog: type a slug only (no upload), close, confirm the discard — the dialog closes and **no** file toast appears.
- [ ] Public trip-side dialog: upload a GPX, then cancel the discard confirmation — the dialog stays open with the file still selected, and no toast appears.
- [ ] Admin track dialog: upload a GPX, close — the confirmation reads "Discard track and uploaded GPX?" with the "Discard and remove file" label. Confirm the discard: the same `Uploaded GPX file discarded` toast appears as before the change, and the uploaded `FileAsset` is marked `PENDING_DELETE`.
- [ ] Admin track dialog: make a form-only change and discard — no file toast, as before.

## 7. Docs

- [ ] `openspec/backlog.md`: the `fix-008-public-track-discard-success-toast` row moves to `Done` when the change is implemented, and the row is removed from the table at archive time (the same lifecycle `fix-006` followed).

## Not in this change

- The admin dialog's "mark as manual" close path that leaks an uploaded id → `fix-007-track-form-stale-upload-ids-after-mark-as-manual`.
- Any change to the discard confirmation dialog's copy, title, or buttons.
- Any confirmation on the save path.
