## MODIFIED Requirements

### Requirement: Photo map coordinates record source and public readiness

The system SHALL distinguish photo coordinates by source so direct EXIF GPS, inferred track-time coordinates, and manually corrected coordinates can be handled differently before public map display. Stored direct EXIF GPS from a successful extraction remains an accepted public hike map-marker source when the photo is published and linked to a published hike. Approved inferred or manually corrected coordinates SHALL also be accepted public marker sources when direct EXIF GPS is absent.

#### Scenario: Photo has direct EXIF GPS coordinates

- **WHEN** a photo metadata extraction stores valid GPS latitude and longitude from image metadata
- **THEN** the photo has a direct coordinate source suitable for a public hike map marker when the photo and hike association are otherwise public
- **AND** the source remains distinguishable from inferred or manually corrected coordinates

#### Scenario: Public hike map uses only direct GPS in this slice

- **WHEN** a published hike map renders photo markers and a linked published photo has valid stored direct EXIF GPS
- **THEN** that photo marker uses the direct EXIF GPS coordinate
- **AND** inferred or manually corrected coordinates do not replace the direct EXIF source for public display

#### Scenario: Photo has inferred coordinates

- **WHEN** an admin-approved inference process derives coordinates from the photo capture time and linked track timelines
- **THEN** the candidate coordinates are recorded as inferred rather than direct EXIF GPS
- **AND** they are not treated as public-ready until accepted by the approved review behavior

#### Scenario: Photo coordinate is manually corrected

- **WHEN** an authorized admin manually corrects or confirms a photo coordinate
- **THEN** the corrected coordinate can be recorded as manually corrected or admin-approved
- **AND** future public map behavior can prefer the accepted corrected coordinate over an unapproved inferred candidate when direct EXIF GPS is absent

### Requirement: Inferred photo coordinates require confidence and review

The system SHALL require timestamp-inferred photo coordinates to carry enough provenance and confidence information for admin review before public hike map display. Admins MAY approve, reject, or manually correct proposed coordinates through the track-time matching review flow; rejected or unapproved candidates SHALL NOT appear on public hike maps.

#### Scenario: Spike proposes a track-time candidate

- **WHEN** an authenticated admin opens the track-time matching review for a hike-linked photo that lacks direct EXIF GPS but has a usable capture timestamp
- **THEN** the system may show zero or more candidate explanations based on linked track recording windows, between-track gaps, and available timed track timelines
- **AND** persistable candidates include enough provenance to reconstruct why a coordinate would be stored

#### Scenario: Admin accepts a spike candidate

- **WHEN** an authenticated admin accepts/approves one track-time candidate with a resolvable latitude and longitude
- **THEN** the system persists the coordinate, source track identity, matched timestamp context, confidence or match quality, and approved review status on the photo metadata
- **AND** the public hike map MAY show a marker for that photo when the hike and photo are otherwise public-eligible and direct EXIF GPS is absent

#### Scenario: Inference creates a candidate coordinate

- **WHEN** an inference process matches a photo capture timestamp to a linked track timeline or between-track placement rule
- **THEN** the candidate stores the coordinate, source track identity, matched timestamp context, confidence or match quality, and inference status
- **AND** the public hike map does not display the candidate until it is approved or manually corrected according to the accepted workflow

#### Scenario: Inference cannot produce a confident candidate

- **WHEN** a photo lacks usable capture time, linked tracks lack usable timestamps or timed points needed for a resolvable coordinate, or no candidate can be formed
- **THEN** the system records no public-ready inferred coordinate for that photo
- **AND** the photo may remain visible in the hike photo gallery or section without a map marker

#### Scenario: Inferred coordinate is rejected

- **WHEN** an authorized admin rejects an inferred photo coordinate
- **THEN** the rejected coordinate is not displayed on public hike maps
- **AND** the rejection does not delete the photo, its image assets, or its direct EXIF metadata if present
