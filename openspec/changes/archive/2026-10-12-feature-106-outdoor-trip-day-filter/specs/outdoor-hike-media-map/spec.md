# Spec Delta

## MODIFIED Requirements

### Requirement: Hike map can filter by all days or a single day

The system SHALL provide one compact day selector for the public trip-media area on a published multi-day hike. It SHALL default to `All days`, offer every calendar day in the hike's inclusive date range, and use the chosen day consistently for the map, linked track cards, and linked photo gallery. A selected day SHALL include only tracks, photos, photo markers, and note markers confidently assigned to that day; linked photos without a reliable capture-day assignment and coordinate-bearing notes without a deliberate day assignment SHALL remain available in `All days` only. The selector SHALL remain client-local and SHALL NOT add URL parameters or browser-history entries.

#### Scenario: Visitor views all hike days

- **WHEN** a visitor opens the default trip-media view for a multi-day published hike
- **THEN** the selector is set to `All days`
- **AND** the map shows all visible linked track geometry, all visible photo markers with accepted public coordinates, and all visible published coordinate-bearing note markers
- **AND** the linked track cards and photo gallery show all eligible linked media
- **AND** the map viewport frames all of its visible layers

#### Scenario: Visitor selects one hike day

- **WHEN** a visitor selects a single day from the hike date range
- **THEN** the map renders only visible track geometry, photo markers, and note markers confidently assigned to that selected day
- **AND** the linked track cards show only tracks confidently assigned to that day
- **AND** the photo gallery and its lightbox navigation contain only photos confidently assigned to that day
- **AND** the map recenters and refits its bounds to only the resulting visible layers
- **AND** it does not retain media from another day in the selected-day view

#### Scenario: Selected day has no confidently dated map layers

- **WHEN** a visitor selects a hike day with no visible map layers confidently assigned to it
- **THEN** the map surface shows a clear empty state for that day
- **AND** it does not display layers from another day or retain the prior day's map bounds as if they were selected-day content

#### Scenario: Single-day hike has no redundant filter

- **WHEN** a published hike spans only one calendar day
- **THEN** the trip-media area remains in the equivalent all-content view
- **AND** it does not require a redundant day-selection control

#### Scenario: Published note has no day assignment

- **WHEN** a published coordinate-bearing hike note has no deliberate hike-day assignment
- **THEN** the map shows it in the `All days` view when its hike is published
- **AND** it does not show the note for any selected individual day

#### Scenario: Photo date is unavailable or ambiguous

- **WHEN** a linked published photo lacks a reliable stored capture instant or its derived UTC day falls outside the hike date range
- **THEN** the photo remains available in the `All days` gallery according to its existing visibility and sort rules
- **AND** it does not appear in any selected individual-day gallery, map marker set, or lightbox sequence
- **AND** the system does not infer or invent a date to make it eligible

#### Scenario: Selected photo falls outside a new day selection

- **WHEN** a viewer has a valid open photo selection and changes the day selector to a day that does not include that photo
- **THEN** the photo viewer closes and the `photo` query parameter is removed through the existing native history-replacement behavior
- **AND** the selected day does not create a URL parameter or browser-history entry

#### Scenario: Day assignment is ambiguous

- **WHEN** a linked track or photo has missing, conflicting, or timezone-ambiguous date data
- **THEN** the system SHALL avoid presenting the item as confidently belonging to a specific day
- **AND** the item may remain visible in the all-days view when it is otherwise public and eligible
