# Design

## Capability Model

`lib/track-gpx-metadata.ts` gains:

```ts
export const TRACK_GPX_PARSER_CAPABILITIES = [
  "summary",
  "mapGeometry",
  "timeline",
  "time",
  "movingTime",
] as const;

export type TrackGpxParseCapability = (typeof TRACK_GPX_PARSER_CAPABILITIES)[number];
```

`TrackGpxMetadata.gpxParse` gains `parserCapabilities?: string[]`. The field is additive; the envelope version stays `v1`.

Both `createSuccessfulTrackGpxMetadata` and `createFailedTrackGpxMetadata` write `[...TRACK_GPX_PARSER_CAPABILITIES]`. Capabilities describe the parser, not the file: an unparseable file or a file without `<time>` still records the same list.

`readTrackGpxMetadata` normalizes the field: an array whose entries are all strings is kept as is; any other shape reads as absent. Unknown future names stay in the array so a newer writer is not corrupted, while the comparison below only consults known current names.

## Freshness Helpers

```ts
getMissingTrackParseCapabilities(stored?: string[] | null): string[]
isTrackParseOutdated(state: TrackGpxMetadataState): boolean
canUpdateTrackParse(track): boolean
```

Rules:

- A `MISSING` parse is outdated when the caller may update it; there is nothing stored to compare.
- A `FAILED` parse is outdated: the owner may retry.
- A `STALE` parse is outdated: the file was replaced, the previous summary was cleared, and the row cannot recover without a reparse.
- A `SUCCESS` parse is outdated when its capability list is absent or misses any current capability.
- A capability that is present but whose value is `null` (for example `time` on a file without `<time>`) is **not** outdated. The parser promised the capability; the file had no data.
- `canUpdateTrackParse({ timeSource, routeId, hasOwnActiveTrackGpxFile })` is true only when `timeSource === "GPX"`, `routeId === null`, and the track carries its **own** active `TRACK_GPX` file. The input deliberately uses the row's `fileAssetId`, not the resolved geometry's file: `toPublicTrack` resolves a route-primary track to the route's file, which is an active `TRACK_GPX` and would otherwise pass. `MANUAL`, `NONE`, route-based, and pending drafts are false.

The helpers are pure where possible and live in `lib/track-gpx-metadata.ts`; the payload-facing wrapper reads the resolved geometry's state.

## Server Action and Payload

`updateTrackParse(trackId)` in `app/_data/tracks.ts`:

1. Resolve the owner with `getRequiredUserId()`.
2. Load the row with `timeSource`, `routeId`, and its file asset (`id`, `purpose`, `status`).
3. Refuse by calling the same `canUpdateTrackParse` helper the payload uses, so the button and the server cannot drift.
4. Call the existing `parseTrackGpx(track.id)` and inspect the returned metadata: a `FAILED` `gpxParse.status` returns `{ ok: false, code, message }` even though the call itself did not throw, because `parseTrackGpx` persists a failed envelope instead of throwing on an unreadable file. A missing metadata result is also a failure.
5. `parseTrackGpx` keeps `timeSource`, lets a confirmed timezone win, and rewrites the mirrored recording columns from the file; the action does not add any of that logic.

`PublicTrack` gains two detail flags, computed in `toPublicTrack` from the resolved parse state:

- `canUpdateParse` — the owner of a `GPX`-sourced, file-based track;
- `isParseOutdated` — `canUpdateParse` and (missing parse, failed parse, or missing capabilities).

The raw capability list stays server-side; only the booleans reach the client.

## UI

The moving-time button (`components/track-pages/track-moving-time-recalc-button.tsx`) is replaced by `TrackParseUpdateButton`:

- rendered when `track.canUpdateParse && track.isParseOutdated`;
- calls `updateTrackParse`, disables while running, toasts success or the failure message, and refreshes the page;
- for a `SUCCESS` parse with a timed summary it sits next to the `Total` / `Moving` line;
- for `MISSING`, `FAILED`, or `STALE` the page has no `parsed` payload, so the button lives in a dedicated status row under the header: `No parse yet`, `Parsing failed`, or `Track data is outdated`, followed by the action. The row is rendered from the two flags, never from `parsed`, so a broken parse still has a visible way to recover.

Because moving time is one of the capabilities, an old parse whose moving value is missing now shows the general action, while a fresh parse with a file that has no timestamps shows no action.

## Risks

- **Broad first wave.** Every pre-marker track appears outdated once; that is correct and disappears after one update.
- **Manual rows.** The action refuses them; without that guard `parseTrackGpx` would overwrite owner-entered start and duration.
- **Capability semantics.** The list means "the parser can produce", not "this file produced"; the type documentation and the helper comments must say so.
- **Failed and stale parses.** Both write/keep the capability list and are offered for retry; success clears the outdated state. `markTrackGpxMetadataStale` spreads the normalized `gpxParse`, so the capability list survives the stale marker.
- **A fresh parse with no moving value.** A file with a single timed point yields a timed summary but no moving duration; the capability is present, so no action is shown. This is intentional and prevents an endless retry.
- **Unknown future names.** The reader keeps them, the helper ignores them, and the writer remains forward-compatible.
- **Payload surface.** Only two booleans are added, detail-only; the list payload stays lean because it passes no viewer id.
- **Route file confusion.** The payload helper must receive `routeId` and the row's own file, not the resolved geometry file, or a route-primary workout shows a button that the parser refuses.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx tsx scripts/check-track-parse-capabilities.ts`, `npx openspec validate --changes --strict`, and a production build. The script covers: no marker, complete marker, one missing capability, unknown extra capability, failed state, stale state, missing state, manual/route exclusions, and a file-without-time or single-timestamp parse that is not outdated. Browser checks are deferred to a manual QA candidate and create no data beyond updating an existing parse.
