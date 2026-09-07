## MODIFIED Requirements

### Requirement: Hike map can filter by all days or a single day

The system SHALL provide a compact day selector adjacent to the public map on a published multi-day hike. It SHALL default to `All days`, offer every calendar day in the hike's inclusive date range, and allow a visitor to limit the map to one selected day without exposing ambiguously dated layers as confidently assigned to that day. Published hike notes with valid coordinates and a deliberate day assignment SHALL be treated as confidently assigned layers; published coordinate-bearing notes without a day assignment SHALL remain all-days-only.

#### Scenario: Visitor views all hike days

- **WHEN** a visitor opens the default map view for a multi-day published hike
- **THEN** the selector is set to `All days`
- **AND** the map shows all visible linked track geometry, all visible photo markers with accepted public coordinates, and all visible published coordinate-bearing note markers
- **AND** the map viewport frames all of those visible layers

#### Scenario: Visitor selects one hike day

- **WHEN** a visitor selects a single day from the hike date range
- **THEN** the map renders only visible track geometry, photo markers, and note markers confidently assigned to that selected day
- **AND** the map recenters and refits its bounds to only the resulting visible layers
- **AND** it does not retain geometry or markers from other days

#### Scenario: Selected day has no confidently dated map layers

- **WHEN** a visitor selects a hike day with no visible map layers confidently assigned to it
- **THEN** the map surface shows a clear empty state for that day
- **AND** it does not display layers from another day or retain the prior day's map bounds as if they were selected-day content

#### Scenario: Single-day hike has no redundant filter

- **WHEN** a published hike spans only one calendar day
- **THEN** the map remains in the equivalent all-content view
- **AND** it does not require a redundant day-selection control

#### Scenario: Day assignment is ambiguous

- **WHEN** a linked track or photo has missing, conflicting, or timezone-ambiguous date data
- **THEN** the system SHALL avoid presenting the item as confidently belonging to a specific day
- **AND** the item may remain visible in the all-days view when it is otherwise public and map-eligible

#### Scenario: Published note has no day assignment

- **WHEN** a published coordinate-bearing hike note has no deliberate hike-day assignment
- **THEN** the map shows it in the `All days` view when its hike is published
- **AND** it does not show the note for any selected individual day

### Requirement: Hike map renders visibility-safe note markers

The system SHALL render each eligible published hike note with a coordinate pair as a public map marker and expose only its title and optional body in the marker interaction.

#### Scenario: Visitor opens a hike with mapped published notes

- **WHEN** a visitor opens a published hike with one or more published notes that have valid coordinates
- **THEN** the map renders a marker for each eligible note
- **AND** the marker interaction exposes the note title and optional body only

#### Scenario: Map note lacks a coordinate

- **WHEN** a published hike note has no coordinate pair
- **THEN** the public hike map does not render a marker for that note
- **AND** it does not create a broken or placeholder map marker

#### Scenario: Draft note is map-ineligible

- **WHEN** a hike has a draft note with a valid coordinate pair
- **THEN** the public hike map does not render or expose that note

