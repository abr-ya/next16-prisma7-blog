## MODIFIED Requirements

### Requirement: Authorized photo details can focus the trip map

The system SHALL provide an authorized viewer with a way to focus the current trip map on a photo's accepted coordinate when that coordinate is otherwise eligible for the published trip map. Selecting the map action SHALL close the large-photo viewer, reveal the current trip map through a visible programmatic scroll, move accessible focus to the map surface, and fly or zoom to the selected coordinate while preserving map-layer visibility. The details view SHALL identify whether the location comes from direct EXIF GPS, an approved track-time inference, or a manual correction. An owner or administrator reviewing an inside-track-window candidate with usable timed track data SHALL receive a protected, non-persistent time-offset map preview.

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

#### Scenario: Reviewer previews an inside-track time offset

- **WHEN** a photo owner or administrator opens coordinate review for an inside-track-window candidate with usable timed track data
- **THEN** the review shows a compact map fragment with the candidate's source track and the original proposed point
- **AND** the reviewer can select temporary one-hour offsets from -3 through +3 hours
- **AND** the map, previewed timestamp, and coordinate update to represent the selected offset on that same source track
- **AND** neither the photo capture time nor any persisted candidate or coordinate changes until an existing explicit approval action is selected

#### Scenario: Previewed time is outside the source track timeline

- **WHEN** the reviewer selects an offset that is outside the source track's usable timed timeline
- **THEN** the review identifies that the preview is outside the recorded track time
- **AND** it does not invent, clamp, or persist a coordinate for that offset
- **AND** the original candidate and existing approval behavior remain available

#### Scenario: Candidate cannot support an offset preview

- **WHEN** coordinate review displays a between-track, after-finish, unresolved, or missing-timeline candidate
- **THEN** the review preserves its existing explanation and approval/manual-correction behavior
- **AND** it does not display a misleading time-offset map preview

#### Scenario: Unauthorized viewer cannot read preview data

- **WHEN** a viewer is not the photo owner or an administrator
- **THEN** the system does not expose private timed track geometry, offset controls, preview coordinates, or coordinate-review UI
