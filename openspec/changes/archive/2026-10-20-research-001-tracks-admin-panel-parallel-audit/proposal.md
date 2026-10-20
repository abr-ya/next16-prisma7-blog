# Proposal

## Why

The next non-tracks panel split (`hikes-admin-panel-split`, `photos-admin-panel-split`, `hike-photo-gallery-extract`) is currently blocked on a pre-work research step. The previous refactor slice for `tracks-admin-panel` (feature-117, shipped 2026-10-18) was deliberately scoped narrowly to one panel; the user's design instruction at the time was to first do a focused read across the related large admin and public components to identify shared building blocks worth lifting together — `panel-shell.tsx` for the `DataTable + filter + bulk-action` pattern, `useConfirmAction` for duplicated dialogs, or a feature-by-feature grouping. Without this audit, promoting any non-tracks slice risks re-implementing the same shared building blocks inline a second or third time.

This change is pure research with no code changes anywhere.

## What Changes

- **Read the seven in-scope files** and snapshot current size, table/filter/dialog patterns, and any cross-file duplication. The seven files (line counts measured 2026-10-20; `tracks-admin-panel` already shrunk from 1446 to 1149 by feature-117):
  - `components/admin-pages/tracks-admin-panel.tsx` — 1149 lines.
  - `components/admin-pages/hikes-admin-panel.tsx` — 1316 lines.
  - `components/admin-pages/photos-admin-panel.tsx` — 892 lines.
  - `components/admin-pages/content-tags-inventory.tsx` — 628 lines.
  - `components/admin-pages/video-form.tsx` — 489 lines.
  - `components/hike-pages/hike-photo-gallery.tsx` — 641 lines.
  - `components/hike-pages/hike-track-contribution-form.tsx` — 466 lines.
  - Total: 5581 lines.
- **Answer three specific questions** during the read:
  1. **Panel shell.** Do the three `*AdminPanel` files share a common `DataTable + filter + bulk-action` pattern that could be lifted into a single `components/admin-pages/panel-shell.tsx`? Specify what is genuinely shared vs what only looks shared.
  2. **Confirm-dialog helper.** Do the timezone-dialog, mark-as-manual dialog, and confirm-discard dialogs inside these panels (and possibly the admin photo / file manager) duplicate the same `ConfirmDialog` prop setup in a way that argues for a small `useConfirmAction` helper? Distinguish repeated `ConfirmDialog` props from `useState + open/close/onConfirm` lifecycle duplication.
  3. **`TrackRecordingFields`.** Do `tracks-admin-panel.tsx` (in-dialog recording-metadata inputs) and `hike-track-contribution-form.tsx` (trip-page `TrackGpxUploadSection` / place-on-map editor) share enough of the `Place on map` map editor plus the four recording-metadata inputs from feature-116 that a `TrackRecordingFields` component could be lifted? Stay narrowly within place-on-map plus the four recording-metadata inputs; the broader 600-line `TrackFormDialog` is out of scope for this question.
- **Deliver a one-page write-up** at `openspec/changes/research-001-tracks-admin-panel-parallel-audit/output.md` that:
  - Lists shared patterns actually found, each with file paths and approximate line offsets.
  - Marks each candidate extraction as **lift** (worth a follow-up `refactor-XXX` slice) / **skip** (the apparent duplication is a false positive) / **needs more research** (the pattern is shared but the right extraction shape is unclear).
  - Recommends the grouping for the next two to three refactor slices — panel-by-panel vs feature-by-feature — based on what the read actually shows, not on prior assumptions.

### Non-goals

- No code changes anywhere, even small ones. This is research only.
- Not promoting `hikes-admin-panel-split`, `photos-admin-panel-split`, `hike-photo-gallery-extract`, `useConfirmAction`, `panel-shell`, or `TrackRecordingFields` in this change — each becomes its own `refactor-XXX` change with its own proposal/design/tasks once the audit recommends a grouping.
- Not reading files outside the seven listed above. New candidates that surface during the read are recorded under **needs more research** rather than expanding scope here.
- Not bundling a subsequent refactor slice into the same change. Each refactor lives on its own.
- Not updating `openspec/backlog.md` candidates (for example adding `useConfirmAction` extraction as its own `refactor-XXX` candidate); the audit output is the proper place to add them, after acceptance.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None.

This is pure research with no observable behavior change. `skip_specs: true`.

## Impact

- **Schemas**: no Prisma migration; no database impact.
- **Code**: no files modified, only reads.
- **New artifacts**:
  - `openspec/changes/research-001-tracks-admin-panel-parallel-audit/output.md` — the one-page write-up (the deliverable).
  - `openspec/changes/research-001-tracks-admin-panel-parallel-audit/.openspec.yaml` — `skip_specs: true` (no behavior change, no spec deltas).
  - `openspec/changes/research-001-tracks-admin-panel-parallel-audit/proposal.md` — this file.
- **Modified artifacts**:
  - `openspec/research-backlog.md` — candidate row added with status `In Progress`.
  - `openspec/backlog.md` — candidate row removed from the high-priority roadmap table.
