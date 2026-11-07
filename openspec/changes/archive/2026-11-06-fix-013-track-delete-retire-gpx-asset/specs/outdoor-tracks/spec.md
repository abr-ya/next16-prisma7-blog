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

- **WHEN** an authenticated admin deletes a track, or an owner deletes a track they own
- **THEN** the track is removed from the track list
- **AND** when the track owns its GPX file, that file asset is retired as `PENDING_DELETE` in the same transaction
- **AND** the retired file's direct download URL stops serving it
- **AND** a route-based track leaves the route's GPX file untouched

#### Scenario: Admin sees the kind of a track

- **WHEN** an authenticated admin views the admin tracks list
- **THEN** each listed track shows whether it is a route or a workout
