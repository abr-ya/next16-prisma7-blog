## MODIFIED Requirements

### Requirement: Inferred photo coordinates require confidence and review

The system SHALL require timestamp-inferred photo coordinates to carry enough provenance and confidence information for admin review before public hike map display. An admin-only matching spike may present non-persistent candidates and log an accepted suggestion before that persistence/review model exists.

#### Scenario: Spike proposes a track-time candidate

- **WHEN** an authenticated admin opens the track-time matching spike for a hike-linked photo that lacks direct EXIF GPS but has a usable capture timestamp
- **THEN** the system may show zero or more candidate explanations based on linked track recording windows and simple between-track gaps
- **AND** it does not write inferred coordinates to the photo record in this spike

#### Scenario: Admin accepts a spike candidate

- **WHEN** an authenticated admin accepts one spike candidate
- **THEN** the system logs the accepted candidate details for evaluation
- **AND** the public hike map does not gain an inferred marker from that acceptance

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
