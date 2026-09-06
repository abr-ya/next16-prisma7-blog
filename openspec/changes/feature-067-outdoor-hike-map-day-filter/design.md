## Context

See `proposal.md`. The hike page currently passes all public map-ready track geometry and photo markers into a client-side Leaflet map. Track metadata retains recording start/end plus timezone evidence; photo EXIF records a capture timestamp but does not retain whether that timestamp had an explicit offset. The map currently fits bounds from every passed layer.

## Goals / Non-Goals

**Goals:**

- Give multi-day hikes an adjacent compact select control rather than a row of day buttons.
- Derive trustworthy per-day map-layer membership without a Prisma migration.
- Recompute Leaflet bounds from the current selection only, including a stable empty state when none are eligible.

**Non-Goals:**

- Do not split a multi-day GPX polyline at midnight; a safely dated track is shown in every hike day its recording interval overlaps.
- Do not infer a day from association order, upload time, GPS position, or a timestamp lacking timezone evidence.
- Do not persist selection in the URL or change the page's gallery/linked-track content.

## Decisions

### Use a client-side select next to the map

The server supplies an ordered inclusive set of hike-day options and date-assigned public map layers. A small client wrapper renders `All days` plus `Day N — <date>` options for multi-day hikes, filters the in-memory layers, and passes only the selected layers to Leaflet. A single-day hike omits the redundant selector.

Rationale: 2–14 day hikes stay compact and usable on narrow screens, while changing the select avoids a navigation, server round-trip, or URL state.

Alternative considered: day tabs/chips. Rejected because their width and wrapping degrade as the hike length grows.

### Canonicalize day matching to UTC date keys with explicit evidence

Create date-only `YYYY-MM-DD` keys from hike dates and from accepted timestamps. A track receives one or more day keys only when its recording interval has `UTC_OR_OFFSET` timezone evidence; it belongs to every hike day overlapped by that interval. A photo marker receives a day key only when its stored capture timestamp has explicit `UTC_OR_OFFSET` evidence, whether its public coordinate comes directly from EXIF or an approved inferred/manual coordinate.

Extend the versioned photo EXIF summary with optional capture-time timezone evidence at extraction/refresh time. Existing photo metadata lacking that evidence stays readable and remains visible in `All days`, but is excluded from single-day views until refreshed. This uses the current JSON metadata column and needs no Prisma migration.

Rationale: ISO values alone are not proof that an EXIF wall-clock time had an offset. Requiring stored evidence keeps the filter from making an inaccurate date claim.

Alternative considered: treating all parseable timestamps as dated. Rejected because legacy EXIF without `OffsetTime*` is timezone-ambiguous.

### Fit bounds from filtered layers and render an explicit empty state

The selected view supplies its own tracks and markers to the existing bounds logic. Every selection change fits/recenters the map using only those points. If no filtered point exists, keep the selector visible and replace the map canvas with a clear selected-day empty state rather than carrying over the prior map view.

Rationale: a day filter that leaves the all-days camera or layer output on screen would be misleading.

### Preserve public eligibility before temporal filtering

Server-side public queries continue to remove draft tracks/photos and ineligible assets before constructing map-layer day keys. The client never receives raw EXIF, timestamps, timezone evidence, provider URLs, or private layers; it receives only date-key membership plus the existing visibility-safe map view model.

Rationale: selecting a day must not become a metadata-disclosure path.

## Risks / Trade-offs

- [Risk] Older photos lack capture-time evidence and disappear from day-specific views → Mitigation: retain them in `All days`; allow the established metadata refresh workflow to populate evidence.
- [Risk] A track crossing midnight shows its whole geometry on two day views → Mitigation: document this intentional no-splitting boundary; defer point-level daily geometry splitting.
- [Risk] UTC date keys can differ from a traveller's intended local day near midnight → Mitigation: include only explicit-offset timestamps now and revisit presentation-local day policy if real trips require it.
- [Risk] A map refit on every selection can feel abrupt → Mitigation: use the existing fitted bounds behavior and avoid fitting when the selected-day state is empty.

## Migration Plan

- No Prisma migration is required; new optional evidence and day-key fields are backward-compatible additions to existing public view models and photo metadata JSON.
- Deploy readers before or together with EXIF refresh writers. Existing records remain available in `All days` and gain single-day eligibility after refresh.
- Rollback removes day controls and ignores optional fields, restoring the current all-layers map.
