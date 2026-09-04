## ADDED Requirements

### Requirement: Photo map coordinates record source and public readiness
The system SHALL distinguish photo coordinates by source so direct EXIF GPS, inferred track-time coordinates, and manually corrected coordinates can be handled differently before public map display.

#### Scenario: Photo has direct EXIF GPS coordinates
- **WHEN** a photo metadata extraction stores valid GPS latitude and longitude from image metadata
- **THEN** the photo can have a direct coordinate source suitable for a future public hike map marker when the photo and hike association are otherwise public
- **AND** the source remains distinguishable from inferred or manually corrected coordinates

#### Scenario: Photo has inferred coordinates
- **WHEN** a future inference process derives candidate coordinates from the photo capture time and linked track timelines
- **THEN** the candidate coordinates are recorded as inferred rather than direct EXIF GPS
- **AND** they are not treated as public-ready until accepted by the approved review behavior

#### Scenario: Photo coordinate is manually corrected
- **WHEN** an authorized admin manually corrects or confirms a photo coordinate
- **THEN** the corrected coordinate can be recorded as manually corrected or admin-approved
- **AND** future public map behavior can prefer the accepted corrected coordinate over an unapproved inferred candidate

### Requirement: Inferred photo coordinates require confidence and review
The system SHALL require timestamp-inferred photo coordinates to carry enough provenance and confidence information for admin review before public hike map display.

#### Scenario: Inference creates a candidate coordinate
- **WHEN** a future inference process matches a photo capture timestamp to a linked track timeline
- **THEN** the candidate stores the coordinate, source track identity, matched timestamp context, confidence or match quality, and inference status
- **AND** the public hike map does not display the candidate until it is approved or manually corrected according to the accepted workflow

#### Scenario: Inference cannot produce a confident candidate
- **WHEN** a photo lacks usable capture time, all linked tracks lack usable timestamps, or the match is outside accepted confidence bounds
- **THEN** the system records no public-ready inferred coordinate for that photo
- **AND** the photo may remain visible in the hike photo gallery or section without a map marker

#### Scenario: Inferred coordinate is rejected
- **WHEN** an authorized admin rejects an inferred photo coordinate
- **THEN** the rejected coordinate is not displayed on public hike maps
- **AND** the rejection does not delete the photo, its image assets, or its direct EXIF metadata if present

### Requirement: Photo day assignment is based on accepted temporal metadata
The system SHALL plan photo day filtering around accepted temporal metadata rather than file upload time or arbitrary association order.

#### Scenario: Photo has accepted capture date
- **WHEN** a linked published photo has a stored capture timestamp whose date can be interpreted for the hike day model
- **THEN** a future day-filtered hike map can include that photo marker on the matching day when the photo also has an accepted public coordinate

#### Scenario: Photo date is unavailable or ambiguous
- **WHEN** a linked published photo lacks a capture timestamp or has unresolved timezone ambiguity
- **THEN** the photo is not shown as confidently belonging to a single day in future day-filtered map views
- **AND** the photo may still appear in all-days views when it otherwise has an accepted public coordinate
