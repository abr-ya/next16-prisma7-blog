# Spec Delta

## MODIFIED Requirements

### Requirement: Admin can manage tracks

The system SHALL provide an authenticated admin page for listing, creating, editing, and deleting track records.

#### Scenario: Admin opens tracks page

- **WHEN** an authenticated admin opens `/admin/tracks`
- **THEN** the page displays stored tracks with title, linked GPX file name, status, kind, and updated timestamp

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

#### Scenario: Admin sees the kind of a track

- **WHEN** an authenticated admin views the admin tracks list
- **THEN** each listed track shows whether it is a route or a workout

### Requirement: Users can manage their own independent tracks from the public site

The system SHALL provide an authenticated `/my/tracks` page where a signed-in user can view and manage only tracks they own. The page SHALL list each owned track with its title, GPX filename, publication status, updated time, parse state when available, its kind, and any current trip association. It SHALL clearly identify tracks that are not attached to a trip.

#### Scenario: Owner opens My tracks

- **WHEN** a signed-in user opens `/my/tracks`
- **THEN** the system displays only that user's tracks, including both draft and published records
- **AND** it does not disclose another user's draft track, private file information, or management controls

#### Scenario: User has no tracks

- **WHEN** a signed-in user with no owned tracks opens `/my/tracks`
- **THEN** the system presents an empty state and an action to upload their first GPX track

#### Scenario: Anonymous visitor requests My tracks

- **WHEN** an anonymous visitor requests `/my/tracks`
- **THEN** the system requires authentication
- **AND** it does not render personal track records or upload controls

#### Scenario: Owner sees the kind of each track

- **WHEN** a signed-in user views `/my/tracks`
- **THEN** each listed track shows whether it is a route or a workout
- **AND** a track whose kind was never changed reads as a route

## ADDED Requirements

### Requirement: Owner marks a track as a personal workout

The system SHALL store a kind on every track, either a route or a workout. A track's kind SHALL default to a route, SHALL be settable by the track's owner from the shared track form, and SHALL remain editable afterwards. Both track creation paths — GPX upload and Place on map — SHALL store the kind the owner selected. The kind SHALL be a private classification: it SHALL be visible to the owner and to administrators in the track lists and the track form, and SHALL NOT be rendered on public track pages, public track lists, or trip cards. The kind SHALL NOT by itself restrict which tracks may be attached to a trip.

#### Scenario: Owner marks a track as a workout

- **WHEN** a signed-in user selects the workout kind for a track they own and saves
- **THEN** the system stores the workout kind on that track
- **AND** the track's list row shows it as a workout

#### Scenario: New track defaults to a route

- **WHEN** a track is created without an explicitly selected kind
- **THEN** the system stores the route kind on it

#### Scenario: Both creation paths store the selected kind

- **WHEN** a signed-in user creates a track with the workout kind selected through the GPX upload path or through the Place on map path
- **THEN** the created track carries the workout kind in both cases

#### Scenario: The kind stays private

- **WHEN** a track marked as a workout is published
- **THEN** the public track page and the public track list show no kind badge and no kind wording
- **AND** a trip card that links the track shows no kind wording

#### Scenario: The kind does not restrict trip attachment

- **WHEN** a track marked as a workout is attached to a trip by its owner
- **THEN** the system attaches it under the existing trip track rules
- **AND** it does not reject the attachment because of the kind

### Requirement: My workouts lists only the owner's workouts

The system SHALL provide an authenticated `/my/workouts` page where a signed-in user can view and manage only the tracks they own whose kind is a workout. The page SHALL use the same track management surface as `/my/tracks` and SHALL exclude the owner's routes from the list. A track created from `/my/workouts` SHALL default to the workout kind, and the owner SHALL be able to change it before saving. The page SHALL be reachable from the user menu.

#### Scenario: Owner opens My workouts

- **WHEN** a signed-in user opens `/my/workouts`
- **THEN** the system displays only that user's tracks whose kind is a workout
- **AND** it does not display that user's routes

#### Scenario: Owner creates a track from My workouts

- **WHEN** a signed-in user creates a track from `/my/workouts` without changing the kind
- **THEN** the system stores the workout kind on the new track
- **AND** the new track appears in the owner's workouts list and in the owner's full track list

#### Scenario: Owner has no workouts

- **WHEN** a signed-in user whose tracks are all routes opens `/my/workouts`
- **THEN** the system presents the empty list state
- **AND** the add-track control remains available for creating a workout

#### Scenario: Anonymous visitor requests My workouts

- **WHEN** an anonymous visitor requests `/my/workouts`
- **THEN** the system requires authentication
- **AND** it does not render personal track records
