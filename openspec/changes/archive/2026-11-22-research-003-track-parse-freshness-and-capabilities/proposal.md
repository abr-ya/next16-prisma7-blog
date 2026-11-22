# Research Proposal

## Why

GPX parsing has grown past its first shape: elapsed time, map geometry, a compact timeline, mirrored recording columns, moving time, and the upcoming device/app extraction and stops. A stored parse does not record what the parser that produced it could see, so the product can only infer staleness from a missing field — `movingDurationSeconds` absent means "probably older", but absence can also mean "the file had no timed points". Every new derived field risks another bespoke refresh button, and the pace/splits work will need to know whether the stored timeline is dense enough or whether splits must be computed at parse time.

## Research Question

How should a stored GPX parse declare what it was produced with, and how should the owner see and fix an outdated parse, without bumping the metadata envelope for every additive field?

Concretely:

1. **Envelope version vs parser revision vs capabilities.** `TRACK_GPX_METADATA_VERSION` currently gates the whole shape: a bump invalidates every existing summary. Is an additive `parserRevision` enough, or does the product need a parser capability list, or both?
2. **Staleness semantics.** How does a surface tell "the parser was older" from "the file simply has no times"? What does a general "Update track data" action compare?
3. **Reparse safety.** `parseTrackGpx` currently overwrites the mirrored recording start, duration, and timezone from the file while preserving `timeSource`; a general update must not silently overwrite owner-confirmed manual values.
4. **Data sufficiency.** The stored `timeline` is capped at 400 points. Are per-kilometre splits computable from it, or must splits be produced at parse time, and what does that cost in metadata size?
5. **Communication.** Is a public "parsing features" page worth building, or is an owner-only "parsed at / update available" surface enough?

## Scope

- The metadata envelope, its versioning, and the additive fields it already carries.
- The parser's outputs: summary, map geometry, timeline, moving time, mirrored columns, and the planned device/app and stop data.
- The owner reparse path (`parseTrackGpx`), its side effects, and the existing one-off refresh buttons.
- The pace/splits candidate's data needs and the 400-point timeline cap.
- Public versus owner-only communication of parsing versions.

## Non-Goals

- Implementing any marker, action, or UI.
- Backfilling stored parses automatically.
- Changing the moving-time algorithm.
- Designing the pace chart itself.
- Deciding the device extraction details; that is the device-metadata slice.

## Capabilities

None — investigation only. `skip_specs: true` is set in the change.

## Impact

- `openspec/research-backlog.md` and this change's `output.md` only.
- The recommendation names the follow-up slices and whether the device, stops, and pace work can proceed before or after the marker.
