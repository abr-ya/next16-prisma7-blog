# Proposal

## Why

**No user-visible outcome — this is a pure internal refactor.** The admin CRUD panels each carry a near-verbatim copy of the same delete-row confirmation lifecycle: a three-`useState` trio, an async delete handler, and a `<ConfirmDialog>` block wired with the same props in the same order. Three panels duplicate it today.

research-001 (`openspec/changes/archive/2026-10-20-research-001-tracks-admin-panel-parallel-audit/output.md`) audited the seven largest admin and public components and returned feature-by-feature grouping over panel-by-panel, naming this the highest-confidence lift of the three recommended slices. Its Q1/Q2 tables graded the delete-row lifecycle **lift (strong)** across `tracks-admin-panel.tsx:941-1127`, `hikes-admin-panel.tsx:1073-1313`, and `photos-admin-panel.tsx:679-889`.

Extracting it is a prerequisite, not a nicety: research-001 concluded the three queued panel splits (`hikes-admin-panel-split`, `photos-admin-panel-split`, `hike-photo-gallery-extract`) should "proceed against smaller files after the extractions land." Shipping the splits first would mean re-editing the same lines twice.

## What Changes

- **Extract `useDeleteRowConfirm<T>`** into a shared location, owning the whole delete-row confirm lifecycle: the pending-target state trio, the open/close transition, the `isPending` flag, target clearing after success, and the not-found branch.
- **Wire all three admin panels** to the hook: `components/admin-pages/tracks-admin-panel.tsx`, `components/admin-pages/hikes-admin-panel.tsx`, `components/admin-pages/photos-admin-panel.tsx`.

Net effect: roughly 35 lines removed from each of the three panels.

Recon during design confirmed the extraction is clean — the three handler bodies are byte-identical modulo the action name and two string literals, and no panel carries extra logic (no selection reset, no form clearing, no differing refetch). Six things parameterize: the row generic, the action, the dialog title, a description **builder** (the three wordings differ, not just the entity noun), and the two toast messages.

### Non-goals

- **No behavior change of any kind.** Same dialog copy, same messages, same confirmation semantics, same server actions. This is the definition that keeps the change in the `refactor-XXX` pool under the hybrid rule.
- **Not extracting the note-delete confirm** from `HikeNotesEditor` (`hikes-admin-panel.tsx:874-1043`). research-001 graded it **needs more research**: aligning it requires inspecting `ConfirmDialog` callers outside the seven in-scope files (`files-table`, `videos-table`) to settle whether the target shape is id-keyed or entity-keyed. Out of scope here.
- **Not touching the four `content-tags-inventory.tsx` sites** or the single `video-form.tsx` site. research-001 graded both **skip** — `content-tags-inventory` already factors its own `runAction` wrapper locally, and `video-form` is the only consumer of `onCancel`, so neither has anything to share yet.
- **Not performing the panel splits themselves.** Those are separate candidates (`hikes-admin-panel-split`, `photos-admin-panel-split`, `hike-photo-gallery-extract`) in `openspec/refactor-backlog.md`.
- **Not adding `useConfirmAction`, `panel-shell`, or `TrackRecordingFields`.** research-001 explicitly declined all three: two of them rested on false premises (no shared filter state and no bulk-action wiring exist in any of the seven files), and `TrackRecordingFields` is not actually duplicated today.
- **Not lifting the shared track timezone input** — that is `timezone-input`, a separate candidate.
- **Not extracting a `SortableHeader` helper.** research-001 verified the sortable-title header byte-identical at three panel sites and suggested it as same-PR cleanup, since it touches the same files and the same table-header region. A follow-up sweep then found the same pattern in **seven more** `components/admin-pages/` tables (`videos-table`, `links-table`, `categories-table`, `posts-table`, `files-table`, `video-channels-table`, `md-docs-table`). Those seven were never checked for byte-identity, so there are ten possible sites rather than three confirmed ones. Extracting a helper at three of ten would leave the codebase asymmetric — a helper in three files against inline JSX in seven — which is worse than the uniform duplicate it replaces. It becomes the separate `sortable-header` candidate, which starts by verifying all ten sites.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

Pure internal refactor with no observable behavior change, so there are no spec deltas. `skip_specs: true`.

## Impact

- **Schemas**: no Prisma migration, no database impact.
- **Routes**: none. All three call sites are admin-only components under `/admin`.
- **Public surfaces**: none. The hook is internal to `components/admin-pages/`.
- **Code**: 3 panel files modified, 1 columns file modified, 1 new hook file, 1 new `SortableHeader` file (or both in one module).
- **Behavior**: unchanged — the hybrid rule is what keeps this in the refactor pool.