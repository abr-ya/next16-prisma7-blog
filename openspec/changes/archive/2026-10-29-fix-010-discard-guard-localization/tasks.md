# Tasks

## 1. Add the copy to the `trips` namespace

- [x] 1.1 In `app/i18n/locales/en/trips.json`, add the `discardGuard` block with the eleven keys from `design.md` — `titleWithFile`, `titleWithPoints`, `titleChanges`, `descriptionWithFile`, `descriptionWithPoints`, `descriptionChanges`, `confirmWithFile`, `confirmChanges`, `successToast`, `errorNotSafe`, `errorNotOwner` — appended after the `quickWorkout` block. Every English value is the current literal in `lib/use-discard-guarded-track-form.ts`, character for character; `errorNotSafe` and `errorNotOwner` are the action's two English messages from `app/_actions/files.ts`.
- [x] 1.2 In `app/i18n/locales/ru/trips.json`, add the same block with the same eleven keys, in the same order, using the approved Russian strings from `design.md`. No key uses a placeholder, so none can hit the single-brace interpolation bug the older `trips` keys carry.
- [x] 1.3 Verify both files still parse as JSON and carry the same keys: `node -e "const en=require('./app/i18n/locales/en/trips.json').discardGuard,ru=require('./app/i18n/locales/ru/trips.json').discardGuard,k=o=>Object.keys(o).sort().join(',');if(k(en)!==k(ru))throw new Error('key mismatch');console.log(Object.keys(en).length+' keys in both')"` — printed `11 keys in both`.

## 2. Read the copy in the shared hook

- [x] 2.1 In `lib/use-discard-guarded-track-form.ts`, import `useT` from `next-i18next/client` and `tripsNamespace` from `@/app/i18n/settings`, and call `const { t } = useT(tripsNamespace);` at the top of the hook — the same shape as `lib/track-row-actions.ts`.
- [x] 2.2 Replace the three titles with `t("discardGuard.titleWithFile")`, `t("discardGuard.titleWithPoints")`, `t("discardGuard.titleChanges")`, keeping the ternary chain and its order (uploads → points → changes).
- [x] 2.3 Replace the three descriptions with `t("discardGuard.descriptionWithFile")`, `t("discardGuard.descriptionWithPoints")`, `t("discardGuard.descriptionChanges")`, same structure and order.
- [x] 2.4 Replace the two confirm labels with `t("discardGuard.confirmWithFile")` and `t("discardGuard.confirmChanges")`.
- [x] 2.5 Replace the success toast with `t("discardGuard.successToast")`, keeping it inside the branch that only runs when at least one uploaded file is actually marked for deletion — a discard with no uploaded file still shows no toast.
- [x] 2.6 Drop the unreachable fallback `"Uploaded GPX file could not be removed"` from the error branch; the branch is rewritten in group 3.
- [x] 2.7 Add `t` to `handleConfirmDiscard`'s dependency array, so a language change cannot leave a stale `t` in the closure.
- [x] 2.8 Update the hook's doc comment to say the guard's copy comes from the `trips` namespace, so the next reader does not look for the strings in the file.
- [x] 2.9 Confirm the guard's behavior is untouched: the same branches fire in the same order, `toast.success` still precedes `closeWithoutGuard()`, the error branch still returns before the toast, and `confirmDialogProps` keeps its shape — same keys, same `confirmVariant`, same `isPending`. Verified against the diff: only the string expressions changed.

## 3. Localize the failure toast through an error code

