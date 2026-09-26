# Spec Delta

## ADDED Requirements

### Requirement: Offset-backed EXIF preserves source camera time

The system SHALL preserve the source camera-local date and time and the numeric EXIF offset when an image supplies both an EXIF capture timestamp and offset, alongside the derived UTC instant. It SHALL identify whether capture time came from GPS UTC, offset-backed EXIF, or timezone-less EXIF, and SHALL not infer an IANA timezone from a numeric offset alone.

#### Scenario: EXIF contains camera time and offset

- **WHEN** EXIF provides `DateTimeOriginal` or an equivalent camera timestamp with a valid `OffsetTime*` value
- **THEN** the stored extraction metadata retains the original camera-local value, the supplied numeric offset, and the derived UTC instant
- **AND** normal rendering can read those stored values without reparsing the image

#### Scenario: EXIF contains camera time without offset

- **WHEN** EXIF provides a camera timestamp without an offset or GPS UTC timestamp
- **THEN** the system retains that value as an unconfirmed camera-local wall-clock time under the existing timezone-confirmation model
- **AND** it does not invent a numeric offset, IANA timezone, or UTC instant

#### Scenario: EXIF provides GPS UTC capture time

- **WHEN** EXIF provides an authoritative GPS date and time
- **THEN** the system retains the GPS-derived UTC instant and its GPS provenance
- **AND** it does not misrepresent that UTC source as an EXIF camera-local time with an offset

### Requirement: Authorized photo details prioritize source camera time

The authorized trip-photo details SHALL present an available source camera-local capture time with its EXIF offset as the primary capture value when that evidence exists, and SHALL present the stored UTC instant as supporting comparable context. When the source time has no offset, the details SHALL label it as unconfirmed, display an unambiguous linked-track IANA timezone as a proposed assumption when one exists, and let only the photo owner or an administrator use the existing confirmation workflow to accept or replace that assumption. The details SHALL preserve existing safe read-only access for other authorized trip viewers and SHALL not expose raw EXIF diagnostics to anonymous or unrelated users.

#### Scenario: Authorized viewer opens an offset-backed photo

- **WHEN** an authorized viewer opens details for a photo whose EXIF supplied camera-local time and an offset
- **THEN** the primary capture value shows that camera-local time and offset
- **AND** the details also show the stored UTC instant as a separate comparable value

#### Scenario: Owner sees an unambiguous linked-track timezone proposal

- **WHEN** the photo has timezone-less camera-local time and its trip has exactly one confirmed linked-track IANA timezone
- **THEN** the owner or administrator sees that timezone identified as a proposal rather than confirmed EXIF evidence
- **AND** they can confirm it or replace it through the existing authorized timezone-confirmation flow

#### Scenario: Timezone context is ambiguous

- **WHEN** a timezone-less camera-local photo has zero or multiple linked-track IANA timezones and no owner/admin confirmation
- **THEN** the details identify the camera time as timezone unconfirmed
- **AND** they do not select a track timezone or derive an absolute UTC instant automatically

#### Scenario: Legacy offset-backed metadata lacks camera-local source values

- **WHEN** an owner or administrator opens a photo whose existing offset-backed metadata has a UTC instant but lacks preserved camera-local time or offset
- **THEN** the details recommend refreshing EXIF metadata to restore source camera-time presentation when the original file still provides it
- **AND** the recommendation does not alter the stored UTC instant, metadata, or coordinate state until an authorized refresh is requested

#### Scenario: Read-only viewer sees safe capture context

- **WHEN** a trip creator who does not own the photo or an accepted participant opens a photo detail view
- **THEN** the viewer may see the same safe stored camera-time and UTC context already allowed by the detail view
- **AND** they do not receive refresh recommendations, timezone-confirmation controls, or raw EXIF diagnostics
