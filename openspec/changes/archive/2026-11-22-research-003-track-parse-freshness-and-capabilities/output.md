# Track Parse Freshness and Capabilities

## Executive Summary

Recommend an **additive parser-capability marker** in `gpxParse` plus **one owner-only "Update track data" action**. Do **not** bump `TRACK_GPX_METADATA_VERSION` for additive parser fields: the version currently gates the entire stored summary, so a bump would make every existing parse unreadable until each track is reparsed.

The marker should record **what the parser could produce** (a capability set), not what one file happened to contain. That distinction is what lets the product say "this parse is old" without falsely flagging a valid GPX that simply has no `<time>` elements. `parsedAt` stays as the audit timestamp.

Per-kilometre splits should be **computed and stored at parse time** rather than derived from the stored `timeline`: the timeline is capped at 400 points for photo inference, which is far too coarse for a split chart on a long run.

A public "parsing features" page is optional communication, not a mechanism. The owner-facing stale marker and update action are the required UX.

## Current Parse Contract

- `TRACK_GPX_METADATA_VERSION = "track-gpx-metadata/v1"` (`lib/track-gpx-metadata.ts:5`). `readTrackGpxMetadata` rejects any envelope whose `gpxParse.version` differs (`lib/track-gpx-metadata.ts:147`), which turns a version bump into "every stored summary disappears".
- The envelope stores `gpxParse` (`status`, `version`, `parsedAt`, source file id/key), `summary`, `mapGeometry`, and `timeline` (`lib/track-gpx-metadata.ts:53-66`).
- The parser writes distance, bounds, elevation, time, point counts, simplified map geometry, a compact timeline (`lib/track-gpx-parser.ts`), and since `feature-144` a moving duration inside `summary.time`.
- `timeline` is capped at `MAX_TIMELINE_POINTS = 400` (`lib/track-gpx-parser.ts:50`, `:431-436`) and is consumed by photo inference (`app/_data/hikes/internal.ts`, `app/_data/hikes/queries.ts`).
- `parseTrackGpx` (`app/_data/tracks.ts:1447`) is owner-gated, refuses a route-based track with no file, preserves the row's `timeSource` (`:1521`), and overwrites the mirrored `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` from the file (`:1522-1524`). A confirmed timezone wins over the file's offset.
- Freshness today is inferred from missing fields: the public page shows **Recalculate moving time** when `canRenameFile && timeSource === "GPX" && summary.time && movingDurationSeconds == null` (`app/(public)/tracks/[slug]/page.tsx:140`).
- The admin track row already shows `Parsed {date}` from `gpxParse.parsedAt` (`components/admin-pages/tracks-admin-panel.tsx:1092`).

## Surfaces and Freshness Assumptions

| Surface | Reads | Freshness assumption |
| --- | --- | --- |
| `/tracks/[slug]` | `summary`, `mapGeometry`, moving time, timeline (not public) | a missing moving value means an older parse |
| `/tracks` list | distance, points, time summary, moving column | none beyond field presence |
| `/my/workouts` | effective distance/duration/moving | none |
| Trip linked-track card | time, distance, parsed evidence | none |
| `/admin/tracks` | parsedAt, summary, file state | date is visible, but not what the parse produced |
| Photo inference | `timeline` of linked tracks | a missing timeline means no inference and suggests reparse |
| Pace/splits (candidate) | would need per-kilometre data | not available today |

The only place that handles "the parser changed" today is the moving-time button, and it is a per-feature special case.

## Options

### A. Bump the envelope version for each parser change

Fails compatibility: `readTrackGpxMetadata` would return `null` for every old parse, removing summaries, maps, and photo timelines until each track is reparsed. **Skip.**

### B. Additive `parserRevision` integer

Cheap and clear for "current or not", but it says nothing about *which* outputs exist. A surface that needs splits cannot tell whether a revision includes them without a hardcoded table, and a future capability would still require a code list. It also invites comparing numbers instead of capabilities. **Skip as the source of truth; usable as a diagnostic.**

### C. Additive capability set declared by the parser

`gpxParse.parserCapabilities: string[]` records what the **parser** can derive, not what the file yielded: for example `["summary", "mapGeometry", "timeline", "time", "movingTime"]` today, adding `"recordingApp"`, `"deviceName"`, `"stops"`, `"splits"` as they ship. A surface asks "does the stored capability set include what I need?", and an old parse without the field is treated as pre-capability. **Recommend.**

### D. Hybrid revision plus capabilities

Gives a readable diagnostic and the queryable set, at the cost of two concepts that can drift. Only worth it if telemetry or support needs a compact "parser build" number. **Optional later; not needed for the first slice.**

## Comparison Matrix

| Criterion | A: envelope bump | B: revision | C: capabilities | D: hybrid |
| --- | --- | --- | --- | --- |
| Stored-data compatibility | Breaks every old parse | Additive | Additive | Additive |
| Per-feature staleness | Coarse or none | Needs a hardcoded map | Direct | Direct |
| "Old parser" vs "file has no times" | Not distinguishable | Not distinguishable | Distinguishable | Distinguishable |
| Implementation cost | Low code, high data cost | Low | Low | Medium |
| Reader changes | Version check | One comparison | Set membership | Both |
| Verdict | Skip | Skip as source of truth | Recommend | Defer |

## Recommendation

