## Context

See `proposal.md`. Feature-060 covers direct EXIF GPS markers only. Current track metadata stores recording `time.start` / `time.end` plus simplified `mapGeometry` points **without** per-point timestamps. Photo EXIF can store `summary.capturedAt` and optional GPS. Feature-058 already warned that time-range alone is not enough for true along-route interpolation.

## Goals / Non-Goals

**Goals:**

- Admin-only spike UI: button → modal candidates → accept → log only.
- Honest candidate types based on data we actually have now.
- Document gaps that block real interpolation until timeline retention exists.

**Non-Goals:**

- No DB writes for inferred coordinates.
- No public markers from inference.
- No final timezone product policy.
- No GPX parser redesign required to ship the spike UI, though the spike may inspect raw GPX offline/in admin experiments to learn.

## Decisions

### Keep this as a numbered spike after feature-060

Implement EXIF markers first (`feature-060`). Run this spike next so candidates are evaluated against a map that already shows true GPS photos.

### Admin-only modal with accept → console/server log

Surface a button only for admins, on admin hike/photo tooling or an admin-gated control near hike photos without GPS. Modal lists candidates; accept logs structured details (photo id, hike id, candidate type, track ids, times, rationale). No persistence.

Alternative considered: auto-log without accept. Explicit accept better matches later review UX.

### Candidate v1 uses track time ranges, not fake precision

With current metadata, supported spike candidates are:

1. **Inside track window** — `capturedAt` between track `time.start` and `time.end`.
2. **Between adjacent tracks** — `capturedAt` after track A end and before track B start, with a small time gap threshold; optionally also check that A end and B start geometry points are spatially near if both exist.

Do **not** present “interpolated kilometer 12.4 on the polyline” unless timestamped trackpoints are available. If the spike later experimentally parses GPX for learning, that remains non-product behavior and still must not persist.

Alternative considered: invent lat/lng by linear distance fraction across simplified geometry using only start/end times. That pretends precision we do not have and would mislead admins.

### Leave persistence to feature follow-up

`outdoor-photo-track-time-inferred-coordinates` stays the slice for provenance, confidence, approval, and public markers after this spike teaches us the real matching rules.

## Risks / Trade-offs

- EXIF times often lack timezone -> Mitigation: document assumption (e.g. treat as UTC or local wall time) in the modal copy; refine later.
- Start/end-only tracks cannot place along route -> Mitigation: candidate text stays range/between based; no fake map pin.
- Logging PII/coordinates in shared logs -> Mitigation: log ids and times, avoid provider URLs; keep spike short-lived.

## Migration Plan

None for data. After spike learnings, update the inferred-coordinates proposal/tasks before persistence work.

Rollback: remove admin spike UI/helpers; public map and EXIF markers unchanged.
