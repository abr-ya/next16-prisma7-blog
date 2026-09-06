## MODIFIED Requirements

### Requirement: Hike map can filter by all days or a single day

The system SHALL provide a compact day selector adjacent to the public map on a published multi-day hike. It SHALL default to `All days`, offer every calendar day in the hike's inclusive date range, and allow a visitor to limit the map to one selected day without exposing ambiguously dated layers as confidently assigned to that day.

#### Scenario: Visitor views all hike days

- **WHEN** a visitor opens the default map view for a multi-day published hike
- **THEN** the selector is set to `All days`
- **AND** the map shows all visible linked track geometry and all visible photo markers with accepted public coordinates
- **AND** the map viewport frames all of those visible layers

#### Scenario: Visitor selects one hike day

- **WHEN** a visitor selects a single day from the hike date range
- **THEN** the map renders only visible track geometry and photo markers confidently assigned to that selected day
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

