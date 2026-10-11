# Proposal

## Why

Today, the public trip detail page (`/trips/[slug]`) lets a trip creator add photos from the same screen where their photos live, but they must leave that screen and visit `/my/tracks` (or `/admin/trips`) to add or attach a track. That round-trip is awkward for the common case where the trip creator is on the trip page, wants to associate the GPX they recorded this morning with this trip, and should not have to context-switch. Symmetric with the `Add photo` button on the trip page, the trip creator should be able to attach an existing owned track or upload a new GPX from the trip page itself.

## What Changes

- Add a new server action `createTrackAndAttachToHike` in `app/_data/hikes.ts` (next to the existing `attachTrackToHike` and `detachTrackFromHike`) that, inside one `prisma.$transaction`, validates the creator viewer against `requireTrustGatedAction("track-upload")` and `assertVerifiedResourceQuota(tx, user, "track")`, reuses the existing `createTrack` logic to write a new `FileAsset` (`purpose = TRACK_GPX`) + `Track` from a freshly uploaded GPX, and inserts a `HikesToTracks` row linking the new track to the trip in the same transaction.
- Extract the GPX upload subform from `TrackFormDialog` (`components/admin-pages/tracks-admin-panel.tsx`) into a new shared client component `components/track-pages/track-gpx-upload-section.tsx`. `TrackFormDialog` (used by `/admin/tracks` and `/my/tracks`) and the new trip-side dialog both consume this section so the upload UX, validation, dirty-close guard, and UploadThing plumbing stay in one place.
- Add a new client component `components/hike-pages/hike-track-contribution-form.tsx` exposing `HikeTrackContributionButton` and `HikeTrackContributionDialog`. The dialog has two sections controlled by a small `Tabs` (or radio) switch:
  - **Attach existing** — a server-derived list of the creator's own unlinked tracks (`Track.userId === viewer.id` and no `HikesToTracks` row). Each row shows the track title and an `Attach` button that calls the existing `attachTrackToHike({ hikeId, trackId })` server action unchanged. Empty state copy directs the creator to the upload section.
  - **Upload new** — embeds the shared `TrackGpxUploadSection` plus the minimum owner-side fields (title, slug, description, status, recording timezone, activity type). Submitting uploads the GPX through the shared section, calls `createTrackAndAttachToHike`, and on success closes the dialog and triggers `router.refresh()`.
- Mount `HikeTrackContributionButton` on `app/(public)/hikes/[slug]/page.tsx` near the linked tracks card. The button visibility and disabled feedback come from a new `getHikeTrackContributionCapability(hikeId)` helper that returns `{ eligible: boolean, viewer: "anonymous" | "non-owner" | "owner-trust-ineligible" | "owner-quota-reached" | "owner-eligible", remainingTrackCount }`. Disabled buttons render localized feedback inline, mirroring the feature-107 `Add Trip` pattern on `/trips`. Hidden entirely when the viewer is a participant or a non-owner authenticated user, since the feature is creator-only.
- Localize all new strings in the established `trips` namespace (English/Russian); no new top-level dependency.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `outdoor-tracks`: Extend the track domain to let the trip creator attach an existing owned unlinked track to their trip, or upload a new GPX track from the trip detail page and attach it in the same submission, with the same trust, quota, ownership, and GPX validation rules already used on `/my/tracks`. Add a shared GPX upload UI subcomponent so the existing `/admin/tracks` and `/my/tracks` create/edit flows and the new trip-side dialog render the same upload piece without UI drift.

## Impact

- **Server**: new `createTrackAndAttachToHike` in `app/_data/hikes.ts` (sibling to `attachTrackToHike` / `detachTrackFromHike`). New `getHikeTrackContributionCapability` helper colocated with the existing `getPublicHike*` helpers. No new trust action registration, no quota action change.
- **Client**: new `components/hike-pages/hike-track-contribution-form.tsx`, new `components/track-pages/track-gpx-upload-section.tsx`, refactor `components/admin-pages/tracks-admin-panel.tsx` to delegate the upload subform to the shared section without touching its public API or dirty-close guard. New `HikeTrackContributionButton` mounted from the public trip detail page.
- **Public surface**: only `app/(public)/hikes/[slug]/page.tsx` (and its `/trips/[slug]` re-export). The button is creator-only and disabled with localized feedback for everyone else; it is hidden when the viewer is a participant or a non-owner authenticated user.
- **Admin surface**: unchanged — `/admin/trips` continues to use the existing `HikeTracksDialog` for attach/detach; the new dialog is a separate flow.
- **No schema, no migration, no new dependency**, no new trust/quota action registration.
- **Explicit non-goals**: detach of currently-attached tracks from the trip page (separate candidate, deferred); map-placement track creation on the trip page (owned by feature-109 on `/my/tracks`); participant uploads or attachment of another user's tracks; public `/tracks` entry; admin variant beyond the existing `HikeTracksDialog`; new admin controls.