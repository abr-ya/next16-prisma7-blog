# Proposal

## Why

`feature-142` introduced track-owned secondary files and `feature-150` already draws them on the public map and lists them under the primary download rules, but they only appear when a route replaces a file-based primary. The owner cannot add another recording to a workout, cannot remove one, and cannot keep an extra export beside the main file.

This slice gives the owner that control. Choosing which file is primary is a separate follow-up, because it swaps the primary source and has its own guard rules.

## What Changes

- Let the owner add a secondary GPX file to a `READY` workout, including a route-primary workout that already keeps its original recording.
- Parse the added file server-side into the geometry metadata, so the existing public map line and file list pick it up without a read-path change.
- Let the owner remove a secondary file; its `FileAsset` is retired as `PENDING_DELETE`, never hard-deleted.
- Cap a workout at five secondary files, reject a file that is already the primary of a track or already attached to another geometry, and reject a pending draft.
- Add a **geometryId** and an owner-only **canManageExtraFiles** flag to the public payload so the page can show controls without a second query.
- Show an owner-only files section on `/tracks/[slug]` even when there are no secondary files yet: upload, list, and remove. Other viewers keep today's read-only list and downloads.
- Statistics stay primary-only: distance, time, moving time, and laps are computed from the primary geometry; secondary files contribute the dashed map line and their own download.

## Non-goals

- Choosing which file is primary, or promoting a secondary file; that is `outdoor-workout-primary-file-choice`.
- Ordering or labelling secondary files; the list stays in creation order.
- A storage quota for secondary files; the upload route's own size limit applies.
- Editing or re-parsing an existing secondary file's content.
- Public visibility controls per secondary file beyond the existing `FileAsset` visibility rules.
- Photo or coordinate inference from secondary files.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: the owner manages a bounded list of secondary GPX files on a ready workout, and the public payload exposes the ids and the owner flag needed by that UI.

## Impact

- `app/_data/tracks.ts` — add/remove actions, parsing of the added file, the file guards, the count cap, and the two new payload fields.
- `app/(public)/tracks/[slug]/page.tsx` and a new client control — the owner files section.
- No schema change, no migration, no dependency, and no read-path change.
