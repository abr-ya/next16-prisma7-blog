## MODIFIED Requirements

### Requirement: Hike detail can render a combined track map

The system SHALL render one public hike map on published hike detail pages when at least one linked published track has current successful map-ready geometry.

#### Scenario: Visitor opens hike with mapped tracks

- **WHEN** a visitor opens a published hike with one or more linked published tracks that have current successful map-ready geometry
- **THEN** the hike detail page renders a combined map containing those track polylines
- **AND** the map viewport frames the combined bounds of the rendered tracks
- **AND** the map appears under the hike title and description

#### Scenario: Linked track lacks map geometry

- **WHEN** a published hike has linked published tracks but none have current successful map-ready geometry
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
- **THEN** the system uses stored parsed track metadata and map-ready geometry
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
- **THEN** this combined track map slice does not render photo markers, inferred coordinates, day filters, or notes
- **AND** linked published photos may still appear in the existing hike photo section

#### Scenario: Hike listing has no combined map

- **WHEN** a visitor opens the public `/hikes` listing
- **THEN** the listing does not render interactive combined track maps
- **AND** combined track map rendering remains limited to published hike detail pages
