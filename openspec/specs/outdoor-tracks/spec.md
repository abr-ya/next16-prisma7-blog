## Purpose

Defines the track content capability: storing GPX-backed tracks, managing them from admin, exposing published track pages publicly, and storing parsed GPX summaries with simplified map-ready geometry before interactive map rendering is added.

## Requirements

### Requirement: Track records store core GPX-backed information

The system SHALL store tracks with title, unique slug, optional description, publication status, required GPX file asset reference, nullable metadata shell, owner, creation timestamp, and update timestamp.

#### Scenario: Track has required fields

- **WHEN** an authenticated admin creates a track with valid title, slug, status, and an eligible GPX file asset reference
- **THEN** the system stores the track with those values
- **AND** it records the creating user and timestamps

#### Scenario: Track slug conflicts

- **WHEN** an authenticated admin submits a track slug that is already used by another track
- **THEN** the system rejects the save with a validation error
- **AND** it preserves the existing track using that slug

#### Scenario: Track requires a GPX file asset

- **WHEN** an authenticated admin submits a track without a GPX file asset reference
- **THEN** the system rejects the save with a validation error
- **AND** it does not create or update the track

#### Scenario: Track rejects ineligible file asset

- **WHEN** an authenticated admin submits a track that references a missing, non-active, non-GPX-purpose, or already-bound file asset
- **THEN** the system rejects the save with a validation error
- **AND** it does not bind the ineligible file to the track

#### Scenario: Track can start without parsed metadata

- **WHEN** an authenticated admin creates or updates a track before GPX parsing succeeds
- **THEN** the system allows the track metadata shell to remain empty or unparsed
- **AND** later parse actions can populate parsed GPX summary fields

#### Scenario: Published track is eligible for public track pages

- **WHEN** a track has `PUBLISHED` status
- **THEN** the system MAY expose its visibility-safe metadata on public track pages
- **AND** public pages SHALL NOT expose private GPX provider URLs

### Requirement: Admin can manage tracks

The system SHALL provide an authenticated admin page for listing, creating, editing, and deleting track records.

#### Scenario: Admin opens tracks page

- **WHEN** an authenticated admin opens `/admin/tracks`
- **THEN** the page displays stored tracks with title, linked GPX file name, status, and updated timestamp

#### Scenario: Admin creates track with GPX upload

- **WHEN** an authenticated admin uploads a valid GPX file and submits valid new track fields from the admin UI
- **THEN** the track appears in the admin tracks list
- **AND** the track references the uploaded GPX file asset

#### Scenario: Admin edits track metadata

- **WHEN** an authenticated admin updates editable metadata fields for an existing track
- **THEN** the system persists the changes
- **AND** it preserves the track identity

#### Scenario: Admin replaces track GPX file

- **WHEN** an authenticated admin uploads a new valid GPX file for an existing track and saves the change
- **THEN** the track references the new GPX file asset
- **AND** the previous file asset is not deleted automatically by this slice

#### Scenario: Admin deletes track

- **WHEN** an authenticated admin deletes a track
- **THEN** the track is removed from the admin tracks list
- **AND** the linked GPX file asset remains stored unless removed through existing file-management workflows

### Requirement: Tracks are discoverable in admin navigation

The system SHALL expose the track admin page through the admin navigation for authenticated admins.

#### Scenario: Admin sees tracks navigation item

- **WHEN** an authenticated admin opens the admin area
- **THEN** the admin navigation includes a Tracks link that points to `/admin/tracks`

### Requirement: Public can browse published tracks

The system SHALL provide public track listing and detail pages that expose only published tracks.

#### Scenario: Visitor opens public track listing

- **WHEN** a visitor opens `/tracks`
- **THEN** the page lists published tracks
- **AND** it does not list draft tracks

#### Scenario: Visitor opens public track detail

- **WHEN** a visitor opens `/tracks/[slug]` for a published track
- **THEN** the page displays the track title, description when present, linked GPX filename, file size, and updated timestamp
- **AND** it does not render interactive map UI

#### Scenario: Visitor opens missing or draft track detail

- **WHEN** a visitor opens `/tracks/[slug]` for a missing or draft track
- **THEN** the system responds as not found

### Requirement: Public track GPX downloads respect file visibility

The system SHALL expose GPX download links on public track pages only when the linked GPX file asset is active and public-download eligible.

#### Scenario: Published track has public GPX file

- **WHEN** a published track references an active GPX file asset with `PUBLIC` or `UNLISTED` visibility
- **THEN** the public track detail page shows a GPX download link through an app-owned file route
- **AND** it does not link directly to the provider URL

#### Scenario: Published track has private GPX file

- **WHEN** a published track references an active GPX file asset with `PRIVATE` visibility
- **THEN** the public track detail page shows that the GPX download is unavailable
- **AND** it does not expose a download link or provider URL

#### Scenario: Published track has inactive GPX file

- **WHEN** a published track references a GPX file asset that is not active
- **THEN** the public track detail page shows that the GPX download is unavailable
- **AND** it does not expose a download link or provider URL

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
