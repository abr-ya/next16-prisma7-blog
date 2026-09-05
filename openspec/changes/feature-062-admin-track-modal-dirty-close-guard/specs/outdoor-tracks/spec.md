## ADDED Requirements

### Requirement: Track form modal protects unsaved edits and uploads

The system SHALL prevent accidental dismissal of the admin track create/edit modal when the modal contains unsaved form edits or an unsaved uploaded GPX file.

#### Scenario: Pristine track modal closes normally

- **WHEN** an authenticated admin opens the track create or edit modal and makes no changes
- **THEN** closing the modal through the close button, escape key, or outside interaction closes it without an extra confirmation

#### Scenario: Dirty track modal asks before discard

- **WHEN** an authenticated admin changes any editable track field and then attempts to close the modal without saving
- **THEN** the system SHALL keep the track modal open
- **AND** it SHALL ask the admin to confirm discarding the unsaved changes before closing

#### Scenario: Uploaded GPX file is called out before discard

- **WHEN** an authenticated admin uploads a GPX file in the track modal and then attempts to close the modal before saving the track
- **THEN** the discard confirmation SHALL state that an uploaded GPX file exists and will be removed if the admin discards the modal
- **AND** cancelling the confirmation SHALL keep the modal open with the uploaded file still selected

#### Scenario: Confirmed discard closes modal

- **WHEN** an authenticated admin confirms discarding a dirty track modal
- **THEN** the system SHALL close the modal
- **AND** it SHALL reset unsaved form state so reopening the modal does not show the discarded values

#### Scenario: Successful save bypasses discard guard

- **WHEN** an authenticated admin successfully creates or updates a track from the modal
- **THEN** the modal SHALL close without showing the discard confirmation
- **AND** the saved GPX file SHALL remain attached to the track
