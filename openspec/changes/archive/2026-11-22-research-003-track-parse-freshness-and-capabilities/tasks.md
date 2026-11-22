# Tasks

## 1. Current contract

- [x] 1.1 Record `TRACK_GPX_METADATA_VERSION`, the metadata types, and `readTrackGpxMetadata` validation; state which parts are gated by the version and which are additive.
- [x] 1.2 Record the parser outputs (`summary`, `mapGeometry`, `timeline`, moving time) and the 400-point timeline cap with the function that applies it.
- [x] 1.3 Record `parseTrackGpx` behavior: ownership, route-based refusal, `timeSource` preservation, mirrored recording start/duration overwrite, and timezone precedence.

## 2. Surface inventory

- [x] 2.1 List every read surface that shows parse-derived data and what it assumes about the stored parse (public detail/list, owner tables, trip card, admin row, photos/timeline consumers, moving-time column).
- [x] 2.2 List every current refresh or reparse control and the condition that reveals it.

## 3. Options

- [x] 3.1 Evaluate an envelope version bump and state why it is or is not compatible with stored data.
- [x] 3.2 Evaluate an additive `parserRevision` and its expressiveness for per-feature staleness.
- [x] 3.3 Evaluate an additive capability list that records what the parser could produce, including how it distinguishes "older parser" from "file has no times".
- [x] 3.4 Evaluate a hybrid and any cheaper alternative; fill the comparison matrix with a verdict per option.

## 4. Recommendation

- [x] 4.1 Pick the marker, define the staleness rule per capability, and define a single reparse rule that does not overwrite owner-confirmed manual values.
- [x] 4.2 Decide whether splits are computed at parse time or derived from the stored timeline, with the size and precision argument.
- [x] 4.3 Evaluate the public parsing-features page against the owner-only alternative and recommend one.

## 5. Output

- [x] 5.1 Write `output.md` with every section required by `design.md`, each claim citing its evidence.
- [x] 5.2 Write the ordered follow-up slices with dependencies and state whether device metadata, stops, and pace can proceed before the marker.
- [x] 5.3 Run `npx openspec validate research-003-track-parse-freshness-and-capabilities --strict`.
