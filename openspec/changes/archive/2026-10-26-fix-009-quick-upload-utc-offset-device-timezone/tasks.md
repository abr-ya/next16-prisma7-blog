# Tasks

## 1. The rule in the timezone library

- [x] Add `toLocalRecordingOffsetMinutes(minutes)` to `lib/track-recording-timezone.ts`: it returns the offset when it is non-zero and `null` when the file names no local offset (naive, or UTC).
- [x] Rewrite `resolveQuickWorkoutRecordingTimezone(offset, deviceTimezone)` in that order: a local offset wins; the device's timezone is the fallback; the file's own UTC stays when the device names nothing usable; a naive file with no device zone leaves the track unconfirmed.
- [x] Keep `toRecordingTimezoneFromUtcOffset` untouched — the re-parse path still stores the file's own offset, `UTC` included.

## 2. The dialog reads the same rule

- [x] In `components/track-pages/quick-workout-upload-dialog.tsx`, resolve the local offset with `toLocalRecordingOffsetMinutes` and pass it to `getQuickWorkoutDaypart` and `buildQuickWorkoutSlugBase`.
- [x] Resolve the preview zone the same way: the file's local offset when it names one, the device's zone otherwise.
- [x] Leave the save call as it is — the device timezone already travels with it.

## 3. The checks

- [x] Update `scripts/check-quick-workout-timezone.ts`: a `Z` file with a device zone resolves to the device's zone, a `Z` file without one keeps `UTC`, and `toLocalRecordingOffsetMinutes` is covered for `180`, `-270`, `0` and `null`.
- [x] `npx tsx scripts/check-quick-workout-timezone.ts` passes.
- [x] `npm run tsc` passes.
- [x] `npx eslint lib/track-recording-timezone.ts components/track-pages/quick-workout-upload-dialog.tsx scripts/check-quick-workout-timezone.ts --quiet` is clean — these files are outside `app/`, so the root lint script does not cover them.
- [x] `npm run lint` passes.
- [x] `openspec validate fix-009-quick-upload-utc-offset-device-timezone` passes.
- [x] `openspec validate --specs` passes after the sync.

## 4. Docs

- [x] `openspec/backlog.md`: add the `fix-009-quick-upload-utc-offset-device-timezone` row to the Fixes table.
- [x] `openspec/backlog.md`: add the naive-timestamp instant as its own candidate in the Fixes table.
- [x] `openspec/backlog.md`: extend the `outdoor-quick-workout-upload-manual-qa` candidate with the `Z`-file case.

## Not in this change

- The naive-timestamp instant, where the server's zone and the browser's zone read the same wall-clock differently — its own candidate in the backlog.
- The re-parse path in the track form, which has no device zone to fall back to.
- The stored instants themselves.
