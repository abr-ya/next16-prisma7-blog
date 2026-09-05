## ADDED Requirements

### Requirement: Discarded track GPX uploads enter file deletion lifecycle

The system SHALL move GPX file assets uploaded from an admin track modal into the existing pending-delete lifecycle when those uploaded files are discarded before being saved on a track.

#### Scenario: New track upload is discarded

- **WHEN** an authenticated admin uploads a GPX file while creating a track and confirms discarding the modal before saving
- **THEN** the system SHALL mark that unsaved `TRACK_GPX` `FileAsset` as `PENDING_DELETE`
- **AND** it SHALL set `deletedAt` while preserving the database record for audit and future provider cleanup

#### Scenario: Replacement upload is discarded

- **WHEN** an authenticated admin uploads a replacement GPX file while editing an existing track and confirms discarding the modal before saving
- **THEN** the system SHALL mark only the newly uploaded unsaved replacement `FileAsset` as `PENDING_DELETE`
- **AND** the existing track SHALL continue referencing its previously saved GPX file

#### Scenario: Saved track upload is not deleted

- **WHEN** an authenticated admin uploads a GPX file and successfully saves the track with that file selected
- **THEN** the system SHALL NOT mark that saved file asset pending delete as part of modal close handling

#### Scenario: Cleanup is authorized server-side

- **WHEN** a discarded track upload cleanup mutation is submitted
- **THEN** the server SHALL verify the current user has the persisted admin role before changing `FileAsset` lifecycle fields
- **AND** it SHALL only transition active unsaved GPX file assets that are safe to discard

#### Scenario: Cleanup failure is visible

- **WHEN** an admin confirms discard but the uploaded GPX file cannot be marked pending delete
- **THEN** the UI SHALL report the cleanup failure
- **AND** it SHALL avoid silently pretending the uploaded file was removed
