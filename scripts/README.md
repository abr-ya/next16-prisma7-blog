# scripts

Ad-hoc development helpers. These are **not** part of the build, the test
suite, or any production code path. Run them by hand when investigating
a real photo or track that misbehaves on a public page.

## `check-locale-placeholders.ts`

Scans locale JSON files for unsupported single-brace placeholders and checks
that the affected `trips` strings interpolate as expected in English and
Russian, with HTML escaping disabled as in next-i18next.

### Usage

```bash
npx tsx scripts/check-locale-placeholders.ts
```

### When to use it

- After editing locale strings that contain interpolation values.
- When a localized UI renders a placeholder such as `{title}` literally.

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

## `check-track-parse-capabilities.ts`

Exercises the pure parse-freshness rules: a parse without the capability
marker is outdated, a complete marker is fresh, a missing capability is
outdated, an unknown future capability is tolerated, failed/stale/missing
states are outdated, a file without timestamps is fresh once parsed, and only
an owned GPX track with its own file and no route may be updated.

### Usage

```bash
npx tsx scripts/check-track-parse-capabilities.ts
```

### When to use it

- After changing `TRACK_GPX_PARSER_CAPABILITIES`, a metadata creator, the
  read normalization, or the `canUpdateTrackParse` rule.
- When the **Update track data** button appears on a track that looks current,
  or stays hidden on a track that should offer it.

## `check-track-source-info.ts`

Exercises the GPX source extraction and labels: creator quoting and entities,
namespaced and plain device elements, empty and missing values, the
120-character cap, source details on a failed parse, the `sourceInfo`
capability, and the badge and legend precedence (device → app → `Manual route`
→ title).

### Usage

```bash
npx tsx scripts/check-track-source-info.ts
```

### When to use it

- After changing the creator or device extraction, the `sourceInfo` metadata
  shape, or the badge/legend label helpers.
- When a track page shows the wrong app or device, or a legend line falls back
  to the title unexpectedly.
