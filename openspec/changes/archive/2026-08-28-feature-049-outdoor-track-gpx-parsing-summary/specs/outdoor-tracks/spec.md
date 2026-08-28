## ADDED Requirements

### Requirement: Tracks store parsed GPX summary metadata
The system SHALL parse eligible GPX-backed tracks into stored summary metadata that can be read without reparsing the uploaded GPX file during normal admin or public page rendering.

#### Scenario: Admin parses a valid GPX track
- **WHEN** an authenticated admin parses a track whose linked active `TRACK_GPX` file contains valid GPX track geometry
- **THEN** the system stores parsed metadata for the track
- **AND** the metadata includes parse status, parser version, parsed timestamp, source file identity, distance, bounds, elevation range when elevation exists, time range when timestamps exist, and point counts

#### Scenario: GPX has no elevation or timestamps
- **WHEN** an authenticated admin parses a valid GPX file that has coordinates but omits elevation or timestamp values
- **THEN** the system stores available geometry, distance, bounds, and point counts
- **AND** it leaves unavailable elevation or time summary fields empty instead of failing the parse

#### Scenario: Track uses stored parsed metadata
- **WHEN** an admin or visitor opens a track page after that track has parsed metadata
- **THEN** the system reads the stored summary metadata
- **AND** it does not parse the raw GPX file as part of the page request

### Requirement: Tracks store simplified map-ready geometry
The system SHALL store simplified map-ready geometry for parsed GPX tracks so a later public map component can render a lightweight polyline without reading the raw GPX file.

#### Scenario: Valid GPX creates map geometry
- **WHEN** an authenticated admin parses a track with valid GPX coordinate geometry
- **THEN** the system stores simplified map geometry for that track
- **AND** the geometry preserves route order, start point, end point, and track bounds
- **AND** the geometry contains fewer or equal coordinate points than the parsed source geometry

#### Scenario: Small GPX still creates usable geometry
- **WHEN** an authenticated admin parses a GPX file whose coordinate count is already small enough for public rendering
- **THEN** the system may store geometry with the original coordinate count
- **AND** it still records both source point count and rendered geometry point count

#### Scenario: Future map reads no raw file URLs
- **WHEN** public track data includes map-ready geometry
- **THEN** the public data SHALL NOT expose private provider URLs or raw GPX file URLs
- **AND** it SHALL expose only the stored geometry and visibility-safe track metadata needed for rendering

### Requirement: Track parse lifecycle is visible and retryable in admin
The system SHALL make GPX parse state visible to administrators and allow failed or stale parses to be retried without changing the track identity.

#### Scenario: Admin sees parsed track state
- **WHEN** an authenticated admin views `/admin/tracks` or a track edit surface for a parsed track
- **THEN** the UI displays that parsing succeeded
- **AND** it shows useful summary values such as distance, point count, and parsed timestamp when available

#### Scenario: Admin sees failed parse state
- **WHEN** a track parse fails because the linked file cannot be fetched, is not valid GPX XML, or contains no usable coordinates
- **THEN** the system records a failed parse state with a safe error message
- **AND** the admin UI displays the failure without exposing private provider details

#### Scenario: Admin retries parse
- **WHEN** an authenticated admin retries parsing for a track with failed or stale parsed metadata
- **THEN** the system attempts to parse the track's current linked GPX file
- **AND** it replaces the previous parse state with the latest success or failure result

#### Scenario: Replacing GPX marks metadata stale
- **WHEN** an authenticated admin replaces the GPX file linked to an existing track
- **THEN** the system SHALL prevent the old parsed metadata from being treated as current for the new file
- **AND** the admin UI SHALL make the track's parse state indicate that parsing is needed or pending

### Requirement: Public track pages show parsed summaries without map UI
The system SHALL show parsed GPX summary information on public track pages for published tracks when parsed metadata is available, while keeping map rendering out of this slice.

#### Scenario: Visitor sees parsed summary
- **WHEN** a visitor opens `/tracks/[slug]` for a published track with successful parsed metadata
- **THEN** the page displays visibility-safe summary values such as distance, elevation range when available, time range when available, and point counts
- **AND** it does not render an interactive map

#### Scenario: Visitor sees unparsed fallback
- **WHEN** a visitor opens `/tracks/[slug]` for a published track without successful parsed metadata
- **THEN** the page still displays the existing track metadata and GPX download availability
- **AND** it does not fail because parsed metadata is missing

#### Scenario: Draft tracks remain private
- **WHEN** a visitor requests a draft track that has parsed metadata
- **THEN** the system responds as not found
- **AND** it does not expose the parsed summary or map-ready geometry
