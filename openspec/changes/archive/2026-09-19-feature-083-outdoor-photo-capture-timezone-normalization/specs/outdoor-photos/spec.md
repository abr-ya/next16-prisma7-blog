## ADDED Requirements

### Requirement: Timezone-less camera capture time remains a wall-clock value

The system SHALL preserve a photo capture time lacking EXIF UTC or offset evidence as an unconfirmed camera-local wall-clock value and SHALL NOT label it as stored UTC or use it as an absolute instant.

#### Scenario: Camera omits an EXIF timezone

- **WHEN** an uploaded photo has `DateTimeOriginal` or equivalent camera time without an offset or GPS UTC time
- **THEN** the system displays the captured wall-clock value as timezone unconfirmed
- **AND** it preserves that original value and its missing-timezone provenance
- **AND** it does not invent an absolute UTC instant

### Requirement: Authorized user can confirm a photo capture timezone

The system SHALL let the photo owner or an administrator confirm or change an IANA timezone for an unconfirmed camera-local capture time, while preserving the original EXIF wall-clock evidence and recording the assumption provenance.

#### Scenario: Owner confirms an IANA timezone

- **WHEN** the photo owner selects a valid IANA timezone for an unconfirmed camera-local capture time
- **THEN** the system derives the corresponding UTC instant using that timezone's rules at the capture date
- **AND** it records that the instant comes from an owner-confirmed timezone assumption
- **AND** it preserves the original camera-local EXIF value

#### Scenario: Unrelated user attempts timezone confirmation

- **WHEN** a user who is neither the photo owner nor an administrator attempts to confirm a photo timezone
- **THEN** the system rejects the request
- **AND** the photo capture-time data remains unchanged
