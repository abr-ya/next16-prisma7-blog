# Proposal

## Why

Two small honesty problems sit on the same surfaces:

- a duration is stored to the second but displayed to the minute, so `1 h 28 min 30 s` reads `1 h 28 min` and a 45-second workout reads `0 min`;
- the public track header always says `Recording`, even for a manual or route-based workout whose start and duration were typed in, and the kind badge always says `GPX track` even when the primary geometry is a route.

Both mislead the reader about what the numbers are, so they are fixed together.

## What Changes

- `formatTrackDuration` shows seconds when the remainder is non-zero: `1 h 28 min 30 s`, `45 s`, `1 h 30 s`, while a whole minute stays `30 min` and zero stays `0 min`. One shared formatter, so the header, tables, cards, and previews agree.
- The public header label follows `timeSource`: `Logged` for a manual workout, `Recorded` for a GPX parse, `Time` for an unclassified row. The label is omitted when there is no time line at all, and the unknown sentence becomes `Time not recorded` so it does not read `Recorded · Recording time not recorded`.
- The track kind badge follows the geometry: `Route track` when the primary geometry is a route, `GPX track` otherwise, on both `/tracks/[slug]` and the `/tracks` list card.
- The trip linked-track card labels the same manual values `Start` and `Duration` instead of `Recording start` and `Recording duration`, in English and Russian.

## Non-goals

- Localizing the `h` / `min` / `s` units; they stay English like today.
- Renaming the admin form's input labels (`Recording start`, `Recording duration`) — those describe fields, not a displayed summary.
- Storing or parsing anything new; no schema change and no migration.
- Splitting time per kilometre or changing the moving-time rule.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: durations include seconds when present, header labels and kind badges follow the data, and the trip card labels manual values neutrally.

## Impact

- `lib/track-gpx-metadata.ts` — the duration formatter and the unknown recording-line text.
- `lib/track-effective-values.ts` — a label helper derived from `timeSource`.
- `app/(public)/tracks/[slug]/page.tsx`, `app/(public)/tracks/page.tsx` — the header label, the kind badge, and the list badge.
- `app/i18n/locales/en/trips.json`, `app/i18n/locales/ru/trips.json` — the two trip-card labels.
- `scripts/check-track-duration-format.ts` — the formatter cases.
- No schema, migration, API, or dependency changes.
