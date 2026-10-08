## Purpose

Defines outdoor photo capability: storing first-party image-backed photos, admin management with EXIF/GPS metadata extraction, and keeping public gallery, hike association, album, and map-marker behavior for later slices.

## Requirements

### Requirement: Photo records store core image-backed information

The system SHALL store outdoor photos with title, optional description, publication status, one to three associated image file assets, owner, creation timestamp, and update timestamp.

#### Scenario: Photo has required fields

- **WHEN** an authenticated admin creates a photo with valid title, status, and one to three eligible image file assets
- **THEN** the system stores the photo with those values
- **AND** it records the creating user and timestamps

#### Scenario: Photo requires at least one image

- **WHEN** an authenticated admin submits a photo without an image file asset
- **THEN** the system rejects the save with a validation error
- **AND** it does not create or update the photo

#### Scenario: Photo rejects too many images

- **WHEN** an authenticated admin submits a photo with more than three image file assets
- **THEN** the system rejects the save with a validation error
- **AND** it does not bind the extra image files to the photo

#### Scenario: Photo rejects ineligible file asset

- **WHEN** an authenticated admin submits a photo that references a missing, non-active, non-photo-purpose, or already-bound image file asset
- **THEN** the system rejects the save with a validation error
- **AND** it does not bind the ineligible file to the photo

### Requirement: Admin can manage photos

The system SHALL provide an authenticated admin page for listing, creating, editing, and deleting photo records.

#### Scenario: Admin opens photos page

- **WHEN** an authenticated admin opens `/admin/photos`
- **THEN** the page displays stored photos with title, image count, status, and updated timestamp

#### Scenario: Admin creates photo with image upload

- **WHEN** an authenticated admin uploads one to three valid image files and submits valid new photo fields from the admin UI
- **THEN** the photo appears in the admin photos list
- **AND** the photo references the uploaded image file assets

#### Scenario: Admin edits photo metadata

- **WHEN** an authenticated admin updates editable metadata fields for an existing photo
- **THEN** the system persists the changes
- **AND** it preserves the photo identity and associated image file assets unless the admin changes the image selection

#### Scenario: Admin replaces photo images

- **WHEN** an authenticated admin saves an existing photo with a different eligible image file asset selection
- **THEN** the photo references the new ordered image selection
- **AND** previously referenced file assets are not deleted automatically by this slice

### Requirement: Public trip photo projection derives a capture instant from the linked track when EXIF timezone is missing

The system SHALL compute the photo's public capture instant using, in order: a persisted user/admin normalization, the camera's stored UTC instant (EXIF offset or GPS UTC), the EXIF stored value when the timezone evidence is `UTC_OR_OFFSET`, and a view-time `TRACK_DEFAULT` derivation when the EXIF timezone evidence is `MISSING`, a camera-local wall time is present, and exactly one linked track has a known IANA timezone. The derivation MUST NOT be persisted to the photo's stored metadata.

#### Scenario: Single-track photo with missing EXIF timezone is auto-dated

- **WHEN** a published trip page is rendered for a published trip that has a published photo whose EXIF capture-time evidence is `MISSING` with a camera-local wall time
- **AND** the trip has exactly one linked track with a known IANA timezone
- **THEN** the photo's grid position uses a derived capture instant built from the camera-local wall time and that track's timezone
- **AND** the photo does not display the "Capture date unavailable" badge
- **AND** no new value is written to the photo's stored metadata

#### Scenario: Multi-track photo keeps the badge

- **WHEN** a published trip page is rendered for a published trip that has a published photo whose EXIF capture-time evidence is `MISSING` with a camera-local wall time
- **AND** the trip has zero, or more than one, linked tracks with known IANA timezones
- **THEN** the photo's `captureInstant` is null
- **AND** the photo displays the "Capture date unavailable" badge
- **AND** a timezone confirmation control is available to authorized reviewers

#### Scenario: UTC or offset photo does not need a timezone fallback

