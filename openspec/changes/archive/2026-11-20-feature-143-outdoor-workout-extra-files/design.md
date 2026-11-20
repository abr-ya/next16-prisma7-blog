# Design

## Context

The model already supports what this slice needs:

- `TrackGeometry` holds `trackId`, a unique `fileAssetId`, parsed `metadata`, and timestamps; `feature-142` creates rows only when a route replaces a file primary.
- `FileAsset` carries the owner, purpose, visibility, and the `PENDING_DELETE` lifecycle the project uses instead of hard deletes.
- `toPublicTrack` already maps `geometries` to `secondaryFiles` with a parsed map line, and the public detail page renders them under the primary download rules.
- `ensureEligibleTrackFileAsset` already refuses a file that belongs to another track or is already a geometry.

What is missing is the owner-facing add/remove path and the ids the UI needs.

## Actions

Two async, owner-gated actions in `app/_data/tracks.ts`.

`addTrackExtraFile(trackId, fileAssetId)`:

1. Resolve the actor with `requireTrustGatedAction("track-upload")`, the same gate the initial upload used.
2. Load the track with the owner scope; refuse a missing track, a track that is not `READY`, and a track that already has `MAX_TRACK_EXTRA_FILES = 5` secondary files.
3. Load the file with the owner scope and the existing `ensureEligibleTrackFileAsset` guards: purpose `TRACK_GPX`, active status, not another track's primary, not already a geometry. A file already attached to the same track is refused by the `@unique` constraint and the guard.
4. Fetch the file's content and parse it with `buildTrackGpxMetadata`. An unparseable file is stored with a failed metadata state, exactly as an unparseable primary is; it simply contributes no map line.
5. Create the `TrackGeometry` row.
6. Revalidate the track detail path and the track paths.

`removeTrackExtraFile(geometryId)`:

1. Load the geometry through its track with the owner scope; a foreign or missing row answers not found.
2. In one transaction, delete the geometry row and retire the file asset (`ACTIVE` → `PENDING_DELETE`) with `deletedAt`.
3. Revalidate the track detail path and the track paths.

The route-primary branch is allowed: a route's own file is never in `geometries`, so removing every secondary file cannot touch the route geometry.

## Read Model

`PublicTrackSecondaryFile` gains `geometryId` (the `TrackGeometry` row id) so the remove action has a stable target.

`PublicTrack` gains `canManageExtraFiles`: the viewer owns the track and the track is `READY`. That is the same ownership test `canManageRoute` uses, but it must not disappear for a route-primary track or a track without an editable file, because the extra-file list is the point.

The public list payload keeps `secondaryFiles` empty as today; only the detail page carries them.

## UI

The public detail page's secondary-files section becomes:

- visible to the owner even when the list is empty, with a short empty state;
- one row per secondary file with the existing name, size, dates, and download, plus a **Remove** action for the owner;
- an **Add extra GPX** control that uses the shared `TrackGpxUploadSection`, then calls `addTrackExtraFile` with the uploaded id, toasts the outcome, and refreshes;
- unchanged for every other viewer: the current read-only list and download rules.

The copy stays English, like the rest of the track page.

## Visibility and Statistics

- An added file is created by the existing upload route with the same `FileAsset` visibility rules as any track upload, which today means private to the owner. The parsed map line still appears on the public map, matching how `feature-150` already treats a secondary recording; downloads follow the existing `FileAsset` rule.
- Distance, elapsed and moving time, pace inputs, laps, and the table values keep reading the primary geometry only. Secondary files never add to a statistic.

## Risks

- **Duplicate attachment.** Prevented by the unique `fileAssetId`, the existing eligibility guard, and the owner-scoped lookup.
- **Deleting the wrong file.** Only a `TrackGeometry` row can be removed; the primary file and the route file are outside the action's query.
- **Pending drafts.** Refused, because they have no primary geometry to compare against.
- **Unparseable extras.** Accepted with failed metadata, no map line, visible in the list; the owner can remove them.
- **Revalidation gaps.** Both actions use the existing detail and track revalidation helpers.
- **Payload growth.** One id and one boolean per track; the file list stays detail-only.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx openspec validate --changes --strict`, and a production build. Browser checks are deferred to a manual QA candidate; the happy path and guards can be exercised against an existing owner track and an already-uploaded GPX without creating new tracks.
