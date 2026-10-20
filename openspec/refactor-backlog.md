# Refactor Backlog

This backlog tracks live refactor candidates — internal code-hygiene changes that ship **without** any user-visible behavior change. Live features, bug fixes, and verify scripts stay in [`backlog.md`](./backlog.md); live research candidates stay in [`research-backlog.md`](./research-backlog.md). Completed refactors archive in [`refactor-history.md`](./refactor-history.md).

## Status Values

- `Candidate`: identified, but scope or timing is still flexible.
- `Ready`: scope is clear enough to promote into a numbered OpenSpec change.
- `In Progress`: implementation has started and the candidate has a `refactor-XXX` number.
- `Paused`: numbered work exists and should be preserved, but it is not the current implementation focus.

## Priority Values

- `P0 Now`: next or near-next work; important, unblocking, or clearly time-sensitive.
- `P1 Soon`: useful and reasonably clear, but not the immediate focus.
- `P2 Later`: valid work with known value, but sequencing is not urgent.
- `P3 Someday`: parked ideas, experiments, or large fuzzy directions.

## Numbering Rules

- `refactor-XXX-<short-slug>` — internal refactors with **no** observable behavior change. Numbered follow-up slices stay in this backlog until completed, then move to [`refactor-history.md`](./refactor-history.md).
- Refactor proposals keep `proposal/`, `design/`, and `tasks/` for reviewability, and **omit the `specs/` block** because there are no behavior deltas.
- **Hybrid rule:** if a candidate exposes *any* user-visible behavior change it is not a refactor — promote it under `feature-XXX` and let the refactor ride inside.
- Number by taking the lowest unused `refactor-XXX` counter after checking this file and [`refactor-history.md`](./refactor-history.md). Do not reuse numbers.
- Existing archived features that look like refactors (for example `feature-088-comments-helper-refactor`, `feature-117-outdoor-tracks-admin-panel-split`) stay on their original numbers; git history is the source of truth. They may be marked `reclassified: refactor` in `feature-history.md` if disambiguation is useful.

## Candidates

| Status | Candidate | Priority | Area | Summary |
| --- | --- | --- | --- | --- |
| Ready | delete-row-confirm | P0 Now | outdoor/tracks-edit | Extract `useDeleteRowConfirm<T>({ action, deletedMsg, notFoundMsg })` covering the ~35 near-verbatim lines per site of delete-row state trio + handler + `ConfirmDialog` block repeated at `tracks-admin-panel.tsx:941-1127`, `hikes-admin-panel.tsx:1073-1313`, `photos-admin-panel.tsx:679-889`. Highest-confidence lift from research-001; shrinks each panel by ~35 lines and unblocks the three panel-split candidates below. The byte-identical 3-line `SortableHeader` + `ArrowUpDown` (`tracks-admin-columns.tsx:61`, `hikes-admin-panel.tsx:1081`, `photos-admin-panel.tsx:730`) is a trivial same-PR cleanup. Source: research-001 output Q1/Q2. |
| Candidate | discard-guarded-track-form | P1 Soon | outdoor/tracks-edit | Extract `useDiscardGuardedTrackForm` covering the discard-unsaved lifecycle (`uploadedFileAssetIds` + `discardConfirmOpen` + `isDiscarding` + `hasGuardedChanges` + guarded `handleOpenChange` + `handleConfirmDiscard` calling `markDiscardedTrackGpxFileAssetsPendingDelete`) — ~50 lines including word-for-word dialog strings — duplicated at `tracks-admin-panel.tsx:174-265, 902-935` (`TrackFormDialog`) and `hike-track-contribution-form.tsx:105-156, 397-410`. Default to the feature-116 refactor shape (dumb section + callbacks). Source: research-001 output Q2. |
| Candidate | timezone-input | P1 Soon | outdoor/tracks-edit | Extract the timezone input + datalist duplicated in the tracks admin files (same `getSupportedTrackRecordingTimezones()` option source memoized twice). The photo-timezone variant (`photos-admin-panel.tsx`, 4 hardcoded options UTC / Europe/Sofia / Europe/Moscow / America/New_York) shows the same markup but different semantics — decide inside this slice whether it consumes the supported track timezone list. Source: research-001 output Q3. |
| Candidate | hikes-admin-panel-split | P1 Soon | outdoor/hikes-edit | Split `components/admin-pages/hikes-admin-panel.tsx` (1316 lines as of 2026-10-20) along the **feature-by-feature** grouping research-001 recommended. Prerequisite satisfied — research-001 shipped 2026-10-20 and returned a grouping. Note the audit found no shared filter-state and no bulk-action plumbing (both were false premises of the original hypothesis), so the split axes are the per-feature extractions: `useDeleteRowConfirm` from `delete-row-confirm`, the `HikeNotesEditor` note-delete confirm, and the panel-root/toolbar extras. **Depends on** `delete-row-confirm` landing first so the split works against a smaller file. Source: research-001 output Q1/Q2/Q3. |
| Candidate | photos-admin-panel-split | P2 Later | outdoor/photos-edit | Split `components/admin-pages/photos-admin-panel.tsx` (892 lines as of 2026-10-20) along the same feature-by-feature axes as the hikes panel. Inherits `useDeleteRowConfirm` from `delete-row-confirm`; remaining axes are the inline column-def `useMemo` and the panel-root/toolbar extras. **Depends on** `delete-row-confirm`, and is sequenced after `hikes-admin-panel-split` so the shared hook shape is proven on two panels first. Source: research-001 output Q1/Q2/Q3. |
| Candidate | hike-photo-gallery-extract | P2 Later | outdoor/photos | Extract shared photo-rendering building blocks from `components/hike-pages/hike-photo-gallery.tsx` (641 lines as of 2026-10-20) and any other photo-rendering components it duplicates with. Note the audit found **zero** `ConfirmDialog` invocations here — its four dialogs are content viewers, not confirms — so the extraction axes are the rendering blocks, not dialog plumbing. Prerequisite satisfied — research-001 shipped 2026-10-20. Independent of the panel splits. Source: research-001 output Q2. |
