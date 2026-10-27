# Proposal

## Why

**A quick upload of a file written in UTC stores `UTC` instead of the device's timezone.** The owner uploaded a GPX through the one-click quick upload on `/my/workouts`, and the saved workout came back with the recording timezone `UTC` — while the file itself named no local zone.

The file's `<time>` values end in `Z`. That marker says the timestamp is an instant in UTC; it says nothing about the wall-clock the owner recorded in, which is the one thing the recording timezone exists to preserve. The reader turns `Z` into a zero offset, the zero offset becomes the stored zone `UTC`, and because the file "names an offset" the device's timezone is never consulted. A `Z` timestamp loses exactly the information a naive timestamp loses — the local clock — so the two have to land the same way.

The live requirement already promises the device's timezone "when the uploaded file names no UTC offset". A `Z` file names no *local* offset, so the promise is there; the rule that decided it read "offset" too literally.

## What Changes

- **A file that names no local offset takes the device's timezone.** A `Z`/`+00:00` timestamp is an instant, not a local wall-clock, so it now falls to the device's timezone exactly like a naive timestamp does.
- **The file's own local offset still wins.** A file written in Moscow (`+03:00`) keeps its own offset; nothing changes for it.
- **The preview, the suggested title and the slug follow the same rule.** For a file that names no local offset the dialog reads the recording's wall-clock in the device's own clock, so what the owner sees before saving is what gets stored.

### Non-goals

- **No change for a file with a local offset.** `+03:00` still wins over the device's zone, on the server and in the browser.
- **No change to the re-parse path.** A track re-parsed from the track form still takes the file's own offset (`UTC` for a `Z` file) when it has no confirmed timezone of its own — the track form has no device zone to fall back to.
- **No new field, no new entity, no migration.** The stored value is still `Track.recordingTimezone`, and it stays editable by the owner in the track form.
- **No change to the stored instants.** A `Z` timestamp is absolute already; only the zone it is presented in changes.
- **Not fixing the naive-timestamp instant.** A naive `<time>` is parsed by the runtime's own timezone, so a server in UTC and a browser in `Europe/Sofia` read the same file as two different instants. That is a separate defect and is filed as its own backlog candidate.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-quick-workout-upload` — a quick upload whose file names no local UTC offset takes the device's timezone.

## Impact

- **Schemas**: no Prisma migration, no database impact.
- **Routes**: none.
- **Public surfaces**: the quick upload dialog's preview, its suggested title and its slug; the recording timezone the quick upload stores.
- **Code**: `lib/track-recording-timezone.ts` (one new helper, one rule), `components/track-pages/quick-workout-upload-dialog.tsx` (the preview zone, the daypart, the slug), `scripts/check-quick-workout-timezone.ts` (the asserts).
- **Depends on**: `feature-123-outdoor-quick-workout-upload`, archived on 2026-10-26.
