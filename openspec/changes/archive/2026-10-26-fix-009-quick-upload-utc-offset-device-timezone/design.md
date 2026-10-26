# Design

## The rule

A GPX `<time>` value names a wall-clock in one of three ways:

| The file's timestamp | What survives it | The quick upload stores |
| --- | --- | --- |
| `2026-10-26T08:30:00+03:00` | the local wall-clock — `08:30` in Moscow | the offset `+03:00` |
| `2026-10-26T05:30:00Z` (or `+00:00`) | the instant only — `05:30Z`, no clock | the device's timezone |
| `2026-10-26T08:30:00` (naive) | the clock — `08:30` — but no zone | the device's timezone |

The second row is what this change fixes. A `Z` timestamp is a normalized instant: it pins the moment and drops the clock the owner actually lived in. The recording timezone exists to restore that clock, so a file that names only UTC names no *local* zone — and the device's zone is then the only reference there is, exactly as it already is for a naive file.

The distinction the rule draws is "does the file name a **local** offset?" — not "does the file name an offset?".

## Where the rule lives

One helper carries the distinction, and both sides of the upload ask it the same question.

**`lib/track-recording-timezone.ts` — `toLocalRecordingOffsetMinutes(minutes)`** returns the offset when it is non-zero, and `null` when the file names no local offset (naive, or UTC). `resolveQuickWorkoutRecordingTimezone(offset, deviceTimezone)` then resolves in this order:

1. A local offset → that offset, canonicalised (`+03:00`).
2. The device's timezone, validated the way every recording timezone is validated.
3. Nothing usable on the device → the file's own UTC (`UTC`) if the file was written in UTC, and no confirmed timezone at all if the file was naive.

Step 3 is what keeps a `Z` file honest when the device names a zone the system does not support: the file did say UTC, so the track keeps `UTC` rather than falling back to "unconfirmed". A naive file with an unusable device zone still leaves the track unconfirmed, as before.

**`components/track-pages/quick-workout-upload-dialog.tsx`** asks the same helper for the preview zone, the daypart and the slug. For a file with a local offset nothing moves; for a file with none, the preview renders the recording start in the device's zone and the daypart and the slug read the device's own clock. Without this the dialog would preview the `Z` file in UTC and then store the device's zone — the owner would see one time and get another.

## Why the re-parse path does not change

`parseTrackGpx` re-parses a file from the track form, where no device zone is available. It keeps taking the file's own offset (`UTC` for a `Z` file) when the track has no confirmed timezone of its own. A quick-uploaded track already carries a confirmed timezone, so a later re-parse leaves it alone — the two paths cannot disagree about the same track.

## The naive-timestamp instant is a separate defect

A naive `<time>` has no zone, so `new Date(value)` reads it in the runtime's own zone. A server in UTC and a browser in `Europe/Sofia` therefore read the same naive file as two different instants — the stored instant is off by the device's offset whenever the server's zone differs from the uploader's. That is not this change: fixing it means interpreting naive wall-clock values in a named zone on the server (a zone-aware wall-clock→instant conversion with a DST pass of its own), which reaches into the shared parser and every caller of it. It is filed as its own candidate.

## Edge cases

| The file | The device | The stored timezone |
| --- | --- | --- |
| `+03:00` | anything | `+03:00` |
| `Z` / `+00:00` | `Europe/Sofia` | `Europe/Sofia` |
| `Z` / `+00:00` | an unsupported zone | `UTC` (the file's own) |
| naive | `Europe/Sofia` | `Europe/Sofia` |
| naive | an unsupported zone | none — the track reads "UTC (unconfirmed)" |

The owner can correct any of these in the track form afterwards; the value stays editable.

## Data and migration impact

None. `Track.recordingTimezone` already holds a canonical zone string, and the IANA name the device reports is stored the same way a manually chosen zone is. No schema change, no migration, no new entity.
