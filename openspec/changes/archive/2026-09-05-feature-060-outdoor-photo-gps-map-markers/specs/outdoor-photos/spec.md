## MODIFIED Requirements

### Requirement: Photo map coordinates record source and public readiness

The system SHALL distinguish photo coordinates by source so direct EXIF GPS, inferred track-time coordinates, and manually corrected coordinates can be handled differently before public map display. For this slice, stored direct EXIF GPS from a successful extraction is an accepted public hike map-marker source when the photo is published and linked to a published hike.

#### Scenario: Photo has direct EXIF GPS coordinates

- **WHEN** a photo metadata extraction stores valid GPS latitude and longitude from image metadata
- **THEN** the photo has a direct coordinate source suitable for a public hike map marker when the photo and hike association are otherwise public
- **AND** the source remains distinguishable from inferred or manually corrected coordinates

#### Scenario: Public hike map uses only direct GPS in this slice

- **WHEN** a published hike map renders photo markers
- **THEN** only linked published photos with valid stored direct EXIF GPS are included
- **AND** inferred or manually corrected coordinates are not required or invented by this slice

#### Scenario: Photo has inferred coordinates

- **WHEN** a future inference process derives candidate coordinates from the photo capture time and linked track timelines
- **THEN** the candidate coordinates are recorded as inferred rather than direct EXIF GPS
- **AND** they are not treated as public-ready until accepted by the approved review behavior

#### Scenario: Photo coordinate is manually corrected

- **WHEN** an authorized admin manually corrects or confirms a photo coordinate
- **THEN** the corrected coordinate can be recorded as manually corrected or admin-approved
- **AND** future public map behavior can prefer the accepted corrected coordinate over an unapproved inferred candidate
