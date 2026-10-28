# Spec Delta

## MODIFIED Requirements

### Requirement: Saving the quick upload creates a workout with every derived value filled in

The system SHALL create the workout from the uploaded file alone, SHALL bind it to the dialog's activity type, and SHALL fill the derived values without asking the owner for them.

#### Scenario: Owner saves the quick upload

- **WHEN** a signed-in owner saves the quick upload dialog with a file and a title
- **THEN** the system creates a track that belongs to that owner
- **AND** the track carries the dialog's activity type
- **AND** the track is a workout
- **AND** the track is published
- **AND** the track's distance, duration, and recording start come from the uploaded file
- **AND** the track's slug is unique and is derived from the activity type and the recording date and time

#### Scenario: The owner saves two quick uploads of the same activity type

- **WHEN** a signed-in owner saves two quick uploads that would produce the same slug
- **THEN** the system creates both tracks
- **AND** it gives the second one a distinct slug
- **AND** it refuses neither save

#### Scenario: The owner is not allowed to upload tracks

- **WHEN** a signed-in owner whose account may not upload tracks saves the quick upload dialog
- **THEN** the system creates no track
- **AND** it reports that the account level does not allow the upload
- **AND** it keeps the dialog open with the uploaded file

#### Scenario: The owner's verified track quota is full

- **WHEN** a signed-in owner whose verified track quota is reached saves the quick upload dialog
- **THEN** the system creates no track
- **AND** it reports that the quota is reached

#### Scenario: The owner saves without a file

- **WHEN** a signed-in owner saves the quick upload dialog without a file
- **THEN** the system creates no track
- **AND** it asks for the file

#### Scenario: The owner saves with an empty title

- **WHEN** a signed-in owner clears the title and saves the quick upload dialog
- **THEN** the system refuses the save
- **AND** it creates no track

#### Scenario: The owner chooses gear for the quick upload

- **WHEN** a signed-in owner saves the quick upload dialog with a gear item selected
- **THEN** the system attaches that gear item to the created track
- **AND** it refuses a gear item that belongs to another owner or that does not fit the dialog's activity type

## ADDED Requirements

### Requirement: The quick upload publishes the workout it creates

The system SHALL create the quick upload's track with the published status, so that the workout the owner has just recorded is part of the public site without a second step.

#### Scenario: The saved workout is published

- **WHEN** a signed-in owner saves the quick upload dialog with a file and a title
- **THEN** the system creates the track with the published status
- **AND** the track is listed among the published tracks
- **AND** the public page of that track is reachable by its slug

#### Scenario: The published workout offers no GPX download

- **WHEN** a signed-in owner opens the public page of a track that a quick upload created from a parsed file
- **THEN** the page shows the track's title and its parsed metadata
- **AND** it offers no download of the GPX file
