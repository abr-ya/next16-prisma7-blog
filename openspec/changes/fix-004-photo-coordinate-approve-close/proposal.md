# Proposal

## Why

The owner-or-admin "Review coordinate" dialog on a linked hike photo (`HikePhotoCoordinateReview` in [components/hike-pages/hike-photo-coordinate-review.tsx](../../components/hike-pages/hike-photo-coordinate-review.tsx)) exposes three actions that all signal completion with the same `onChanged` callback: automatic **Approve**, manual **Save manual correction**, plus the supporting **Confirm timezone** and **Reject map coordinate** actions.

The dialog is opened from the photo viewer in [components/hike-pages/hike-photo-gallery.tsx](../../components/hike-pages/hike-photo-gallery.tsx). Today, every successful action triggers only `router.refresh()` — the dialog stays open with the same `coordinatePhoto.detail`, even though the photo now has an accepted coordinate and the user's intent ("approve this coordinate") is fully satisfied. Reviewers have to dismiss the dialog by hand. On failure the existing `try/catch` already toasts and skips `onChanged`, so the dialog stays open correctly — only the success path is wrong.

The behavior contract described in the existing hike photo coordinate review spec (see feature-074) is "after a successful automatic approve or manual correction, the trip data is refreshed and the dialog closes". The codebase is missing the closing half of that contract.

## What Changes

- Make the `onChanged` callback typed so the child can signal which kind of change just happened:
  - `"approved"` — an automatic Approve or a manual Save manual correction succeeded.
  - `"refresh"` — Confirm timezone or Reject map coordinate succeeded; the dialog stays open so the reviewer can keep working.
- Update the parent `HikePhotoGallery` to consume the reason: on `"approved"`, refresh the route and call `setCoordinatePhotoId(null)` to close the dialog; on `"refresh"`, only refresh.
- Preserve the existing error path: the server-action `try/catch` blocks in `HikePhotoCoordinateReview` still toast the failure and skip `onChanged`, which leaves the dialog open. No new error UI is needed.

### Non-goals

- No server actions change (`acceptHikePhotoTrackTimeMatchCandidate`, `confirmHikePhotoCaptureTimezone`, `rejectHikePhotoMapCoordinate` stay untouched).
- No Prisma schema change, no migration, no new models.
- No change to the Reject flow's UX — rejection still keeps the dialog open so a reviewer can immediately add a manual correction.
- No change to the Confirm timezone flow's UX — confirming a timezone still keeps the dialog open so candidates can re-render and be approved afterwards.
- No new dialog state, no new primitives, no design changes.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

None. The behavior already required by the hike-photo-coordinate-review capability ("refresh + close on approved; refresh-only on supporting actions; preserve dialog on error") is implemented as the missing half of an already-shipped contract. No `requirements.md` change is required.

## Impact

- Affected code (read-mostly):
  - `components/hike-pages/hike-photo-coordinate-review.tsx` — change the `onChanged` prop type from `() => void` to `(reason: "approved" | "refresh") => void`; pass the matching reason from `approve`, the manual correction form `submit`, `confirmTimezone`, and `reject`.
  - `components/hike-pages/hike-photo-gallery.tsx` — update the inline `onChanged` handler so that `"approved"` also calls `setCoordinatePhotoId(null)`.
- Affected routes: `/trips/[slug]` only (the hike-photo gallery mounts the coordinate review dialog). Other dialogs in the gallery (photo viewer, EXIF, comments) are unaffected.
- Affected data: read-only. No Prisma schema change, no migration, no new models, no new indexes.
- No new dependencies, no env changes, no auth changes.
- Validation: `npm run tsc`, targeted ESLint for the two changed files, `npm run build`.
- Manual smoke: open a published trip with a linked photo that has at least one coordinate candidate, click the photo's "GPX coordinates" action, click Approve (or Save manual correction), and confirm the dialog closes while the trip map refreshes. Then re-open it, click Reject, and confirm the dialog stays open. Then re-open it, click Confirm timezone (if applicable) and confirm the dialog stays open.
- Backlog bookkeeping: on completion, append a `fix-004 | fix-004-photo-coordinate-approve-close | outdoor/maps-photos | ...` row to the Fix History table in `openspec/feature-history.md` and remove the `outdoor-photo-coordinate-approve-close-dialog` candidate row from the P1 Soon table in `openspec/backlog.md`.