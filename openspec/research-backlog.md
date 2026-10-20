# Research Backlog

This backlog tracks live research candidates — investigation outputs with no code changes by default (for example shared-pattern audits or one-page write-ups). Live features, bug fixes, and verify scripts stay in [`backlog.md`](./backlog.md); live refactor candidates stay in [`refactor-backlog.md`](./refactor-backlog.md). Completed research archives in [`research-history.md`](./research-history.md).

A research candidate that surfaces a follow-up refactor or feature should hand that follow-up off to its proper pool; the research output itself only documents the investigation.

## Status Values

- `Candidate`: identified, but scope or timing is still flexible.
- `Ready`: scope is clear enough to promote into a numbered OpenSpec change.
- `In Progress`: investigation has started and the candidate has a `research-XXX` number.
- `Paused`: numbered work exists and should be preserved, but it is not the current implementation focus.

## Priority Values

- `P0 Now`: next or near-next work; important, unblocking, or clearly time-sensitive.
- `P1 Soon`: useful and reasonably clear, but not the immediate focus.
- `P2 Later`: valid work with known value, but sequencing is not urgent.
- `P3 Someday`: parked ideas, experiments, or large fuzzy directions.

## Numbering Rules

- `research-XXX-<short-slug>` — investigation outputs with **no** code change. The deliverable is the research write-up; the open question lives in `proposal/`. Numbered research archives in [`research-history.md`](./research-history.md).
- Research proposals keep `proposal/` and **omit both `design/` and `specs/`**; there is no `tasks/` implementation list because the output is a document. The proposal may end with the research write-up itself once accepted.
- Number by taking the lowest unused `research-XXX` counter after checking this file and [`research-history.md`](./research-history.md). Do not reuse numbers.

## Candidates

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| In Progress | research-001-tracks-admin-panel-parallel-audit | outdoor/tracks-edit | Before promoting further panel-split slices (for example `hikes-admin-panel-split`, `photos-admin-panel-split`, `hike-photo-gallery-extract`), do a focused read of the seven largest admin / public components to look for shared building blocks worth lifting together. Files in scope (line counts measured 2026-10-20; `tracks-admin-panel` shrunk 1446 → 1149 by feature-117): `components/admin-pages/tracks-admin-panel.tsx` (1149), `components/admin-pages/hikes-admin-panel.tsx` (1316), `components/admin-pages/photos-admin-panel.tsx` (892), `components/admin-pages/content-tags-inventory.tsx` (628), `components/admin-pages/video-form.tsx` (489), `components/hike-pages/hike-photo-gallery.tsx` (641), `components/hike-pages/hike-track-contribution-form.tsx` (466); total 5581 lines. Specific questions: (1) do the three `*AdminPanel` files share a common `DataTable + filter + bulk-action` pattern that could be lifted into a `components/admin-pages/panel-shell.tsx`? (2) do the timezone-dialog, mark-as-manual dialog, and confirm-discard dialogs all duplicate the same `ConfirmDialog` prop setup in a way that argues for a small `useConfirmAction` helper? (3) do `tracks-admin-panel.tsx` and `hike-track-contribution-form.tsx` share enough of the `Place on map` map editor + recording-metadata inputs that a `TrackRecordingFields` component could be lifted? Deliverable: one-page write-up of the shared patterns worth extracting (each marked `lift` / `skip` / `needs more research`), with a recommended grouping for the next 2-3 refactor slices (panel-by-panel vs feature-by-feature). Pure research, no code changes. Proposal: `openspec/changes/research-001-tracks-admin-panel-parallel-audit/proposal.md`. |
