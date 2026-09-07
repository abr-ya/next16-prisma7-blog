## Purpose

Defines Trips as the inclusive domain for city walks, hikes, cycling, water, skiing, and other recorded outings.

## ADDED Requirements

### Requirement: Trips use inclusive public terminology

The system SHALL present the current hike-centered content as Trips in public and admin interfaces, so city walks and non-walking outings are represented without a misleading label.

#### Scenario: Visitor browses trips

- **WHEN** a visitor opens the primary public trips surface
- **THEN** the interface uses Trip terminology and presents existing published records
- **AND** each record retains its type, dates, description, and slug

### Requirement: Trip routes are primary and legacy hike routes remain compatible

The system SHALL use `/trips` and `/admin/trips` as primary routes and SHALL permanently redirect legacy `/hikes` and `/admin/hikes` routes, including detail URLs, to equivalent trip routes.

#### Scenario: Visitor opens a legacy hike URL

- **WHEN** a visitor requests `/hikes` or `/hikes/[slug]`
- **THEN** the system redirects to the equivalent `/trips` route
- **AND** the destination preserves the requested published record and slug

#### Scenario: Admin opens a legacy hikes URL

- **WHEN** an authenticated admin requests `/admin/hikes`
- **THEN** the system redirects to `/admin/trips`
- **AND** the existing authorization boundary remains enforced

### Requirement: Trip domain migration preserves existing data

The system SHALL preserve every existing hike record, linked track/photo/note association, owner, visibility status, timestamp, and public slug while adopting Trip domain names.

#### Scenario: Existing record is read after migration

- **WHEN** a previously stored hike record is read through the Trip domain
- **THEN** it is available as the same Trip record with its existing identity and relationships
- **AND** no data recreation, drop-and-create migration, or bulk content rewrite is required

