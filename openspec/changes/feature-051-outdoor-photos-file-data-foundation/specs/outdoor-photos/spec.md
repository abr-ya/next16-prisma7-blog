## Purpose

Defines the first outdoor photo capability: storing first-party image-backed photos, managing them from admin, and keeping public gallery, EXIF, hike association, album, and map-marker behavior for later slices.

## ADDED Requirements

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

#### Scenario: Admin deletes photo

- **WHEN** an authenticated admin deletes a photo
- **THEN** the photo is removed from the admin photos list
- **AND** linked image file assets remain stored unless removed through existing or future file-management workflows

### Requirement: Photos are discoverable in admin navigation

The system SHALL expose the photo admin page through the admin navigation for authenticated admins.

#### Scenario: Admin sees photos navigation item

- **WHEN** an authenticated admin opens the admin area
- **THEN** the admin navigation includes a Photos link that points to `/admin/photos`

### Requirement: Photo publication status is stored without public gallery exposure

The system SHALL store whether a photo is draft or published while keeping public photo browsing out of this slice.

#### Scenario: Admin marks photo as published

- **WHEN** an authenticated admin saves a photo with `PUBLISHED` status
- **THEN** the system stores the status for future public gallery slices
- **AND** it does not add public photo listing or detail pages in this slice

#### Scenario: Visitor cannot browse photos publicly

- **WHEN** a visitor uses existing public navigation or known outdoor routes
- **THEN** the system does not expose a new public `/photos` or `/photos/[slug]` experience from this slice
