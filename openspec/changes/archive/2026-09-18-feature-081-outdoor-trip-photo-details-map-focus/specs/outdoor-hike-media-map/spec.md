## MODIFIED Requirements

### Requirement: Authorized photo details can focus the trip map

The system SHALL provide an authorized viewer with a way to focus the current trip map on a photo's accepted coordinate when that coordinate is otherwise eligible for the published trip map. Selecting the map action SHALL close the large-photo viewer, reveal the current trip map through a visible programmatic scroll, move accessible focus to the map surface, and fly or zoom to the selected coordinate while preserving map-layer visibility. The details view SHALL identify whether the location comes from direct EXIF GPS, an approved track-time inference, or a manual correction.

#### Scenario: Photo has an accepted direct GPS coordinate

- **WHEN** an authorized viewer opens details for a photo with direct EXIF GPS coordinates and selects the map action
- **THEN** the details view identifies the direct GPS source
- **AND** the large-photo viewer closes
- **AND** the current trip map is brought into view and receives accessible focus
- **AND** the map focuses that photo location without hiding otherwise visible layers

#### Scenario: Photo has no accepted coordinate

- **WHEN** an authorized viewer opens details for a photo without a public-ready coordinate
- **THEN** the details view explains that no accepted location is available
- **AND** it does not offer a map focus action for an invented location

#### Scenario: Current trip has no rendered map surface

- **WHEN** an authorized viewer opens details for a photo whose accepted coordinate cannot be shown because the current trip has no rendered map surface
- **THEN** the system does not show a misleading map focus action
- **AND** the viewer remains usable without programmatic navigation
