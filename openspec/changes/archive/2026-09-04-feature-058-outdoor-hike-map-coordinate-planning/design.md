## Context

See `proposal.md` for motivation. The project already has:

- Published hike detail pages under `/hikes/[slug]`.
- Independent published/draft GPX-backed tracks with parsed summary metadata and simplified map-ready geometry.
- A public single-track map component based on stored geometry.
- Hike-track and hike-photo join models that keep tracks and photos independent.
- Outdoor photos with JSON EXIF metadata, including capture date and direct GPS summary when extraction succeeds.

The current track map geometry is route-shaped and public-rendering-friendly, but it is not enough by itself for photo timestamp matching because inference needs timestamped positions or segments. The current photo metadata can identify direct GPS and capture time, but it does not yet distinguish public map coordinate source, inference state, admin approval, or manual corrections.

## Goals / Non-Goals

**Goals:**

- Turn the map idea into an ordered set of future implementation slices.
- Keep the first map slice limited to combined published track geometry on published hike pages.
- Define how direct GPS photo markers, inferred coordinates, manual correction, and day filtering fit into later slices.
- Preserve the rule that public pages read stored safe metadata and do not parse raw GPX or image files during rendering.
- Make timezone/date ambiguity explicit before implementing day filters or timestamp matching.
- Park the photo gallery viewer slice without deleting its accepted planning artifacts.

**Non-Goals:**

- No code, schema migration, parser change, UI map change, or dependency change in this planning slice.
- No final data-model field names for inference; those should be chosen in the implementation proposal that adds persistence.
- No hike notes model or note map layer implementation.
- No change to public photo full-size/thumbnail access; that remains in the paused gallery viewer slice.

## Decisions

### Sequence map work from visible route context to richer point layers

Order future slices as:

1. Combined hike track map.
2. Direct GPS photo markers.
3. Photo-to-track timestamp matching spike.
4. Inferred coordinate persistence with admin review and manual correction.
5. All-days/single-day map filtering.
6. Future note layer after the note domain exists.

This keeps the first public map useful while avoiding the highest-risk assumptions around timezones, interpolation, and approval state.

Alternative considered: implement one large hike map with tracks, photos, inference, manual edits, day filtering, and notes together. That would make the data contract hard to validate and would mix public UI work with parser/storage changes.

### Build the first hike map as composition over existing public track geometry

The first implementation slice should reuse the existing stored map-ready geometry from linked published tracks. Public hike rendering should receive only safe track view models and combined bounds. It should not fetch raw GPX files, expose provider URLs, or introduce a second parser path.

Alternative considered: derive combined geometry directly from source GPX files on the hike page. That breaks the existing stored-metadata boundary and would make public page rendering slower and less predictable.

### Treat photo coordinates as a derived public map state, not just EXIF metadata

Direct EXIF GPS can make a photo eligible for a public marker sooner, but the long-term model needs a public map coordinate concept with source/provenance. Inferred coordinates must be separate from direct EXIF coordinates and must carry confidence/review state before public display. Manual correction should be able to override or approve an inferred candidate without destroying the original EXIF metadata.

Alternative considered: overwrite the stored EXIF GPS summary when correcting a marker. That loses provenance and makes it impossible to distinguish camera-supplied coordinates from admin-chosen map placement.

### Plan timestamp matching as a spike before persistence

Photo-to-track matching needs real examples before implementing a migration. The spike should inspect how current GPX parses represent times, whether enough timestamped route points are retained or need to be added, how photo capture timestamps are stored, and how timezone-less EXIF values should be interpreted.

Alternative considered: immediately add inferred coordinate fields based on the existing track time range. A time range alone is not enough to place photos along a route.

### Define day filtering only after temporal semantics are accepted

Day filtering should use accepted temporal metadata, not upload time or hike-photo ordering. Tracks may span multiple days and may need segmentation. Photos may have capture timestamps without timezone information. The all-days view should remain the fallback for public map-eligible content that cannot be confidently assigned to one day.

Alternative considered: filter by the hike date range only. That does not solve which exact day a photo or track segment belongs to inside a multi-day hike.

### Keep notes as a future overlay

Notes belong in the map concept, but they should not be planned as implementation tasks until the note entity exists. The future note model can decide whether notes are coordinate-only, timestamp-only, route-segment-linked, day-scoped, or a mix.

## Risks / Trade-offs

- Date/time ambiguity can make day filters misleading -> Mitigation: require accepted temporal semantics before implementing single-day map filters.
- Inferred coordinates can look factual when they are only guesses -> Mitigation: require source, confidence, review state, and public-readiness before map display.
- Storing timeline geometry may increase metadata size -> Mitigation: evaluate simplification and retention rules in the matching spike before adding persistence.
- The paused gallery viewer still affects photo marker tooltips and thumbnails later -> Mitigation: keep marker tooltips visibility-safe and let full-size viewing remain governed by the gallery/access slice.
- The future hike-to-trip rename could touch route/model names -> Mitigation: keep this plan behavior-oriented and avoid introducing trip-specific naming in this slice.

## Migration Plan

This planning slice has no database or runtime migration.

Future implementation sequence:

1. Promote and implement combined hike track map using existing stored geometry.
2. Promote and implement direct GPS photo markers using stored photo EXIF GPS summaries.
3. Run a timestamp-matching spike with real GPX/photo examples and update the inferred-coordinate design.
4. Add persistence for inferred/manual photo map coordinates with admin review.
5. Add day filtering once track segmentation and photo date assignment rules are accepted.

Rollback for this planning slice is limited to reverting the OpenSpec/backlog documents. Existing code and database data are unchanged.
