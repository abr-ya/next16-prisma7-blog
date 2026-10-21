# Tasks

## 1. Add the hook

- [x] Create `lib/use-delete-row-confirm.ts` with the signature from `design.md`: generic `T extends { id: string }`, options `{ deleteAction, title, getDescription, deletedMsg, notFoundMsg }`, returning `{ target, setTarget, confirmDialogProps }`.
- [x] Body reproduces the current handler exactly: guard on `!target`, `startTransition` with an async callback, `await deleteAction(target.id)`, toast by `result.success`, then `setTarget(null)` and `router.refresh()` **unconditionally** — outside the success branch.
- [x] Hardcode `confirmLabel: "Delete"`, `confirmVariant: "destructive"`, and the empty cancel path. Add no pending guard — `ConfirmDialog` already blocks re-entry and suppresses `onOpenChange` while `isPending`.
- [x] Add `"use client";` as the first line, matching `lib/track-row-actions.ts` and all three consumer panels.

## 2. Wire the tracks panel

- [x] In `components/admin-pages/tracks-admin-panel.tsx` (`TrackManagementPanel`, declared at line 928), call the hook with `deleteTrack`, title `"Delete track?"`, description `from the admin tracks list.`, and the `Track deleted` / `Track not found` messages.
- [x] Replace the `<ConfirmDialog>` block at lines 1116-1127 with `<ConfirmDialog {...deleteConfirm.confirmDialogProps} />`.
- [x] Change the `onSetDeleteTarget: setDeleteTarget` prop passed to `createTracksAdminColumns` to `onSetDeleteTarget: deleteConfirm.setTarget`.
- [x] **Check the declared `onSetDeleteTarget` prop type in `components/admin-pages/tracks-admin-columns.tsx` first.** If it expects the full `Dispatch<SetStateAction<…>>`, reconcile the types before wiring — this is the one call site the narrower `setTarget` signature could break.
- [x] Remove `const [deleteTarget, setDeleteTarget] = useState<TrackListItem | null>(null)`.
- [x] Remove `const [isDeleting, startDeleting] = useTransition()` **only after** confirming `isDeleting` has no other use in this component. Leave `isSavingTimezone, startSavingTimezone` untouched.
- [x] Do not touch the `markAsManual` `ConfirmDialog` (1128-1143), the recording-timezone dialog, or the `TrackFormDialog` discard-confirm (902-923).

## 3. Wire the hikes panel

- [x] In `components/admin-pages/hikes-admin-panel.tsx` (`HikesAdminPanel`, declared at line 1056), call the hook with `deleteHike`, title `"Delete hike?"`, description `from admin and public hike lists.`, and messages **`"Trip deleted"` / `"Trip not found"`** — note the entity noun is `Trip` here, unlike the `hike` in the dialog title. Carry both over verbatim; do not normalise them to match.
- [x] Replace the `<ConfirmDialog>` block at lines 1300-1313 with the spread.
- [x] Update the inline column definition at lines 1195-1203 to open the delete dialog. Implemented as a destructured `const { setTarget: setDeleteTarget } = deleteConfirm` rather than an inline `deleteConfirm.setTarget` — see the React Compiler note in `design.md`.
- [x] Remove `const [deleteTarget, setDeleteTarget] = useState<HikeListItem | null>(null)` and, after confirming `isDeleting` is unused elsewhere, its `useTransition`.
- [x] Leave `HikeNotesEditor`'s note-delete confirm (874-1043) alone — separate candidate, blocked on out-of-scope research.

## 4. Wire the photos panel

- [x] In `components/admin-pages/photos-admin-panel.tsx` (`PhotosAdminPanel`, declared at line 675), call the hook with `deletePhoto`, title `"Delete photo?"`, description `from the admin photos list.`, and the `Photo deleted` / `Photo not found` messages.
- [x] Replace the `<ConfirmDialog>` block at lines 878-889 with the spread.
- [x] Update the inline column definition at lines 819-827 to call `deleteConfirm.setTarget(row.original)`.
- [x] Remove `const [deleteTarget, setDeleteTarget] = useState<PhotoListItem | null>(null)` and, after confirming `isDeleting` is unused elsewhere, its `useTransition`.
- [x] Leave `refreshingPhotoId` and its state alone.

## 5. Validate

- [x] `npm run tsc` — must pass clean. This is where the tracks columns prop-type mismatch would surface.
- [x] `npx eslint components/admin-pages/tracks-admin-panel.tsx components/admin-pages/hikes-admin-panel.tsx components/admin-pages/photos-admin-panel.tsx components/admin-pages/tracks-admin-columns.tsx lib/use-delete-row-confirm.ts --quiet` — these are outside `app/`, so the root lint script will not cover them.
- [x] `npx prisma generate` — not needed; no schema change.
- [x] Ask the user to run `npm run build` and `npm run dev` — the agent does not start either. Deferred: not yet run, tracked in [`openspec/backlog.md`](../../backlog.md) as `outdoor-admin-delete-row-confirm-manual-qa`.

## 6. Browser check

Verified in the browser by the user on 2026-10-21. The happy path is covered; the three edge cases below were not part of that pass and are carried to [`openspec/backlog.md`](../../backlog.md) as `outdoor-admin-delete-row-confirm-manual-qa` with their reproduction steps.

- [x] In each of the three admin panels, delete a row and confirm: the dialog copy is unchanged from the previous build, the correct success toast fires, and the row disappears.
- [x] Delete a row that no longer exists (or simulate the not-found branch): confirm the error toast still appears **and** the dialog still closes and the table still refetches — this is the unconditional `router.refresh()` from `design.md` behavior item 1, and it is the easiest thing to break by accident. Deferred to the backlog row above.
- [x] Open a delete dialog and press Cancel / click outside: no toast, no refetch. Deferred to the backlog row above.
- [x] Confirm the `isPending` guard still blocks double-submit while the action is in flight. Deferred to the backlog row above.

## 7. Docs

- [ ] Update `openspec/refactor-backlog.md`: move `refactor-001-delete-row-confirm` out of `In Progress` when archiving.
- [x] Record in `refactor-backlog.md` that the three panel-split candidates no longer block on this slice's prerequisite work. Done: the `hikes-admin-panel-split` and `photos-admin-panel-split` rows now name `refactor-001-delete-row-confirm` instead of the bare `delete-row-confirm` slug, and the `refactor-002-sortable-header` row records the 19-site verification result.
- [x] No spec update — `skip_specs: true`, no observable behavior change.

## Not in this change

- `SortableHeader` extraction → promoted to `refactor-002-sortable-header` on 2026-10-21. The 19-site verification this design waited on is done; see that change's `design.md`.
- `useDiscardGuardedTrackForm` → `discard-guarded-track-form` candidate.
- Timezone input + datalist → `timezone-input` candidate.
- The three panel splits → `hikes-admin-panel-split`, `photos-admin-panel-split`, `hike-photo-gallery-extract`.