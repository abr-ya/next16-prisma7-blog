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
| _(none yet)_ | | | |