- [x] 3.1 In `app/_actions/files.ts`, declare `export type DiscardTrackGpxErrorCode = "NOT_SAFE" | "NOT_OWNER";` and a `DiscardTrackGpxResult` union — `{ success: true; message: string } | { success: false; message: string; code: DiscardTrackGpxErrorCode }` — and annotate `markDiscardedTrackGpxFileAssetsPendingDelete` with it, so `success` discriminates and `code` is reachable on the failure branch.
- [x] 3.2 Add `code: isAdmin ? "NOT_SAFE" : "NOT_OWNER"` to the failure return. `message` stays exactly as it is — both English strings are kept for the action's other caller.
- [x] 3.3 In the hook's error branch, toast `t("discardGuard.errorNotOwner")` when the code is `NOT_OWNER` and `t("discardGuard.errorNotSafe")` otherwise, and stop reading `result.message` there.
- [x] 3.4 Confirm the action's other caller — `cleanupSupersededUploads` in `components/admin-pages/tracks-admin-panel.tsx` — is untouched and still reads `result.message`. It is a different path (the save-side cleanup of a superseded upload) and its English toast stays as it is.
- [x] 3.5 Confirm the English failure toast is byte-identical to today's: `discardGuard.errorNotSafe` is `"An uploaded GPX file is no longer safe to discard."` and `discardGuard.errorNotOwner` is `"You can only discard GPX files you uploaded."` — checked against the action's own two messages mechanically.

## 4. Confirm the three consumers need no edit

- [x] 4.1 Confirm `components/admin-pages/tracks-admin-panel.tsx`, `components/hike-pages/hike-track-contribution-form.tsx` and `components/track-pages/quick-workout-upload-dialog.tsx` need no change — none of them passes a string to the hook, so all three pick the localized copy up through the shared hook. `git diff --stat` touches four files, none of them a consumer.
- [x] 4.2 Confirm `components/common/confirm-dialog.tsx` is not touched: the guard keeps using its default `cancelLabel`, and the seventeen other call sites are unaffected.

## 5. Validate

- [x] 5.1 `npm run tsc` — must pass clean.
- [x] 5.2 `npx eslint lib/use-discard-guarded-track-form.ts --quiet` — `lib/` is outside `app/`, so the root lint script does not cover it. Run it without `--quiet` too.
- [x] 5.3 `npm run lint`.
- [x] 5.4 `npx prisma generate` — not needed; `prisma/schema.prisma` is untouched in the diff, so the generated client needs no regeneration.
- [x] 5.5 `openspec validate fix-010-discard-guard-localization` — `Change 'fix-010-discard-guard-localization' is valid`.
- [x] 5.6 The owner's production build (`npm run build`) passed on 2026-10-29. The agent does not start the dev server or run the build.

## 6. Browser check

- [x] 6.1 Minimal positive check, run by the owner on 2026-10-29: with the interface in Russian, attach a GPX in the quick workout upload dialog on `/my/workouts` and close the dialog — the guard's title reads «Отменить трек и загруженный GPX-файл?» and its confirm label reads «Отменить и удалить файл». That is the check that proves the guard's copy now comes from the `trips` namespace instead of from literals in the hook.
- [x] 6.2 The remaining browser cases — the trip-side `Add track` dialog, the admin track modal, the success toast, the silent discard with no uploaded file, and the English regression check — are deferred to the `outdoor-discard-guard-localization-manual-qa` row in `openspec/backlog.md`. They leave this change's checklist rather than sit unchecked here.

## 7. Docs

- [x] 7.1 `openspec/backlog.md`: the `fix-010-discard-guard-localization` row moves to `Done` when the change is implemented, and the row is removed from the table at archive time (the same lifecycle `fix-008` followed).

## Not in this change

- The shared `ConfirmDialog`'s `Cancel` default label, and the other seventeen call sites that share it — a separate sweep over `components/common/confirm-dialog.tsx`.
- The admin track panel's other hardcoded English (`Track created`, `Track updated`, `Choose a supported IANA timezone`, `Recording timezone saved`, `Earlier uploaded GPX file could not be removed`, `Failed to save track`).
- The admin panel's separate `cleanupSupersededUploads` path, which keeps the action's English `message`.
- `fix-007-track-form-stale-upload-ids-after-mark-as-manual` — the admin dialog's "mark as manual" close path.
- The single-brace interpolation bug in four existing `trips` keys (`photoTimezoneDialogTitleWithPhoto`, `trackEditorDistanceLabel`, `trackEditorMapSelectedPointAria`, `trackTimeSourceBadgeLabel`) — a separate candidate; the new keys use no placeholders.
- `lib/track-row-actions.ts`'s own hardcoded English toasts (`GPX parsed`, `GPX parsing failed`, `Failed to parse GPX`, `Failed to mark track as manual`).
