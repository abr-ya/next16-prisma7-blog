# scripts

Ad-hoc development helpers. These are **not** part of the build, the test
suite, or any production code path. Run them by hand when investigating
a real photo or track that misbehaves on a public page.

## `dump-exif.mjs`

A one-off EXIF inspector for ad-hoc photo debugging. Reads the same
EXIF + GPS tags the production `exifr` parser sees, then prints the
fields that matter for time and timezone reasoning:

- `Make`, `Model` — camera identity
- `DateTimeOriginal` — camera-local capture time as written by the camera
- `OffsetTime`, `OffsetTimeOriginal`, `OffsetTimeDigitized` — EXIF
  timezone offsets, if the camera wrote them
- `GPSDateStamp`, `GPSTimeStamp` — GPS-receiver UTC, if present
- `latitude`, `longitude`, `GPSAltitude` — GPS position

### Usage

```bash
node scripts/dump-exif.mjs "/absolute/path/to/photo.jpg"
```

The output is a single JSON object. `null` for any field means the
EXIF tag was absent, exactly as the production parser would see it.

### When to use it

- A photo on a published trip shows the "capture date unavailable"
  badge and you want to confirm whether the EXIF really lacks a
  timezone offset (vs. a parser regression).
- A linked trip track is recorded in a different timezone than the
  photo and you want to see what the camera actually wrote.
- A photo with EXIF GPS shows no map marker and you want to verify
  GPSDateStamp/GPSTimeStamp are really missing or malformed.

### When **not** to use it

- For fixture-backed parser coverage — that's the job of
  `check-photo-exif-capture-summary.ts` and the future
  `outdoor-photo-exif-gps-fixture-coverage` candidate.
- For trip photo ordering or timezone normalization reasoning — that
  flows through `lib/photo-capture-timezone.ts` and the data layer,
  not raw EXIF.
- As a substitute for the actual public page; the production
  pipeline goes through Prisma + `getPhotoExifMetadataState` and may
  differ from a raw `exifr` parse in edge cases.
