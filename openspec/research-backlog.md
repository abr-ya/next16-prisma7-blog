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
| Candidate | tracks-page-visibility-and-status-toggle | outdoor/tracks | Investigate the tracks surfaces before the next change touches them: what the public `/tracks` page shows today, which tracks every surface exposes to whom (the public list, the public detail page, the owner's tables, the administrative table, and the tracks linked to a trip), and whether a status control belongs directly in the track table — a per-row publish/unpublish next to the existing row actions, or only the status field in the edit form. The write-up should state the visibility model as it stands (which query filters on `status` and which does not, and what a published track exposes that a draft does not), the cost of a per-row status write (the revalidation it triggers, the auto-generated title a quick upload produces, and the fact that publishing a track does not publish its GPX file), and a recommendation for the one place a status may be changed from. No code change — the result is a write-up; the follow-up it produces is filed in its proper pool. |
| Candidate | responsive-data-table-mobile-layout-audit | ui/tables | Investigate how the shared `DataTable` should present data on mobile. Inventory every current usage (owner workouts/tracks/routes/gear, admin posts/videos/files/photos/trips and the smaller admin lists), record columns, cell complexity, row actions, sorting, and pagination, then evaluate the options: keep the table with horizontal scroll, hide or collapse secondary columns, or replace rows with a card/feed presentation that keeps the primary fields and actions. Recommend one shared pattern (a mobile presentation component or a variant of `DataTable`), which tables adopt it first, and which tables are too dense for cards and keep a table fallback. The owner noticed on 2026-11-04 that `/my/workouts` is hard to use on a phone; scope the audit across all tables so the pattern is decided once, but propose implementation slices that start with the owner-facing workouts and tracks lists. No code change — the output is a write-up, and the follow-up lands in `feature-XXX` or `refactor-XXX` as appropriate. |
