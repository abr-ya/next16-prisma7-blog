## Purpose

Defines admin-curated notes attached to hikes so important route moments can be recorded safely and selectively shown on the public hike map.

## Requirements

### Requirement: Admin can manage hike notes

The system SHALL allow authenticated admins to create, edit, and delete notes owned by one hike. A note SHALL have a non-empty title, optional body, optional coordinate pair, optional hike-day assignment, and draft or published status.

#### Scenario: Admin creates a draft note

- **WHEN** an authenticated admin creates a note for an existing hike with valid title and optional fields
- **THEN** the system saves the note under that hike with the selected status
- **AND** the note is available to that admin in the hike management surface

#### Scenario: Admin updates a hike note

- **WHEN** an authenticated admin saves valid changes to an existing hike note
- **THEN** the system preserves the note identity and its owning hike
- **AND** subsequent admin and eligible public reads use the updated note

#### Scenario: Admin deletes a hike note

- **WHEN** an authenticated admin confirms deletion of an existing hike note
- **THEN** the system removes that note without deleting the owning hike or its tracks and photos
- **AND** the note no longer appears in admin or public reads

#### Scenario: Non-admin attempts note management

- **WHEN** a signed-in non-admin or anonymous visitor attempts to create, update, or delete a hike note
- **THEN** the system rejects the request
- **AND** existing hike notes remain unchanged

### Requirement: Hike note location and day inputs remain bounded

The system SHALL accept a note location only as a complete valid latitude/longitude pair, and SHALL accept a note day only when it is within the owning hike's inclusive calendar-date range.

#### Scenario: Admin saves a coordinate-bearing note

- **WHEN** an authenticated admin supplies valid latitude and longitude for a hike note
- **THEN** the system stores the pair as the note's location
- **AND** the note becomes eligible for map rendering if it is published

#### Scenario: Admin supplies incomplete or invalid coordinates

- **WHEN** an authenticated admin supplies only one coordinate or an out-of-range latitude or longitude
- **THEN** the system rejects the save with a validation error
- **AND** it does not persist a partial location

#### Scenario: Admin assigns a note to a hike day

- **WHEN** an authenticated admin assigns a calendar day within the owning hike's inclusive date range
- **THEN** the system stores that day as a deliberate, timezone-safe day assignment

#### Scenario: Admin assigns a day outside the hike

- **WHEN** an authenticated admin assigns a day outside the owning hike's inclusive date range
- **THEN** the system rejects the save with a validation error
- **AND** it does not alter the note's prior day assignment

### Requirement: Public visibility of hike notes is explicit

The system SHALL expose a hike note publicly only when both its owning hike and the note are published. Public output SHALL be limited to the note title, optional body, coordinate, and deliberate day assignment needed for the hike map.

#### Scenario: Visitor opens a published hike with a published note

- **WHEN** a visitor opens a published hike that has a published note
- **THEN** the public hike map read may include the note only when it has a valid coordinate pair
- **AND** it includes no admin-only lifecycle or audit data

#### Scenario: Visitor opens a published hike with a draft note

- **WHEN** a visitor opens a published hike that has a draft note
- **THEN** the public hike page and map do not reveal that note

#### Scenario: Visitor requests a draft hike with notes

- **WHEN** a visitor attempts to access a draft hike that has notes
- **THEN** the system does not expose the hike or any of its notes through public routes
