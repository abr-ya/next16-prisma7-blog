# Research History

This file preserves completed numbered OpenSpec research outputs — investigations with no code changes.

Only completed research keeps permanent `research-XXX` numbers. Live unnumbered candidates are tracked in [`research-backlog.md`](./research-backlog.md), and a candidate receives the lowest unused research number only when promoted into investigation. Cancelled or deferred research candidates do not reserve research numbers.

## Completed Research

| ID | Change | Area | Summary |
| --- | --- | --- | --- |
| research-001 | `tracks-admin-panel-parallel-audit` | outdoor/tracks-edit | Audited the 7 largest admin / public components (5581 lines, measured 2026-10-20) for shared building blocks before promoting the queued `hikes-admin-panel-split` / `photos-admin-panel-split` / `hike-photo-gallery-extract` slices. Verdict: **feature-by-feature grouping wins** over panel-by-panel. 5 lift findings, 4 skip (2 of which were false premises — no shared filter state and no bulk-action wiring exist in any of the 7 files), 3 needs-more-research. Delivered three recommended slices: `refactor-001-delete-row-confirm`, `refactor-002-discard-guarded-track-form`, `refactor-003-timezone-input`. Declined the `panel-shell.tsx` / `useConfirmAction` / `TrackRecordingFields` shapes the proposal hypothesized. Pure research, no code changes. Output: [`openspec/changes/archive/2026-10-20-research-001-tracks-admin-panel-parallel-audit/output.md`](./changes/archive/2026-10-20-research-001-tracks-admin-panel-parallel-audit/output.md). |
