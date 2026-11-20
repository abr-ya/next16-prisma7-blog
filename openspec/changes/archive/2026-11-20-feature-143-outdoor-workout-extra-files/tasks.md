# Tasks

## 1. Data layer

- [x] 1.1 Add `addTrackExtraFile(trackId, fileAssetId)` to `app/_data/tracks.ts` behind `requireTrustGatedAction("track-upload")`: owner scope, `READY` only, `MAX_TRACK_EXTRA_FILES = 5`, and the `ensureEligibleTrackFileAsset` guards.
- [x] 1.2 Fetch the file content and parse it with `buildTrackGpxMetadata`, storing a failed state like an unparseable primary, then create the `TrackGeometry` row and revalidate the detail and track paths.
- [x] 1.3 Add `removeTrackExtraFile(geometryId)`: owner-scoped lookup through the track, transaction deleting the geometry row and retiring the file asset as `PENDING_DELETE`, then revalidate.
- [x] 1.4 Confirm a route-primary workout accepts extras and that removing them never touches the route's file.

## 2. Read model

- [x] 2.1 Add `geometryId` to `PublicTrackSecondaryFile` and map it in `toPublicTrack`.
- [x] 2.2 Add `canManageExtraFiles` to `PublicTrack`: the viewer owns the track and it is `READY`.
- [x] 2.3 Keep `secondaryFiles` detail-only so the list payload does not grow.

## 3. UI

- [x] 3.1 On `/tracks/[slug]`, show the secondary-files section to the owner even when it is empty, with a short empty state.
- [x] 3.2 Add an owner-only **Add extra GPX** control using `TrackGpxUploadSection`, calling `addTrackExtraFile` and refreshing on success.
- [x] 3.3 Add a **Remove** action per secondary file calling `removeTrackExtraFile`, with a toast and refresh.
- [x] 3.4 Keep the section read-only for every other viewer and leave the existing download rules untouched.
- [x] 3.5 Keep the copy English, consistent with the page.

## 4. Verification

- [x] 4.1 Run `npm run tsc`.
- [x] 4.2 Run `npm run lint` and targeted `npx eslint` for the touched `app/_data`, `app/(public)` and `components/track-pages` files.
- [x] 4.3 Run `npx openspec validate --changes --strict`.
- [x] 4.4 Run a production build in the sandbox, or ask the owner to run it locally when the sandbox network is restricted.
- [x] 4.5 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`; verification creates no new tracks, and uses an already-uploaded GPX where possible.
