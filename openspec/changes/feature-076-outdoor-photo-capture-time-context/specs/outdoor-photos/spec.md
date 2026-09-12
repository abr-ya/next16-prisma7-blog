## MODIFIED Requirements

### Requirement: Photo details expose authorized metadata and coordinate provenance
The system SHALL expose an authorized photo-detail view with the current metadata state without treating a failed extraction, unreviewed inference, missing capture time, or unavailable track timeline as a coordinate. The detail view SHALL display an available capture timestamp with an explicit timezone context: a readable display, the stored UTC instant, and whether the EXIF value included UTC/offset evidence or lacked it. Coordinate review controls SHALL explain why a candidate cannot be automatically resolved and SHALL preserve the existing manual-correction path for authorized reviewers.

#### Scenario: Authorized viewer opens a photo with offset-backed capture time

- **WHEN** an authorized viewer opens details for a photo whose stored capture timestamp was extracted with a UTC value or EXIF offset
- **THEN** the detail view shows its readable capture time and stored UTC instant
- **AND** it identifies that the capture time has UTC/offset evidence

#### Scenario: Authorized viewer opens a photo with timezone-free capture time

- **WHEN** an authorized viewer opens details for a photo whose stored capture timestamp came from an EXIF wall-clock value without an offset
- **THEN** the detail view shows its readable capture time and stored UTC instant
- **AND** it clearly identifies the missing timezone evidence without claiming that the photo was recorded in the viewer's timezone

#### Scenario: Photo capture time is unavailable

- **WHEN** an authorized viewer opens details for a photo whose capture timestamp is missing or invalid
- **THEN** the detail view reports that capture time is unavailable
- **AND** it does not render a misleading UTC conversion or timezone-evidence label
