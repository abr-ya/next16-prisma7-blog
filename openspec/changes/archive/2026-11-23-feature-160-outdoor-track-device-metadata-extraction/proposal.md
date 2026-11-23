# Proposal

## Why

A GPX file names the app that wrote it in `<gpx creator>`, and some vendor exports carry a device name in their extensions. The product shows neither, so a workout page cannot tell a Garmin recording from an OsmAnd export, and a multi-line map legend labels every line with the same track title.

This slice extracts the source during parsing, shows it as a badge, and uses it to label the map legend. It builds on `feature-158`: the capability marker and the general **Update track data** action already give older parses a recovery path.

## What Changes

- Parse `recordingApp` from the `<gpx creator>` attribute and `deviceName` from explicit vendor extension elements (`device` / `deviceName`, with or without a namespace prefix). Store both in a new optional `sourceInfo` object, always present on a fresh parse even when both values are null.
- Add the `sourceInfo` capability to `TRACK_GPX_PARSER_CAPABILITIES`; keep `TRACK_GPX_METADATA_VERSION` at `v1`, so older parses stay readable and simply become outdated.
- Show a source badge on `/tracks/[slug]` when a device or app is known (`deviceName` first, then `recordingApp`); a manual workout keeps its existing `Source: Manual` badge and gets no duplicate source badge.
- Label map legend items when more than one line is shown: `deviceName` → `recordingApp` → `Manual route` for a manual or route-based primary → the existing title as the final fallback. Secondary lines use their own source, falling back to `Original recording`.
- No schema change and no migration.

## Non-goals

- Guessing a physical device from an unknown `creator` string; only explicit device extensions count.
- TCX/FIT parsing or vendor-specific files beyond the GPX element names above.
- A source badge on the public `/tracks` list card or on trip cards.
- Changing map colours, line styles, or legend visibility rules.
- Automatic backfill; older parses use **Update track data**.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: a parsed GPX records its app and device, the detail page shows a source badge, and the map legend labels each line by source.

## Impact

- `lib/track-gpx-parser.ts` — creator and device extraction, passed into both metadata creators.
- `lib/track-gpx-metadata.ts` — `sourceInfo` type, normalization, the `sourceInfo` capability, and the badge/legend label helpers.
- `lib/track-gpx-metadata.ts` map view model and `app/_data/tracks.ts` public projection — the legend label per line and the `sourceInfo` payload.
- `components/track-pages/track-map-leaflet.tsx` — the legend reads the label.
- `app/(public)/tracks/[slug]/page.tsx` — the source badge.
- `scripts/check-track-source-info.ts` — parser cases.
- No schema, migration, API, or dependency changes.
