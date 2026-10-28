# Tasks

## 1. Confirm the precondition

- [x] `refactor-003-discard-guarded-track-form` is committed and its branch merged — this change edits the hook that refactor introduces. If the hook does not exist yet, stop and land the refactor first.
- [x] Read the hook as it stands after the refactor and confirm the option is still named `discardedMsg` and the success toast still sits in the `fileIdsToDiscard.length > 0` branch.

## 2. Hardcode the success toast in the hook

- [x] In `lib/use-discard-guarded-track-form.ts`, remove `discardedMsg` from the `DiscardGuardedTrackFormOptions` type and from the hook's destructured parameter list.
- [x] Replace `if (discardedMsg) { toast.success(discardedMsg); }` with an unconditional `toast.success("Uploaded GPX file discarded");`.
- [x] Keep the toast inside the branch that only runs when at least one uploaded file is actually marked for deletion — the `fileIdsToDiscard.length === 0` early return above it must stay untouched, so a discard with no uploaded file still shows no toast.
- [x] Keep the call order `toast.success` → `closeWithoutGuard`, and keep the error branch returning before the toast.
- [x] Update the hook's doc comment: it currently says the two forms "toast different messages", which is no longer true. The remaining differences are the per-form parameters.

## 3. Drop the option at the call sites that pass it

- [x] In `components/admin-pages/tracks-admin-panel.tsx`, remove `discardedMsg: "Uploaded GPX file discarded"` from the `useDiscardGuardedTrackForm` call.
- [x] The admin's toast is unchanged — same wording, same moment, same place. No other edit in this file.
- [x] In `components/track-pages/quick-workout-upload-dialog.tsx`, remove `discardedMsg: "Uploaded GPX file discarded"` from the `useDiscardGuardedTrackForm` call. This **third** consumer was added by feature-123, after these tasks were written — it passes the option today, so it has to be updated in the same commit or the type check fails on the removed option. Its toast is unchanged as well: it already showed the same wording through the option and now shows it through the hook.

## 4. Public form

- [x] No code change in `components/hike-pages/hike-track-contribution-form.tsx` — the public form gains the toast through the hook. Confirm it does not pass `discardedMsg` (it never did) and that no other toast on the discard path would double up.

## 5. Validate

- [x] `npm run tsc` — must pass clean.
- [x] `npx eslint lib/use-discard-guarded-track-form.ts components/admin-pages/tracks-admin-panel.tsx components/track-pages/quick-workout-upload-dialog.tsx components/hike-pages/hike-track-contribution-form.tsx --quiet` — these are outside `app/`, so the root lint script will not cover them. Run without `--quiet` too.
- [x] `npm run lint`.
- [x] `npx prisma generate` — not needed; no schema change.
- [x] `openspec validate fix-008-public-track-discard-success-toast`.
- [x] Ask the user to run `npm run build` and `npm run dev` — the agent does not start either. The owner's production build passed on 2026-10-28.

## 6. Browser check

Dropped at the owner's request on 2026-10-28 — the browser pass was not run and is not carried into the backlog. The change is limited to the wording the admin form already showed, so nothing else moves.

## 7. Docs

- [x] `openspec/backlog.md`: the `fix-008-public-track-discard-success-toast` row moves to `Done` when the change is implemented, and the row is removed from the table at archive time (the same lifecycle `fix-006` followed).

## Not in this change

- The admin dialog's "mark as manual" close path that leaks an uploaded id → `fix-007-track-form-stale-upload-ids-after-mark-as-manual`.
- Any change to the discard confirmation dialog's copy, title, or buttons.
- Any confirmation on the save path.
