## Purpose

Defines the first hike content capability: storing hikes, managing them from admin, and showing published hike pages publicly before tracks, photos, maps, and richer outdoor workflows are added.

## Requirements

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

### Requirement: Public hike detail uses a wide content container

The system SHALL render published hike detail pages in a wide content container so the route map, linked-track list, and photo gallery can use more horizontal space than the default public prose column, while keeping the hike title, type, date range, and description on a narrower readable measure.

#### Scenario: Visitor opens hike detail with map and photos

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that shows a route map or a photo gallery
- **THEN** the map and photo gallery occupy the wide hike-detail content container
- **AND** that container is wider than the default public prose column used for title and description
- **AND** the hike title, type, date range, and description remain on the narrower readable measure

#### Scenario: Visitor opens hike detail without map or photos

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has no route map and no photo gallery
- **THEN** the page remains usable with title, type, date range, and description on the narrower readable measure
- **AND** it does not show an empty wide media shell

#### Scenario: Other public pages keep the default prose column

- **WHEN** a visitor opens a public page that is not `/hikes` or `/hikes/[slug]`
- **THEN** that page keeps the default public prose column
- **AND** it does not inherit the wide hike content container

### Requirement: Public hike listing uses the wide content container

The system SHALL render the public hike listing in the same wide content container as hike detail and show published hike cards in up to three columns on medium-or-wider viewports.

#### Scenario: Visitor opens hike listing with published hikes

- **WHEN** a visitor opens `/hikes` and at least one published hike exists
- **THEN** the listing occupies the wide content container
- **AND** hike cards show up to three cards per row on a medium-or-wider viewport
- **AND** a narrow viewport still stacks those cards in a single column

#### Scenario: Visitor opens empty hike listing

- **WHEN** a visitor opens `/hikes` and no published hikes exist
- **THEN** the page remains usable with the empty-state message in the wide content container
