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

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| _(none yet)_ | | | |
