# Proposal

## Why

A single bad GPS fix (a tunnel, a tall building, a lost signal) can throw a point kilometres away and distort the distance, map line, and speed of an otherwise good track. Today the owner can only delete the whole track or re-upload a corrected GPX from another tool. The backlog research (`docs/outdoor-tracks-feature-research-2026-10-07.md`) identified point deletion as the next track-editing slice, and the create-time editor from `feature-111`–`feature-114` already proved the map and speed-chart interaction model.

## What Changes

- Add an owner-only **Clean up points** action to the public track detail page (`/tracks/[slug]`) when the track owns its GPX file (no route-linked geometry). The action opens a wide, scrollable modal.
- The modal shows the track line on a map and a speed chart below it. The chart is available when the stored GPX carries timestamps; a track without them still allows map/list selection.
- Click a point to mark it for deletion; drag on the speed chart to mark a contiguous range. Selected points are visually distinct and the count is shown before saving.
- On save, the server re-reads the **full** GPX, removes the selected points, and rewrites the file surgically so elevation, timestamps, and any vendor extensions survive. A single click also removes hidden neighbours through a radius + time-window rule, so points outside the 1000-point simplified metadata are still handled.
- Upload the rewritten GPX, swap `Track.fileAssetId` in one transaction, retire the old `FileAsset` as `PENDING_DELETE`, and re-parse metadata from the same bytes so distance, point count, map line, and timeline all update.
- Reject saves that would leave fewer than two points, that target a route-based or foreign track, or whose file changed after the modal loaded.
- Add English and Russian copy for the action, modal, selection summary, empty states, and errors.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: the owner gains a saved-track point cleanup surface with full-GPX rewriting and lifecycle-safe file replacement.

## Impact

- New `lib/track-gpx-edit.ts`: editable point extraction, speed derivation, removal mask, radius/time expansion, and XML splicing.
- New `app/_data/track-point-cleanup.ts` (or additions to `app/_data/tracks.ts`): owner-scoped loader and save action with the upload → transaction → re-parse sequence.
- New `components/track-pages/track-point-cleanup-dialog.tsx`, `track-point-cleanup-map.tsx`, `track-point-speed-chart.tsx`.
- `app/(public)/tracks/[slug]/page.tsx`: optional session read and the owner-only entry button; `getPublicTrackBySlug` gains an optional viewer argument so the page can decide access without exposing a user id.
- `lib/track-gpx-parser.ts`: expose the existing private full-point parser for reuse.
- `app/i18n/locales/{en,ru}/trips.json`: cleanup copy.
- `scripts/` verification for the removal helper.
- No Prisma schema change, no migration, no route change. The old file row is retained as `PENDING_DELETE`; no restore UI in this slice.

## Non-Goals

- Auto-detecting suspicious points (separate `outdoor-track-cleanup-improvements`).
- Undo/redo, preview-diff before save, map drag-range selection, or multi-drag.
- Revision backup and restore (separate `outdoor-track-gpx-revisions`); the retired file is not restorable from the UI.
- The mobile full-screen Sheet (separate `outdoor-track-point-deletion-mobile-sheet`).
- Editing route-based tracks, trips, or other users' tracks.
- Localizing the rest of the public track page; new strings go through the existing `trips` namespace.
