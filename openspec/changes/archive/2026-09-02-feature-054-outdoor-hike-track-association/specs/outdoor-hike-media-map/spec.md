## MODIFIED Requirements

### Requirement: Admin can associate tracks with hikes

The system SHALL allow authenticated admins to attach and detach track records to hike records without changing the track identity, hike identity, linked GPX file asset, or stored parsed track metadata.

#### Scenario: Admin attaches a track to a hike

- **WHEN** an authenticated admin selects an existing track for an existing hike and saves the association
- **THEN** the track is associated with that hike
- **AND** the track remains manageable as its own track record
- **AND** the hike remains manageable as its own hike record

#### Scenario: Admin detaches a track from a hike

- **WHEN** an authenticated admin removes an existing hike-track association
- **THEN** the track is no longer displayed as part of that hike
- **AND** the track record and its linked GPX file asset are preserved
- **AND** the hike record is preserved

#### Scenario: Admin views associated tracks from a hike

- **WHEN** an authenticated admin opens a hike management surface for a hike with associated tracks
- **THEN** the admin can see which tracks are associated with that hike
- **AND** the admin can distinguish draft and published associated tracks

#### Scenario: Admin views associated hikes from a track

- **WHEN** an authenticated admin opens a track management surface for a track associated with one or more hikes
- **THEN** the admin can see which hikes are associated with that track
- **AND** the admin can distinguish draft and published associated hikes

#### Scenario: Admin attaches the same track twice

- **WHEN** an authenticated admin attempts to attach a track to a hike that already has that track association
- **THEN** the system keeps only one association for that hike and track pair
- **AND** it does not duplicate public or admin linked-track output

#### Scenario: Non-admin attempts to manage track associations

- **WHEN** a signed-in non-admin or anonymous visitor attempts to attach or detach tracks from a hike
- **THEN** the system rejects the request
- **AND** the hike-track associations remain unchanged

#### Scenario: Draft track is linked to published hike

- **WHEN** a published hike has an associated draft track
- **THEN** public hike pages SHALL NOT expose that draft track
- **AND** admin hike surfaces may still show the association to authenticated admins

#### Scenario: Published track is linked to draft hike

- **WHEN** a published track is associated with a draft hike
- **THEN** public track pages SHALL NOT expose that draft hike
- **AND** admin track surfaces may still show the association to authenticated admins

## ADDED Requirements

### Requirement: Public hike pages show linked published tracks

The system SHALL show associated published tracks on published hike detail pages while preserving existing track visibility and file download boundaries.

#### Scenario: Visitor opens hike with linked published tracks

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has associated published tracks
- **THEN** the page shows those linked tracks within the hike detail experience
- **AND** each linked track provides enough visibility-safe information to open the public track detail page

#### Scenario: Visitor opens hike with no public linked tracks

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has no associated published tracks
- **THEN** the page remains usable with the hike's own title, description, date range, and type
- **AND** it does not show broken linked-track controls

#### Scenario: Linked track file is not public-download eligible

- **WHEN** a published hike has an associated published track whose GPX file is private or inactive
- **THEN** the public hike page may still link to the public track detail page when the track itself is published
- **AND** it does not expose a direct GPX provider URL or bypass the existing track download rules

### Requirement: Public track pages show linked published hikes

The system SHALL show associated published hikes on published track detail pages without exposing draft hikes or private hike metadata.

#### Scenario: Visitor opens track with linked published hikes

- **WHEN** a visitor opens `/tracks/[slug]` for a published track that is associated with one or more published hikes
- **THEN** the page shows links to those published hikes
- **AND** each linked hike provides enough visibility-safe information to open the public hike detail page

#### Scenario: Visitor opens track with no public linked hikes

- **WHEN** a visitor opens `/tracks/[slug]` for a published track that has no associated published hikes
- **THEN** the page remains usable with the existing track detail content
- **AND** it does not show broken linked-hike controls
