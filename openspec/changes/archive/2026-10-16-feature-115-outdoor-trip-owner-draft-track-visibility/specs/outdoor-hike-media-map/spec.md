# Spec Delta

## Purpose

Extends the `outdoor-hike-media-map` capability so the trip creator (or an administrator) can see their own `DRAFT` tracks on the public trip page, while every other viewer continues to see only `PUBLISHED` tracks.

## MODIFIED Requirements

### Requirement: Public hike pages show linked published tracks

The system SHALL show associated published tracks on published hike detail pages, AND SHALL additionally show the trip creator's draft tracks to the trip creator or to an authenticated administrator, while preserving existing track visibility and file download boundaries.

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

#### Scenario: Trip creator sees their own draft tracks on the trip page

- **WHEN** the signed-in trip creator opens `/trips/[slug]` for a published hike that has one or more `DRAFT` tracks whose `Track.userId` equals the trip's `Hike.userId`
- **THEN** the page shows those draft tracks alongside the published tracks in the linked-track list
- **AND** the page renders those draft tracks on the trip map
- **AND** each draft row is visually distinguished by a `Draft` badge and a muted style that does not visually compete with a `PUBLISHED` row
- **AND** each draft row remains clickable to the public track detail page so the creator can verify the saved geometry

#### Scenario: Administrator sees the trip creator's draft tracks

- **WHEN** an authenticated administrator (not the trip creator) opens `/trips/[slug]` for a published hike that has one or more `DRAFT` tracks whose `Track.userId` equals the trip's `Hike.userId`
- **THEN** the page shows those draft tracks in the same way it does for the creator
- **AND** it does NOT show draft tracks owned by any other user

#### Scenario: Non-owner viewer does not see draft tracks

- **WHEN** a signed-in viewer who is neither the trip creator nor an administrator (including accepted participants) opens `/trips/[slug]`
- **THEN** the page shows only the published tracks associated with the trip
- **AND** it never renders another user's draft tracks

#### Scenario: Anonymous viewer does not see draft tracks

- **WHEN** an anonymous viewer opens `/trips/[slug]`
- **THEN** the page shows only the published tracks associated with the trip
- **AND** it never renders any draft tracks

#### Scenario: Trip creator's draft tracks preserve existing file download boundaries

- **WHEN** the trip creator opens `/trips/[slug]` and one of their own `DRAFT` tracks references a `FileAsset` that is `PRIVATE` or not `ACTIVE`
- **THEN** the draft row is still rendered in the linked-track list and on the map with the `Draft` badge
- **AND** no direct GPX provider URL is exposed on the public trip page
- **AND** the existing public track detail page download rules are preserved when the owner opens `/tracks/[slug]`

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
- **THEN** public hike pages SHALL NOT expose that draft track to anonymous viewers or to signed-in viewers who are neither the trip creator nor an administrator
- **AND** public hike pages SHALL additionally expose the trip creator's own draft tracks to the trip creator and to authenticated administrators, with a `Draft` badge and muted style
- **AND** admin hike surfaces may still show the association to authenticated admins

#### Scenario: Published track is linked to draft hike

- **WHEN** a published track is associated with a draft hike
- **THEN** public track pages SHALL NOT expose that draft hike
- **AND** admin track surfaces may still show the association to authenticated admins
