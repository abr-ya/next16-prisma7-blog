# Proposal

## Why

**No user-visible outcome — this is a pure internal refactor.** Every sortable column header in the admin surface is the same four lines of JSX, repeated 19 times across 10 table files. The only differences between sites are the label text and, at 5 of them, a fixed width `className`.

This candidate was split out of `refactor-001` on 2026-10-20 with one condition attached: *"verify byte-identity at all ten possible sites before extracting."* research-001 had confirmed 3 of them; a follow-up sweep had found the pattern in 7 more files that nobody had checked. Converting 3 of 10 would have left a helper in three files against inline JSX in seven, which is worse than the uniform duplicate it replaces.

That condition is now satisfied. A hash sweep over every `toggleSorting` occurrence in `components/` on 2026-10-21 found 19 sites, which collapse into 10 distinct shapes differing only in label text and optional `className`. The extraction can proceed as a clean mechanical sweep with no per-site judgment.

It is also a prerequisite, not a nicety. The next slice — sortable `Updated` columns in the three outdoor admin panels — would otherwise be three more copies of the same block. Doing the extraction first turns that feature into three one-line call sites.

## What Changes

- **Add a `SortableHeader` component** at `components/common/sortable-header.tsx`, exported from the `components/index.ts` barrel next to `ConfirmDialog` and `DataTable`.
- **Convert all 19 existing sites in the same change** across 10 files: `categories-table`, `files-table`, `hikes-admin-panel`, `links-table`, `md-docs-table`, `photos-admin-panel`, `posts-table`, `tracks-admin-columns`, `video-channels-table`, `videos-table`.
- **Drop the now-unused `ArrowUpDown` import** from all 10 files — it is only ever used inside these headers.

No table gains, loses, or reorders a column. Every header keeps its exact label, width, and click behavior.

### Non-goals

- **No behavior change of any kind.** No new sortable column, no changed label, no changed width, no changed click semantics. This is the definition that keeps the change in the `refactor-XXX` pool under the hybrid rule.
- **Not adding sorting to the `Updated` column** in the photos, hikes, or tracks panels. That is user-visible and ships as a separate `feature-XXX` change; see `openspec/backlog.md`.
- **Not touching the `cell:` renderers.** The header block is the only thing these 19 sites share. The `cell` under each header differs per table — tracks renders a `<Link>`, hikes and photos render a plain `<div>`, videos renders channel and tag lists — so there is nothing to extract there.
- **Not normalizing the 5 width `className` values** (`w-36 justify-start` ×4, `w-28 justify-start` ×1). Dropping them would change column widths, which is a visible change and would forfeit the refactor pool.
- **Not converting the audit scope.** The `toggleSorting` sweep covered all of `components/`, not just `components/admin-pages/`; only these 10 files matched. There is no twelfth file.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

Pure internal refactor with no observable behavior change, so there are no spec deltas. `skip_specs: true`.

## Impact

- **Schemas**: no Prisma migration, no database impact.
- **Routes**: none. All 10 files are `"use client"` admin table components; the barrel export is consumed only under `/admin`.
- **Public surfaces**: none. No file outside `components/admin-pages/` renders these headers.
- **Code**: 1 new component file, 1 new barrel export line, 10 table files modified.
- **Behavior**: unchanged — the hybrid rule is what keeps this in the refactor pool.