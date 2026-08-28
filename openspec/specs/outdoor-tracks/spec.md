## Purpose

Defines the first track content capability: storing GPX-backed tracks, managing them from admin, and reserving a metadata shell before public pages, hike associations, GPX parsing, and map rendering are added.

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

#### Scenario: Metadata shell remains empty in foundation slice

- **WHEN** an authenticated admin creates or updates a track in this slice
- **THEN** the system stores a nullable metadata shell
- **AND** it does not populate parsed GPX summary fields in this slice

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
- **AND** it does not expose parsed geometry or map UI in this slice

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
