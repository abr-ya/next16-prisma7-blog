## ADDED Requirements

### Requirement: Hike map roadmap is split into ordered implementation slices
The system SHALL track the hike detail map experience as multiple ordered implementation slices so combined tracks, direct photo GPS markers, inferred photo coordinates, day filtering, and future notes can be validated independently.

#### Scenario: Planning identifies the first public map slice
- **WHEN** the outdoor roadmap is reviewed after this planning change
- **THEN** the first map implementation slice is a published hike detail map that renders all linked published tracks with current successful map-ready geometry
- **AND** it does not include photo markers, inferred coordinates, day filtering, or notes

#### Scenario: Planning identifies the direct GPS marker slice
- **WHEN** the combined track map slice is complete or ready to extend
- **THEN** the next photo marker slice can add linked published photos with direct EXIF GPS coordinates
- **AND** it does not infer coordinates for photos without direct GPS data

#### Scenario: Planning identifies coordinate inference as a later slice
- **WHEN** linked published photos lack direct GPS coordinates but have capture timestamps
- **THEN** timestamp-based coordinate inference remains a later slice with explicit confidence, provenance, admin review, and manual correction behavior

#### Scenario: Planning defers hike notes
- **WHEN** the map roadmap mentions hike notes
- **THEN** notes remain out of the map implementation scope until a hike note domain exists
- **AND** the future note layer can be planned as an additional map overlay after the note model is accepted

### Requirement: Hike map layer order is explicit
The system SHALL define the hike detail map as a layered public surface where linked track geometry provides route context and point-like content layers can be added only from accepted coordinate sources.

#### Scenario: Map renders tracks and photo markers together
- **WHEN** a visitor opens a published hike with mapped tracks and linked published photos that have accepted public coordinates
- **THEN** the public hike map can render track polylines and photo markers in the same map viewport
- **AND** the map bounds account for all visible track geometry and visible markers

#### Scenario: Map has no coordinate-backed layers
- **WHEN** a published hike has no linked published tracks with map-ready geometry and no linked published photos with accepted public coordinates
- **THEN** the hike detail page remains usable without showing broken map controls

### Requirement: Hike photo map markers have visibility-safe tooltips
The system SHALL allow public hike map photo markers to expose only visibility-safe photo information in hover or focus tooltips.

#### Scenario: Visitor hovers over a photo marker
- **WHEN** a visitor hovers or focuses a map marker for a linked published photo
- **THEN** the tooltip may show the photo title, a visibility-safe thumbnail or preview, and basic hike-linked photo context
- **AND** it does not expose original provider URLs, full-size image bytes, hidden EXIF metadata, extraction errors, or private file details

#### Scenario: Marker photo lacks a safe preview
- **WHEN** a linked published photo has an accepted public coordinate but no eligible visibility-safe thumbnail or preview
- **THEN** the marker may still show a text-only tooltip
- **AND** it does not fetch or reveal an ineligible image asset

### Requirement: Hike map can filter by all days or a single day
The system SHALL plan for a public hike map view mode that can show all accepted map layers together or only the map layers belonging to one selected hike day.

#### Scenario: Visitor views all hike days
- **WHEN** a visitor opens the default map view for a multi-day published hike
- **THEN** the map can show all visible linked track geometry and all visible photo markers with accepted public coordinates

#### Scenario: Visitor selects one hike day
- **WHEN** a visitor selects a single day from the hike date range
- **THEN** the map can limit visible track geometry and photo markers to content whose accepted date falls on that day
- **AND** content without an accepted date for that day is not forced into the filtered view

#### Scenario: Day assignment is ambiguous
- **WHEN** a linked track or photo has missing, conflicting, or timezone-ambiguous date data
- **THEN** the system SHALL avoid presenting the item as confidently belonging to a specific day
- **AND** the item may remain visible in the all-days view when it is otherwise public and map-eligible

### Requirement: Hike map planning preserves public visibility boundaries
The system SHALL preserve existing public visibility boundaries when map layers are added to published hike detail pages.

#### Scenario: Published hike has private or draft map-related content
- **WHEN** a published hike has draft tracks, draft photos, private file assets, failed metadata extraction, unapproved inferred coordinates, or future private notes
- **THEN** the public hike map does not expose those private records, unsafe details, or source file URLs
- **AND** the hike detail page degrades gracefully around unavailable map layers
