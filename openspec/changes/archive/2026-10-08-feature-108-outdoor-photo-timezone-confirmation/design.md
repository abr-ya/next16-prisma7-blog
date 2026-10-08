# Design

## Context

`getReliablePhotoCaptureInstant` in `app/_data/hikes/internal.ts` returns the photo's UTC capture instant only when the EXIF data already contains one (`UTC_OR_OFFSET` evidence, `instantUtc` from GPS, or a persisted `captureTimeNormalization`). For camera-local times without an EXIF timezone, the helper returns `null` and the gallery renders the "Capture date unavailable" badge.

Meanwhile, the matching pipeline in `toTrackTimeMatchPhotoInput` (same file) already runs a `TRACK_DEFAULT` fallback: when `captureTimeTimezoneEvidence === "MISSING"` and the photo has a single linked track with a known IANA timezone, it derives the UTC instant from `localWallTime` + that timezone. The two helpers disagree about whether the system "knows" the capture time.

Recovery from the bad state is possible today via the existing `confirmHikePhotoCaptureTimezone` mutation, but it is reachable only through the "GPX coordinates" dialog (whose title and purpose are about coordinates, not time). The user has no signal on the card that points there.

## Goals / Non-Goals

**Goals:**

- Make the common case (single-track, `MISSING` EXIF timezone) auto-resolve without UI action, with a derived `captureInstant` that places the photo correctly in chronological order.
- Provide a discoverable, focused timezone dialog for the cases the fallback cannot resolve, plus a paired `Reset` action for undoing a wrong confirmation.
- Preserve the existing confirm action, coordinate-review surface, and EXIF dialogs. The new affordance is additive, not a replacement.

**Non-Goals:**

- No MakerNote timezone extraction (lives in `outdoor-photo-exif-gps-fixture-coverage`).
- No manual capture date entry (lives in `outdoor-photo-manual-capture-date`).
- No changes to the matching/coordinate-review pipeline, the `INFERRED_TRACK_TIME` coordinate semantics, or the `canReviewCoordinate` / `canRefreshExif` access matrix.
- No rename of the "GPX coordinates" dialog, no relocation of EXIF/Refresh controls.
- No new public capabilities or new permission classes.

## Decisions

### Apply `TRACK_DEFAULT` fallback in `toPublicHike`, view-time only

Extend the only call site of `getReliablePhotoCaptureInstant` (in `toPublicHike`, `app/_data/hikes/internal.ts`) to compute the derived instant from the same TRACK_DEFAULT rule the matching pipeline uses, when `captureTimeTimezoneEvidence === "MISSING"`, `localWallTime` is present, and `linkedTrackTimezones.length === 1`. The derivation is not persisted; it is recomputed on every render. This keeps the helper's signature stable and the fallback scope local to the public projection.

The fallback uses the existing `derivePhotoCaptureInstantUtc({ localWallTime, timeZone })` helper. If the derivation produces a non-finite instant, the helper still returns `null` and the badge shows as before.

### Single-track condition is the conservative cutoff

The fallback fires only when exactly one linked track has a known IANA timezone. Multi-track, no-track, or a track with a missing/empty timezone leaves the helper at `null` and the user sees the badge, where the new 3rd button lets them resolve it explicitly. The single-track cutoff is also what the existing `captureTimeAssumption` and `timezoneConfirmationRequired` projections use, so the gallery and the photo-detail/coord-review surfaces stay consistent.

### New mutation mirrors the existing confirm action

`clearHikePhotoCaptureTimezone({ hikeId, photoId })` shares the access guard (`canReviewCoordinate`) and the `INFERRED_TRACK_TIME` → `PENDING_REVIEW` coordinate reset with `confirmHikePhotoCaptureTimezone` (see `app/_data/hikes/mutations.ts:112-121`). It refuses to no-op when no normalization is present, so the dialog can disable the Reset button deterministically. The data-side helper `withoutPhotoCaptureTimeNormalization` (new, parallel to `withPhotoCaptureTimeNormalization` in `lib/photo-exif-metadata.ts`) sets `summary.captureTimeNormalization = null` so the existing schema validator stays green.

### A third card-level button, only when needed

The new control renders as a `<Clock>` icon button beside the existing `<FileSearch>` (EXIF) and `<Route>` (GPX coordinates) buttons on each photo card. Visibility is `canReviewCoordinate && (captureTimeAssumption || timezoneConfirmationRequired)` — i.e. exactly when the data layer has something to ask the user about. When timezone is already settled (UTC/offset, GPS_UTC, or a confirmed normalization), the button is hidden and the card stays clean.

The button opens a focused dialog with a read-only summary of the current state (camera-local time, capture source, linked track timezone if any), an `IANA timezone` input pre-filled from the single track timezone or the current normalization, a `Confirm timezone` action, and a `Reset` action that is disabled when no normalization is present.

### Localize only the new affordance

New keys land in the existing `trips` namespace. The shared `HikeFormDialog`, `confirmHikePhotoCaptureTimezone` user-visible strings, and the EXIF/coord-review dialogs keep their current English copy.

## Known Limitations

The TRACK_DEFAULT fallback assumes the camera was set to the linked track's timezone. When `linkedTrackTimezones.length === 1`, the badge "Capture date unavailable" is replaced with a derived `captureInstant` built from that timezone. If the photo was actually shot in a different timezone (for example, the camera stayed on a home timezone while the trip was in another zone), the photo will get a confidently wrong date and no automatic detection of that mismatch. The card-level 3rd button remains the manual override path; users on multi-timezone trips, or those who travel with the camera left on a home timezone, should confirm via that dialog or enable the camera's own timezone setting so the EXIF offset is written directly.

This limitation is the same one that already applies to `INFERRED_TRACK_TIME` coordinate candidates — the matching pipeline makes the same assumption when proposing map coordinates. Documenting it here so future reviewers do not re-litigate the tradeoff.

## Risks / Trade-offs

- [A wrong default now produces a confidently wrong `captureInstant` instead of an undated photo] → The badge remains for multi-track and no-track cases; the single-track fallback is opt-out via the new dialog's Reset path. Documented above.
- [A 3rd icon button crowds the card] → Visibility is conditional; the existing EXIF/Route buttons are already conditional on `canReviewCoordinate`, so the card is not always at maximum density.
- [Adding a new mutation widens the access matrix] → Uses the same `getPhotoDetailAccess` + `canReviewCoordinate` guard as the existing confirm action; no new permission class.

## Migration Plan

1. Deploy with no migration; the schema, `Photo.metadata` shape, and `getPhotoDetailAccess` are unchanged.
2. Existing public trip pages and admin surfaces continue to work; the new behavior is strictly additive for the public gallery and the new owner/admin/participant dialog.
3. Roll back by reverting the `getReliablePhotoCaptureInstant` call site and removing the new component; no stored data requires reversal.
