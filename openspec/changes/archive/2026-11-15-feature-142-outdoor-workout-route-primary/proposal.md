# Proposal

## Why

An owner can keep the original GPX recording of a workout while a cleaner route defines its public shape, distance, and map. Today a `READY` track has exactly one geometry source and therefore cannot take a route without discarding the file it was recorded with; `feature-141` deliberately left that demotion to this slice.

## What Changes

- Add a `TrackGeometry` table holding a track-owned GPX file and its parsed metadata as **secondary** geometry.
- Add an **Attach route** flow on the owner's published track page:
  - choose an existing owned route or create a new one from placed points;
  - the chosen route becomes primary;
  - the track's own file and metadata move into a `TrackGeometry` row in the same transaction;
  - the track's slug, status, title, description, kind, activity type, gear, trip links, private note, recording start, duration, timezone, and `timeSource` stay unchanged.
- Allow **Change route** on a workout that already has a primary route: the chosen route replaces it while the secondary file stays untouched.
- Show a confirmation before the public geometry changes, naming the new map/distance source and what happens to the current file.
- Draw the current track under the placed points in the route-creation flow so the owner can match the new shape against the recording.
- Offer the action only on a published track page; a draft has no public page and is attached after publication.
- Show secondary files on the public track detail page with the existing file-visibility rules for download.
- Retire every track-owned secondary file asset when the track is deleted.
- Allow a demoted file as secondary geometry in the draft-completion requirement; a route still always wins.

## Non-goals

- Multiple secondary files, adding or removing an individual file, and choosing a primary file when no route exists — that is `feature-143`.
- Detaching an attached route or promoting a secondary file back to primary; only replacing one route with another is supported.
- Renaming, point cleanup, or per-file removal on a secondary file; those actions stay primary-file-only in this slice.
- Attaching a route from a draft workout or from the owner tables; drafts are attached after publication.
- Administrator cross-user attach; the action is owner-only.
- Changes to drafts, quick uploads, public listings, or admin tables beyond the file count needed by the owner's dialog.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: the geometry-source rule gains track-owned secondary files, a new primary-route swap requirement, secondary-file display and download rules, deletion cleanup for secondary files, and the draft-completion restriction on demoted files is removed.

## Impact

- `prisma/schema.prisma` and a forward migration: `TrackGeometry` model plus relations on `Track` and `FileAsset`.
- `app/_data/tracks.ts`: extended attach/replace action, owner-visibility fields on the public track projection, secondary-file projection, secondary-file cleanup in `deleteTrack`.
- `app/(public)/tracks/[slug]/page.tsx` and a new client attach/change-route control: owner-only trigger, confirmation, and dialog wiring with the owner's routes.
- `components/track-pages/route-form-dialog.tsx`, `track-editor.tsx`, `track-editor-map.tsx`: optional background geometry for the route-creation map.
- `app/i18n/locales/{en,ru}/trips.json`: owner-side dialog copy; the public page labels follow its existing English copy.
- `openspec/specs/outdoor-tracks/spec.md`: modified and added requirements.
