## MODIFIED Requirements

### Requirement: Hike detail can render a combined track map

The system SHALL render one public hike map on published hike detail pages when at least one linked published track has current successful map-ready geometry or at least one linked published photo has an accepted public map coordinate for this slice.

#### Scenario: Visitor opens hike with mapped tracks

- **WHEN** a visitor opens a published hike with one or more linked published tracks that have current successful map-ready geometry
- **THEN** the hike detail page renders a combined map containing those track polylines
- **AND** the map viewport frames the combined bounds of the rendered tracks and any visible photo markers
- **AND** the map appears under the hike title and description

#### Scenario: Linked track lacks map geometry

- **WHEN** a published hike has linked published tracks but none have current successful map-ready geometry and no linked published photo has an accepted public map coordinate
- **THEN** the hike detail page remains usable
- **AND** it does not show a broken map control
- **AND** it does not parse or fetch raw GPX files during public rendering

#### Scenario: Some linked tracks are map-eligible and others are not

- **WHEN** a published hike has multiple linked published tracks and only a subset have current successful map-ready geometry
- **THEN** the combined map renders only the map-eligible tracks
- **AND** the hike page still lists the other linked published tracks through the existing linked-track section
- **AND** it does not expose failed, stale, or draft track geometry

#### Scenario: Combined hike map uses stored track metadata

- **WHEN** a visitor opens a published hike whose combined map is rendered
- **THEN** the system uses stored parsed track metadata and map-ready geometry for track layers
- **AND** it does not parse or fetch raw GPX files as part of rendering the hike map
- **AND** it does not expose UploadThing provider URLs or raw GPX file URLs for map rendering

#### Scenario: Single mapped track keeps route endpoints

- **WHEN** a published hike renders a combined map with exactly one map-eligible linked published track whose geometry contains at least two points
- **THEN** the map visually distinguishes that track's start and end points
- **AND** the start and end points use the stored geometry order

#### Scenario: Multiple mapped tracks emphasize polylines

- **WHEN** a published hike renders a combined map with two or more map-eligible linked published tracks
- **THEN** the map shows each of those tracks as a distinct polyline
- **AND** it does not require per-track start and end markers

#### Scenario: Combined hike map excludes later map layers

- **WHEN** a visitor opens a published hike with linked published photos or future hike notes
- **THEN** the hike map may render direct GPS photo markers from this slice
- **AND** it does not render inferred coordinates, day filters, or notes
- **AND** linked published photos may still appear in the existing hike photo section

#### Scenario: Hike has GPS photo markers but no mapped tracks

- **WHEN** a published hike has no map-eligible linked tracks but has one or more linked published photos with accepted direct GPS coordinates
- **THEN** the hike detail page still renders the hike map with those photo markers
- **AND** the map viewport frames the marker positions
- **AND** it does not show a broken empty map

#### Scenario: Hike listing has no combined map

- **WHEN** a visitor opens the public `/hikes` listing
- **THEN** the listing does not render interactive combined track maps
- **AND** combined track map rendering remains limited to published hike detail pages

### Requirement: Hike map can place photos with direct GPS coordinates

The system SHALL display linked published photos on the public hike map when those photos have visibility-safe stored direct GPS coordinates from extracted image metadata.

#### Scenario: Linked photo has direct GPS coordinates

- **WHEN** a published hike has a linked published photo with stored direct GPS latitude and longitude from successful EXIF extraction
- **THEN** the public hike map shows a marker for that photo
- **AND** the marker uses stored metadata rather than reparsing the image file

#### Scenario: Linked photo has no direct GPS coordinates

- **WHEN** a published hike has a linked published photo without stored direct GPS coordinates
- **THEN** the photo may still appear in the hike photo section
- **AND** it is not shown as a coordinate marker unless another accepted coordinate source exists

#### Scenario: Linked photo GPS comes from failed or stale extraction

- **WHEN** a linked published photo has missing, failed, or stale EXIF extraction, or its stored GPS summary is absent or invalid
- **THEN** the public hike map does not show a marker for that photo
- **AND** the hike page remains usable

### Requirement: Hike photo map markers have visibility-safe tooltips

The system SHALL expose only visibility-safe photo information in hover or focus tooltips for public hike map photo markers.

#### Scenario: Visitor hovers over a photo marker

- **WHEN** a visitor hovers or focuses a map marker for a linked published photo
- **THEN** the tooltip shows the photo title and may show a visibility-safe thumbnail or preview
- **AND** it does not expose original provider URLs, full-size image bytes, hidden EXIF metadata, extraction errors, or private file details

#### Scenario: Marker photo lacks a safe preview

- **WHEN** a linked published photo has an accepted public coordinate but no eligible visibility-safe thumbnail or preview
- **THEN** the marker still shows a text-only tooltip with the photo title
- **AND** it does not fetch or reveal an ineligible image asset

### Requirement: Hike map layer order is explicit

The system SHALL treat the hike detail map as a layered public surface where linked track geometry provides route context and photo markers are added only from accepted coordinate sources.

#### Scenario: Map renders tracks and photo markers together

- **WHEN** a visitor opens a published hike with mapped tracks and linked published photos that have accepted public coordinates
- **THEN** the public hike map renders track polylines and photo markers in the same map viewport
- **AND** the map bounds account for all visible track geometry and visible markers

#### Scenario: Map has no coordinate-backed layers

- **WHEN** a published hike has no linked published tracks with map-ready geometry and no linked published photos with accepted public coordinates
- **THEN** the hike detail page remains usable without showing broken map controls
