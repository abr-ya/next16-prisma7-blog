# Tasks

## 1. Metadata

- [x] 1.1 Add `TRACK_GPX_PARSER_CAPABILITIES` and `TrackGpxParseCapability` to `lib/track-gpx-metadata.ts`; keep `TRACK_GPX_METADATA_VERSION` at `v1`.
- [x] 1.2 Add `parserCapabilities?: string[]` to the `gpxParse` type and write it in both metadata creators.
- [x] 1.3 Normalize the field in `readTrackGpxMetadata`: a string array is kept, anything else is absent, unknown names survive. Confirm `markTrackGpxMetadataStale` preserves the list through its `gpxParse` spread.

## 2. Freshness helpers

- [x] 2.1 Add `getMissingTrackParseCapabilities`, `isTrackParseOutdated`, and `canUpdateTrackParse({ timeSource, routeId, hasOwnActiveTrackGpxFile })` with the rules from the design (missing, failed, **stale**, old marker, capability-present-but-no-file-data, own-file/no-route exclusions).
- [x] 2.2 Keep the helpers pure and document that capabilities describe the parser, not the file.

## 3. Action and payload

- [x] 3.1 Add `updateTrackParse(trackId)` to `app/_data/tracks.ts`: owner scope, then the **same** `canUpdateTrackParse` helper with `GPX`, `routeId === null`, and the row's own active `TRACK_GPX` file (not the resolved route file), then reuse `parseTrackGpx`.
- [x] 3.2 Inspect the returned metadata: a `FAILED` `gpxParse.status` or a missing result returns `{ ok: false }`, because `parseTrackGpx` persists a failed envelope without throwing.
- [x] 3.3 Add `parseStatus`, `canUpdateParse`, and `isParseOutdated` to `PublicTrack`, computed from the resolved parse state and the row's own-file condition; keep the raw capabilities server-side.

## 4. UI

- [x] 4.1 Add `TrackParseUpdateButton` and replace `TrackMovingTimeRecalcButton` on `/tracks/[slug]`.
- [x] 4.2 Show it only when `canUpdateParse && isParseOutdated`. For a `SUCCESS` parse with a timed summary, place it next to the `Total` / `Moving` line; for `MISSING`/`FAILED`/`STALE`, add a dedicated status row under the header (`No parse yet` / `Parsing failed` / `Track data is outdated`) with the action, since `parsed` is null there.
- [x] 4.3 Confirm a fresh parse with no timestamps — or with a single timestamp and no moving value — shows no action, and a manual or route-based workout never shows it.

## 5. Verification

- [x] 5.1 Add `scripts/check-track-parse-capabilities.ts` with the cases from the design.
- [x] 5.2 Run `npm run tsc`.
- [x] 5.3 Run `npm run lint` and targeted `npx eslint` for the touched `lib`, `app`, and `components` files.
- [x] 5.4 Run `npx tsx scripts/check-track-parse-capabilities.ts` and `npx openspec validate --changes --strict`.
- [x] 5.5 Run a production build in the sandbox, or ask the owner to run it locally.
- [x] 5.6 Add a `scripts/check-track-parse-capabilities.ts` section to `scripts/README.md` with usage and when-to-use notes.
- [x] 5.7 File the deferred browser checks as a manual QA candidate in `openspec/backlog.md`.