1. Add `parserCapabilities` to the metadata envelope as an additive optional field; keep `TRACK_GPX_METADATA_VERSION = v1`.
2. Export one current-parser constant, e.g. `TRACK_GPX_PARSER_CAPABILITIES`, from `lib/track-gpx-metadata.ts`, and write it on every successful parse.
3. Read old rows as "no capability marker": they are outdated for any capability the current parser advertises. A reparse fills the marker and the fields in one pass.
4. Replace per-feature refresh buttons with one **Update track data** action whose condition is `!hasAllTrackParseCapabilities(storedCapabilities, requiredForThisSurface)`. Keep the moving-time button only as a migration bridge, or fold it into the general action in the same slice.
5. Keep `parsedAt` as the human audit timestamp; show it to the owner, and optionally in the admin row.
6. Never infer staleness from one missing field once capabilities exist; presence of the capability is the parser's promise, absence of the file data remains a normal "not recorded" state.

## Staleness Rules

| Stored state | UI |
| --- | --- |
| Capabilities include everything the surface needs | Not stale |
| Capabilities missing one the current parser advertises | Stale; offer **Update track data** |
| No `parserCapabilities` field (older than this slice) | Stale for every advertised capability; one update fixes it |
| Capability present, value absent because the file has no data (no `<time>`) | Not stale; show the existing "not recorded" state |
| Track is `MANUAL`, `NONE`, route-based, or has no own file | Never offer the action |

A file that genuinely lacks a timeline will remain without a timeline after the update; the marker records that the parser can produce one, which is still true.

## Reparse Safety

- Only a `GPX`-sourced, file-based track may be updated; the server keeps the existing guards from `parseTrackGpx`.
- `timeSource` is preserved by the parser; the action must not change it.
- For a GPX row the mirrored start and duration come from the file, so refreshing them is expected; a confirmed timezone continues to win over the file's offset.
- A `MANUAL` row must never be reparsed by this action: its stored start, duration, and timezone are owner data, and `parseTrackGpx` would overwrite the mirror even though it preserves the classification.
- A failed parse stores the failed state; the action reports the failure and does not claim that data was refreshed.

## Data Sufficiency for Splits

- `timeline` is capped at 400 points. A 10 km run at 1-second sampling has ~6,000 points, so the stored timeline is roughly 15× too sparse for per-kilometre accuracy; a marathon is far worse.
- Storing the full timed points would inflate every metadata row and is not needed for photo inference.
- Recommend computing **splits at parse time** from the full point list and storing a compact array (kilometre index, elapsed seconds, optional pace), capped by distance with an explicit partial marker. This becomes capability `"splits"`; the pace chart reads it, and old parses become stale for that surface.
- Stops follow the same rule: derive intervals at parse time and store them, not a denser timeline.

## Public Communication

A public "parsing features per version" page does not replace per-track freshness: a reader still needs to know whether *this* track was parsed with the current parser. It is useful as a short changelog explaining why an owner sees **Update track data** and what it adds.

Recommendation: keep the mechanism owner-facing; if the product wants a page, make it a small localized docs entry (for example a "Track data" section under About/Docs) with one line per capability and its release date. File it as a separate docs candidate rather than blocking the parser marker.

## Compatibility and Migration Policy

- Envelope version changes only for breaking shape or meaning changes; additive fields stay on `v1`.
- Readers ignore unknown fields; new fields are optional in types and normalized in `readTrackGpxMetadata`.
- A parser change that changes the *meaning* of an existing value (for example a different distance or moving-time algorithm) still needs an explicit decision: a new capability alone does not tell a reader that old values are incompatible.
- No automatic backfill. The owner updates a track when they care about the newer data.

## Follow-up Slices

1. **Parse capabilities and general update action** — add the marker, the current capability constant, a `isTrackParseOutdated` helper, and one owner-only **Update track data** control; write the marker on every parse; retire or fold the moving-time button. Depends on nothing.
2. **Device metadata extraction** — add `recordingApp` / `deviceName`, extend the capability set, show the badge, and rely on slice 1 for the update UX. Depends on 1 for the refresh path, though extraction could land first with a temporary button.
3. **Track stops** — store stop intervals, capability `"stops"`, markers/list. Depends on 1.
4. **Pace/splits chart** — compute and store splits, capability `"splits"`, chart and fallback. Depends on 1; independent of stops.
5. **Optional public parsing changelog** — docs page, localized later. Independent.

## Risks and Open Questions

- **Capability semantics.** The set must mean "the parser can produce this", not "this file produced it"; the difference is the core of the recommendation and must be documented in the type.
- **First update wave.** Every pre-marker track will look stale once. That is correct but will show the action broadly; the owner can ignore it.
- **Manual rows.** The general action must exclude `MANUAL`/`NONE` rows; this is the sharpest safety rule.
- **Unknown parser fields.** Future parsers may add capabilities the current UI does not know; the UI ignores unknown names, and the set stays additive.
- **Splits size.** The cap and the partial marker need a concrete number (for example 200 splits) before implementation.
- **Device data quality.** Vendor extensions differ; the device slice must define the extension map and the fallback to `creator`.

## Evidence

- `lib/track-gpx-metadata.ts`: version constant, metadata types, `readTrackGpxMetadata` version gate, `getTrackGpxMetadataState`.
- `lib/track-gpx-parser.ts`: `parseTrackGpxMetadata`, `computeTime`, `computeMovingDurationSeconds`, `MAX_TIMELINE_POINTS` and `buildTimeline`.
- `app/_data/tracks.ts`: `parseTrackGpx`, `timeSource` preservation, mirrored recording columns, moving-time fields.
- `app/_data/hikes/internal.ts`, `app/_data/hikes/queries.ts`: timeline consumers for photo inference.
- `app/(public)/tracks/[slug]/page.tsx`: current moving-time refresh condition.
- `components/admin-pages/tracks-admin-panel.tsx`: parsed-at display.
- `openspec/backlog.md`: moving-time, device-metadata, stops, and pace/splits candidates.
