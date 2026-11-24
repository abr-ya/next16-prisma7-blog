# Design

## Extraction

Two pure helpers in `lib/track-gpx-parser.ts`, fed the raw file content before any point parsing:

`readGpxCreator(content)`:

- matches the `creator` attribute of the `<gpx>` element, single or double quoted;
- decodes the five XML entities the project already escapes (`&amp;`, `&lt;`, `&gt;`, `&quot;`, `&apos;`);
- trims, drops an empty value, and caps the stored value at 120 characters;
- returns `null` when the attribute is absent.

`readGpxDeviceName(content)`:

- matches an element whose local name is `device` or `deviceName`, with an optional namespace prefix (`gpxx:DeviceName` included);
- takes the first non-empty text value, trims it, caps it at 120 characters;
- returns `null` when no such element exists.

The second helper is deliberately conservative: vendor extensions are not standardized, and inventing a device from an unknown `creator` (or from `<metadata><name>`) would be a guess. The parser records what the file explicitly says and leaves the rest empty. Collecting real vendor examples later can extend the allowlist without changing the envelope.

## Metadata

`TrackGpxSourceInfo = { recordingApp: string | null; deviceName: string | null }`.

`TrackGpxMetadata` gains `sourceInfo?: TrackGpxSourceInfo`. Both `createSuccessfulTrackGpxMetadata` and `createFailedTrackGpxMetadata` accept and write it; the parser passes the same object to either, so a failed parse still records the app that wrote the file.

`readTrackGpxMetadata` normalizes the field: an object with two string-or-null values is kept; anything else is absent. `TRACK_GPX_METADATA_VERSION` stays `v1`.

`TRACK_GPX_PARSER_CAPABILITIES` gains `"sourceInfo"`. A pre-slice parse therefore becomes outdated for the general **Update track data** action, and a reparse writes the capability and the object in one pass.

## Labels

Two pure helpers in `lib/track-gpx-metadata.ts`:

- `getTrackSourceBadgeLabel({ sourceInfo, timeSource })`: `deviceName` → `recordingApp` → `null`. A manual workout returns `null` because its existing `Source: Manual` badge already names the source; the badge is not duplicated.
- `getTrackLegendLabel({ sourceInfo, timeSource, isRoute })`: `deviceName` → `recordingApp` → `Manual route` when `timeSource === "MANUAL"` or `isRoute` → `null`; a null result lets the legend fall back to the title.

`TrackMapViewModel` gains `legendLabel?: string`. `toTrackMapViewModel` accepts an optional label; `toSecondaryTrackMapViewModel` computes the label from the secondary file's own `sourceInfo`, falling back to `Original recording`.

The legend (`track-map-leaflet.tsx`) renders `item.legendLabel ?? item.title`, so single-line maps and every caller without a label are unchanged.

## Public Payload and Badge

`PublicTrack` gains `sourceInfo: TrackGpxSourceInfo | null`, taken from the resolved parse metadata. The detail page renders a `Badge variant="outline"` with the badge label when it is non-null; the existing `Source: Manual` / `Source: GPX` badge stays as the time-source badge.

The primary map view model is built with the primary label (`isRoute` from `routeId`), and each secondary file's map model with its own label. The list payload remains without a source badge; the legend is detail-only because only the detail page passes `showLegend`.

## Risks

- **Creator is not a device.** Garmin Connect, StravaGPX, and OsmAnd are apps or export pipelines; the badge shows them honestly as an app and prefers an explicit device name when one exists.
- **Unknown vendor extensions.** A file may carry a device under a name outside the allowlist; the field stays null and the legend falls back instead of guessing.
- **Duplicate source badges.** A manual row keeps only `Source: Manual`; the new badge is skipped there.
- **Older parses.** They show no source and become outdated; **Update track data** fills both.
- **Legend noise.** Only multi-line maps show the legend, and labels fall back to the existing titles, so a single-line page is untouched.

## Verification

`npm run tsc`, `npm run lint`, targeted ESLint, `npx tsx scripts/check-track-source-info.ts`, `npx openspec validate --changes --strict`, and a production build. The script covers: a double-quoted creator, a single-quoted creator, XML entities, a namespaced `DeviceName`, a plain `device` element, no creator, empty values, and the 120-character cap. Browser checks are deferred to a manual QA candidate and create no data beyond updating an existing parse.