- **WHEN** a published trip page is rendered for a published trip that has a published photo whose EXIF capture-time evidence is `UTC_OR_OFFSET` or whose source is `GPS_UTC`
- **THEN** the photo's grid position uses the stored UTC capture time
- **AND** the photo does not display the "Capture date unavailable" badge

### Requirement: Authorized reviewers can confirm and clear a photo's timezone normalization

The system SHALL let an authorized reviewer (trip creator, accepted participant, or administrator) confirm a missing EXIF timezone for a photo by submitting a valid IANA timezone, and SHALL let the same reviewer clear a previously confirmed normalization. The confirm action SHALL require the photo to have `MISSING` EXIF timezone evidence with a camera-local wall time. The clear action SHALL require a normalization to already be present. When the photo has an `INFERRED_TRACK_TIME` map coordinate, either action SHALL reset that coordinate to `PENDING_REVIEW`.

#### Scenario: Reviewer confirms a missing timezone

- **WHEN** an authorized reviewer submits a valid IANA timezone for a photo whose EXIF timezone evidence is `MISSING` with a camera-local wall time
- **THEN** the system stores a `USER_CONFIRMED` normalization with the derived UTC instant
- **AND** it sets any `INFERRED_TRACK_TIME` map coordinate to `PENDING_REVIEW`
- **AND** it revalidates the trip's photo association paths

#### Scenario: Reviewer clears a previously confirmed timezone

- **WHEN** an authorized reviewer clears a photo that has a stored normalization
- **THEN** the system removes the normalization from the photo's stored metadata
- **AND** it sets any `INFERRED_TRACK_TIME` map coordinate to `PENDING_REVIEW`
- **AND** it revalidates the trip's photo association paths

#### Scenario: Clear is a no-op when no normalization is present

- **WHEN** an authorized reviewer attempts to clear a photo that has no stored normalization
- **THEN** the system rejects the action with a safe error
- **AND** it does not modify the photo's stored metadata

#### Scenario: Confirm is rejected when the EXIF already carries a timezone

- **WHEN** an authorized reviewer attempts to confirm a photo whose EXIF timezone evidence is not `MISSING` or which has no camera-local wall time
- **THEN** the system rejects the action with a safe error
- **AND** it does not modify the photo's stored metadata

### Requirement: Trip photo card exposes a dedicated timezone control when a timezone decision is open

The system SHALL render a dedicated timezone control on each public trip photo card whose data layer reports a missing-or-assumed timezone (i.e. `captureTimeAssumption` or `timezoneConfirmationRequired` is set) for authorized reviewers. The control SHALL open a focused dialog with a read-only summary, an `IANA timezone` input, a confirm action, and a clear action whose availability reflects whether a normalization is currently present.

#### Scenario: Card shows the timezone control when fallback is single-track

- **WHEN** a published trip page is rendered for a published trip that has a published photo with `captureTimeAssumption` set
- **AND** the current viewer is the trip creator, an accepted participant, or an administrator
- **THEN** the photo card shows a dedicated timezone control beside the existing EXIF and GPX coordinate controls

#### Scenario: Card hides the timezone control when the timezone is settled

- **WHEN** a published trip page is rendered for a published trip that has a published photo whose EXIF timezone evidence is `UTC_OR_OFFSET`, whose source is `GPS_UTC`, or which has a stored `USER_CONFIRMED` normalization
- **THEN** the photo card does not show the dedicated timezone control
- **AND** the photo does not display the "Capture date unavailable" badge

#### Scenario: Card hides the timezone control for unauthorized viewers

- **WHEN** a published trip page is rendered for a published trip that has a published photo with `captureTimeAssumption` set
- **AND** the current viewer is not the trip creator, an accepted participant, or an administrator
- **THEN** the photo card does not show the dedicated timezone control
- **AND** the photo does not display the "Capture date unavailable" badge (because the single-track fallback is still applied to the public capture instant)
