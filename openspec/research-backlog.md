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

- `research-XXX-<short-slug>` — investigation outputs with **no** code change. The question lives in `proposal.md`; the result lives in `output.md`. Numbered research archives in [`research-history.md`](./research-history.md).
- Research changes keep `proposal.md`, `design.md`, and `tasks.md` and **omit `specs/`** (no behavior change). `design.md` describes the investigation method — scope boundaries, what counts as evidence, the `lift` / `skip` / `needs more research` rubric, and the required structure of the output document. `tasks.md` is the investigation checklist and states the write-up's required sections **before** the read begins, so the deliverable is reviewable up front instead of invented while writing it.
- `research-001-tracks-admin-panel-parallel-audit` predates this rule and carries only `proposal.md` + `output.md`; its findings were resolved in place, so no `design.md` / `tasks.md` was written for it.
- Number by taking the lowest unused `research-XXX` counter after checking this file and [`research-history.md`](./research-history.md). Do not reuse numbers.

## Candidates

| Status | Candidate | Area | Summary |
| --- | --- | --- | --- |
| _(none yet)_ | | | |
