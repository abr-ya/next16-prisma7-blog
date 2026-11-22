# Research Design

## Method

1. Read the current metadata contract and parser end to end: the version constant, the read-time validation, every field the parser writes, and the timeline cap.
2. Read the write and reparse paths: `parseTrackGpx`, the mirrored recording columns, `timeSource` preservation, timezone precedence, and every current refresh control.
3. Map each surface that consumes parse output and the freshness assumption it makes.
4. Enumerate the timing-derived features already shipped or queued (moving time, device/app, stops, pace/splits) and what each needs from the stored parse.
5. Compare versioning options on four criteria — compatibility, expressiveness, implementation cost, and failure modes — and pick one.
6. Produce an ordered slice plan where each slice names its dependency.

## Evidence standard

- Every claim about current behavior cites a file and the function or type that proves it.
- Every option gets a verdict on the comparison matrix; an option with no verdict counts as not investigated.
- The recommendation must state its conditions for invalidation, not only its benefits.

## Rubric

- **Recommend** — fits the criteria, explains the migration path, and names the slices.
- **Skip** — fails compatibility or cost, with the failing criterion named.
- **Needs more research** — evidence is insufficient; name the missing measurement.

## Required Output Structure

`output.md` must contain, in this order:

1. Executive summary.
2. Current parse contract and reparse behavior.
3. Surface inventory and freshness assumptions.
4. Options considered.
5. Comparison matrix.
6. Recommendation.
7. Staleness rules.
8. Reparse safety rules.
9. Data sufficiency for splits.
10. Public communication evaluation.
11. Compatibility and migration policy.
12. Ordered follow-up slices with dependencies.
13. Risks and open questions.
14. Evidence.
