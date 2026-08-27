## Purpose

Defines the first hike content capability: storing hikes, managing them from admin, and showing published hike pages publicly before tracks, photos, maps, and richer outdoor workflows are added.

## ADDED Requirements

### Requirement: Hike records store core trip information

The system SHALL store hikes with title, unique slug, optional description, start date, end date, type, publication status, owner, creation timestamp, and update timestamp.

#### Scenario: Hike has required fields

- **WHEN** an authenticated admin creates a hike with valid title, slug, start date, end date, type, and status
- **THEN** the system stores the hike with those values
- **AND** it records the creating user and timestamps

#### Scenario: Hike date range is invalid

- **WHEN** an authenticated admin submits a hike whose end date is earlier than its start date
- **THEN** the system rejects the save with a validation error
- **AND** it does not persist the invalid date range

#### Scenario: Hike slug conflicts

- **WHEN** an authenticated admin submits a hike slug that is already used by another hike
- **THEN** the system rejects the save with a validation error
- **AND** it preserves the existing hike using that slug

### Requirement: Admin can manage hikes

The system SHALL provide an authenticated admin page for listing, creating, editing, and deleting hike records.

#### Scenario: Admin opens hikes page

- **WHEN** an authenticated admin opens `/admin/hikes`
- **THEN** the page displays stored hikes with title, date range, type, status, and updated timestamp

#### Scenario: Admin creates hike

- **WHEN** an authenticated admin submits a valid new hike from the admin UI
- **THEN** the hike appears in the admin hikes list
- **AND** the admin can continue editing it later

#### Scenario: Admin edits hike

- **WHEN** an authenticated admin updates editable fields for an existing hike
- **THEN** the system persists the changes
- **AND** it preserves the hike identity

#### Scenario: Admin deletes hike

- **WHEN** an authenticated admin deletes a hike
- **THEN** the hike is removed from admin and public hike lists

### Requirement: Public can browse published hikes

The system SHALL provide public hike listing and detail pages that expose only published hikes.

#### Scenario: Visitor opens public hikes listing

- **WHEN** a visitor opens `/hikes`
- **THEN** the page lists published hikes with title, date range, type, and summary text when available

#### Scenario: Visitor opens public hike detail

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike
- **THEN** the page displays the hike title, description when available, date range, and type

#### Scenario: Visitor requests draft hike

- **WHEN** a visitor opens `/hikes/[slug]` for a draft or missing hike
- **THEN** the system returns the same not-found behavior used for unavailable public content

### Requirement: Hikes are discoverable in admin navigation

The system SHALL expose the hike admin page through the admin navigation for authenticated admins.

#### Scenario: Admin sees hikes navigation item

- **WHEN** an authenticated admin opens the admin area
- **THEN** the admin navigation includes a Hikes link that points to `/admin/hikes`
