# Tasks

## 1. Shared upload section extraction

- [ ] 1.1 Create `components/track-pages/track-gpx-upload-section.tsx` exporting `TrackGpxUploadSection` with the props listed in `design.md` (value/onChange/onParse/parsing/parseState/uploadedFileAssetIds/onDiscardUploaded), encapsulating the `UploadDropzone`, file validation messaging, and `useWatch` plumbing that currently live inside `TrackFormDialog`; verify the component renders identically to the inline upload piece by side-by-side smoke on `/admin/tracks`.
- [ ] 1.2 Refactor `TrackFormDialog` in `components/admin-pages/tracks-admin-panel.tsx` to import and render `TrackGpxUploadSection` instead of the inline dropzone, keeping the dirty-close `Dialog` and the `markDiscardedTrackGpxFileAssetsPendingDelete` call in the parent; verify `/admin/tracks` and `/my/tracks` upload + dirty-close + parse-GPX flows render and behave identically.
- [ ] 1.3 Verify no new lint warnings are introduced by running `npx eslint components/track-pages/track-gpx-upload-section.tsx components/admin-pages/tracks-admin-panel.tsx --quiet`; verify `npm run tsc` still passes for both consumers.

## 2. Server actions and read helpers

- [ ] 2.1 Add `createTrackAndAttachToHike(input)` in `app/_data/hikes.ts` with the shape and transaction flow in `design.md`; verify the action calls `requireTrustGatedAction("track-upload")`, `assertVerifiedResourceQuota(tx, user, "track")`, validates trip ownership, validates the supplied `fileAssetId` through the existing `ensureEligibleTrackFileAsset` helper, checks slug uniqueness, writes `Track` + `HikesToTracks` atomically, and triggers `parseTrackGpx` outside the transaction.
- [ ] 2.2 Add `getHikeTrackContributionCapability(hikeId)` in `app/_data/hikes.ts` with the five viewer states enumerated in `design.md`; verify the helper returns `eligible: false` for anonymous / non-owner / trust-ineligible viewers, `eligible: true` with a non-null `remainingTrackCount` for an eligible owner, and `eligible: false` with `remainingTrackCount: 0` when the quota cap is reached.
- [ ] 2.3 Add `getCreatorUnlinkedTracks(userId)` in `app/_data/tracks.ts` returning tracks owned by `userId` that have no `HikesToTracks` row, ordered by `updatedAt desc`, projecting only `id`, `title`, `slug`, `updatedAt`, and parse state; verify with a local-only script that the helper excludes a track the moment an attach succeeds.
- [ ] 2.4 Add a small verification script `scripts/verify-hike-track-attach.mjs` that exercises the happy path plus at least the trust, quota, slug, and ineligible-`fileAssetId` rejection paths against a temporary database; verify every path returns the documented `code` and produces the expected set of rows.

## 3. Trip contribution dialog and button

- [ ] 3.1 Create `components/hike-pages/hike-track-contribution-form.tsx` exporting `HikeTrackContributionButton` and `HikeTrackContributionDialog`; verify the button renders disabled for `viewer: "owner-quota-reached"` with localized quota-reached copy, and is omitted from the page when `viewer` is `anonymous`, `non-owner`, or `owner-trust-ineligible`.
- [ ] 3.2 Render a `Tabs` (or radio) switch inside the dialog with two sections: `Attach existing` and `Upload new`; verify the attach section lists `ownerUnlinkedTracks`, shows the empty state when the list is empty, and renders an `Attach` button per row that calls `attachTrackToHike({ hikeId, trackId })`.
- [ ] 3.3 Render `TrackGpxUploadSection` inside the upload section plus the minimum owner-side fields (title, slug, description, status, recording timezone, activity type); verify the dialog's submit handler calls `createTrackAndAttachToHike`, closes the dialog on `{ ok: true }`, calls `router.refresh()`, and keeps the dialog open with a localized toast on `{ ok: false }`.
- [ ] 3.4 Reuse the existing dirty-close `Dialog` and `markDiscardedTrackGpxFileAssetsPendingDelete` plumbing for any unsaved uploaded GPX files; verify the dialog never introduces a parallel discard helper or guard state.

## 4. Public trip page wiring

- [ ] 4.1 Update `app/(public)/hikes/[slug]/page.tsx` (and its `/trips/[slug]` re-export) to call `getHikeTrackContributionCapability(hike.id)` plus `getCreatorUnlinkedTracks(viewer.id)` (only when capability is eligible) plus `getActiveTrackActivityTypes()` in parallel with the existing data load; verify the page renders without any new data fetch round-trips.
- [ ] 4.2 Mount `HikeTrackContributionButton` near the linked tracks card with the capability result and the owner unlinked tracks list; verify the button is omitted for participants and anonymous viewers, disabled with localized copy for quota-reached creators, and enabled for eligible creators.

## 5. Localization

- [ ] 5.1 Add the new keys (`Add track`, `Attach existing`, `Upload new`, `No unlinked tracks yet — upload one below`, `quota reached` message, etc.) under the existing `trips` namespace in `app/i18n/locales/en/trips.json` and `app/i18n/locales/ru/trips.json`; verify both locales render with English fallback when the Russian key is absent.

## 6. Validation

- [ ] 6.1 Run `npm run tsc` and verify the new files compile without type errors.
- [ ] 6.2 Run `npm run lint` plus targeted `npx eslint app/_data/hikes.ts app/_data/tracks.ts components/hike-pages/hike-track-contribution-form.tsx components/track-pages/track-gpx-upload-section.tsx components/admin-pages/tracks-admin-panel.tsx app/(public)/hikes/[slug]/page.tsx --quiet`; verify no new lint warnings are introduced.
- [ ] 6.3 Run `npm run build` and verify the production build succeeds with the new dialog reachable at `/trips/[slug]` for a verified owner.
- [ ] 6.4 Perform a manual browser smoke test as a verified trip owner with suitable unlinked tracks: attach an existing owned track from the trip page, upload a new GPX from the trip page, observe the linked tracks list refresh, repeat for an anonymous viewer, a non-owner viewer, an ineligible-trust owner, and a quota-reached owner. Record the result in a short note attached to the change.

## 7. Docs and backlog updates

- [ ] 7.1 Update the `outdoor-hike-owner-track-upload` row in `openspec/backlog.md` to `Done | feature-110-outdoor-hike-owner-track-upload | outdoor/hikes-tracks | ...` with a one-line summary noting the deferred detach slice, the deferred map-placement on this surface, and the deferred admin override.
- [ ] 7.2 Add a manual-QA candidate row `outdoor-hike-owner-track-upload-manual-qa` in `openspec/backlog.md` (Manual QA Follow-ups table) covering: attach-existing happy path; upload new happy path; published-trip publication propagation; anonymous denial; non-owner denial; participant denial; trust-ineligible owner denial; quota-reached owner disabled feedback; dirty-close rejected by guard; slug conflict reflected in dialog; dialog stays open on server rejection; the existing `/my/tracks` and `/admin/tracks` flows remain unchanged after the upload-section extraction.
- [ ] 7.3 Append a section to `docs/outdoor-tracks-feature-research-2026-10-07.md` (or a new `docs/outdoor-trip-track-contribution-2026-10-09.md`) summarizing the shared upload section, the new server action, the capability helper, and the deferred detach/placement/admin candidates so future slices can ground themselves.