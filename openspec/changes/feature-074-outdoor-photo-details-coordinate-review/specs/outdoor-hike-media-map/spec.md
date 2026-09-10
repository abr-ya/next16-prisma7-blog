## ADDED Requirements

### Requirement: Authorized trip photo viewer exposes photo details
The system SHALL let an authenticated viewer who is the linked photo owner, the published trip creator, an accepted active trip participant, or an administrator open a details view from that trip's photo card or large-photo viewer. The details view SHALL show the extracted capture summary that is available for the photo, the accepted coordinate when present, and the coordinate source and confidence/provenance. Anonymous visitors and signed-in users without that trip relationship SHALL retain the existing image-only gallery and SHALL NOT receive the new metadata or exact-coordinate projection.

#### Scenario: Authorized participant opens photo details
- **WHEN** an accepted active participant opens a published trip photo's details view
- **THEN** the system displays available capture date, camera, dimensions, exposure, GPS presence, and accepted coordinate provenance
- **AND** unavailable metadata or coordinates are represented without an extraction error detail or invented location

#### Scenario: Unrelated viewer opens a photo
- **WHEN** an anonymous visitor or signed-in user who is not the photo owner, trip creator, accepted active participant, or administrator opens a published trip photo
- **THEN** the system preserves the existing image-only gallery/viewer behavior
- **AND** it does not expose the new EXIF fields, exact coordinate, coordinate provenance, or review controls

### Requirement: Authorized photo details can focus the trip map
The system SHALL provide an authorized viewer with a way to focus the current trip map on a photo's accepted coordinate when that coordinate is otherwise eligible for the published trip map. The details view SHALL identify whether the location comes from direct EXIF GPS, an approved track-time inference, or a manual correction.

#### Scenario: Photo has an accepted direct GPS coordinate
- **WHEN** an authorized viewer opens details for a photo with direct EXIF GPS coordinates
- **THEN** the details view identifies the direct GPS source
- **AND** its map action focuses the current trip map on that photo location

#### Scenario: Photo has no accepted coordinate
- **WHEN** an authorized viewer opens details for a photo without a public-ready coordinate
- **THEN** the details view explains that no accepted location is available
- **AND** it does not offer a map focus action for an invented location
