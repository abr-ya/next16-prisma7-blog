# Spec Delta

## ADDED Requirements

### Requirement: Users can manage their own independent tracks from the public site

The system SHALL provide an authenticated `/my/tracks` page where a signed-in user can view and manage only tracks they own. The page SHALL list each owned track with its title, GPX filename, publication status, updated time, parse state when available, and any current trip association. It SHALL clearly identify tracks that are not attached to a trip.

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

### Requirement: Users can upload an independent GPX track

The My tracks page SHALL let an authenticated user upload one valid GPX file and create a track they own without attaching it to a trip. The created track SHALL use the existing GPX file validation and ownership rules, default to draft visibility unless the user explicitly chooses an allowed publication status, and preserve the existing parsing lifecycle.

#### Scenario: User creates an unlinked track

- **WHEN** a signed-in user uploads an eligible GPX file and submits valid track details from `/my/tracks`
- **THEN** the system creates a track owned by that user
- **AND** the new track has no trip association
- **AND** the track appears in that user's My tracks list

#### Scenario: Upload is invalid or ineligible

- **WHEN** a user submits a missing, invalid, inactive, non-GPX-purpose, or already-bound file asset
- **THEN** the system rejects the creation
- **AND** it does not create a track or bind the file asset to one

### Requirement: Users can perform existing owner-scoped track actions from My tracks

The My tracks page SHALL expose the existing permitted owner actions for an owned track: edit its metadata, replace its GPX file, select its recording timezone, parse or reparse the GPX file, and delete the track with confirmation. Each action SHALL enforce ownership server-side and SHALL preserve existing public visibility, file-lifecycle, and parse-state behavior.

#### Scenario: Owner manages own track

- **WHEN** a signed-in user performs a permitted track action on a track they own from `/my/tracks`
- **THEN** the system applies the action according to the existing track validation rules
- **AND** it refreshes the personal list and any affected existing public or trip views

#### Scenario: User targets another user's track

- **WHEN** a signed-in user attempts a My tracks mutation for a track owned by another user
- **THEN** the system denies the request
- **AND** the other user's track and linked file asset remain unchanged
