## MODIFIED Requirements

### Requirement: Hike photo map markers have visibility-safe tooltips

The system SHALL expose only visibility-safe photo information in hover or focus tooltips for public hike map photo markers, and SHALL make every photo at an identical accepted coordinate reachable through one grouped marker popup.

#### Scenario: Visitor hovers over a photo marker

- **WHEN** a visitor hovers or focuses a map marker representing one linked published photo
- **THEN** the tooltip shows the photo title and may show a visibility-safe thumbnail or preview
- **AND** it does not expose original provider URLs, full-size image bytes, hidden EXIF metadata, extraction errors, or private file details

#### Scenario: Marker photo lacks a safe preview

- **WHEN** a linked published photo has an accepted public coordinate but no eligible visibility-safe thumbnail or preview
- **THEN** the marker still shows a text-only tooltip with the photo title
- **AND** it does not fetch or reveal an ineligible image asset

#### Scenario: Several photos have identical map coordinates

- **WHEN** two or more linked published photos have the same accepted latitude and longitude on a published hike
- **THEN** the map renders one marker at that coordinate that visibly communicates the number of photos
- **AND** selecting that marker opens a popup that makes every grouped photo individually discoverable by title and, when eligible, thumbnail
- **AND** no grouped photo is hidden behind an overlapping marker

#### Scenario: Grouped popup remains visibility-safe

- **WHEN** a visitor opens a marker popup for several photos at the same coordinate
- **THEN** it exposes only each photo's visibility-safe title and eligible thumbnail or preview
- **AND** it does not expose original provider URLs, full-size image bytes, hidden EXIF metadata, extraction errors, or private file details
