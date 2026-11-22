# Proposal

## Why

A stored GPX parse does not record what the parser that produced it could see. The product infers staleness from one missing field, so every new derived value (device, stops, splits) needs another bespoke refresh button and another guess about whether an old track should be updated.

`research-003` recommended an additive capability marker plus one owner-facing update action. This slice implements exactly that, without adding any new parsed data.

## What Changes

- Add an optional `gpxParse.parserCapabilities` list to the metadata envelope, written by both a successful and a failed parse. The list is what the parser can produce — `summary`, `mapGeometry`, `timeline`, `time`, `movingTime` today — not what a particular file contained. `TRACK_GPX_METADATA_VERSION` stays `v1`.
- Normalize the list in `readTrackGpxMetadata`: an array of strings is kept, anything else reads as absent, and unknown future names are tolerated.
- Add pure freshness helpers: missing capabilities for the current parser, whether a stored parse is outdated, and whether a track may be updated at all.
- Add one owner-only **Update track data** action for a `GPX`-sourced track with its own active file and no route primary. It reuses `parseTrackGpx`, preserves `timeSource` and a confirmed timezone, refuses `MANUAL`/`NONE` and route-based tracks, and reports a failed parse as a failure. A missing, failed, or stale parse shows the action in a dedicated status row, because those states have no parsed payload to sit beside.
- Replace the per-feature **Recalculate moving time** control on `/tracks/[slug]` with the general action, driven by two new detail-payload flags.
- No schema change and no migration; no new parse fields.

## Non-goals

- Device/app extraction, stops, or splits; they add capabilities in later slices.
- Public parsing documentation; that is `public-track-data-guide`.
- Automatic backfill of stored parses.
- Changing `TRACK_GPX_METADATA_VERSION`, the timeline cap, or the moving-time algorithm.
- Admin-side parsing controls beyond the existing parsed-at display.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `outdoor-tracks`: a stored parse declares its parser capabilities, and the owner updates an outdated parse through one action that replaces the per-feature moving-time button.

## Impact

- `lib/track-gpx-metadata.ts` — the capability type, the current-parser constant, the written field, read normalization, and freshness helpers.
- `lib/track-gpx-parser.ts` informs the constant but does not change its output.
- `app/_data/tracks.ts` — the update action, its guards, and the detail-payload flags.
- `app/(public)/tracks/[slug]/page.tsx` and a small client button — the general update control replacing the moving-time button.
- `scripts/check-track-parse-capabilities.ts` — the pure cases.
- No schema, migration, API, or dependency changes.
