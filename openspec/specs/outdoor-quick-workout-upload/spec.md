# outdoor-quick-workout-upload Specification

## Purpose

Defines the one-click path that turns a GPX file into a saved workout on the owner's workouts page: a per-activity-type button, a minimal dialog that collects the file, a title and the shoes, and a save that fills every derived value — the activity type, the kind, the status, the unique slug, the parsed metadata and the recording's own timezone.

## Requirements

### Requirement: The quick upload reads the recording's own wall-clock from the file

The quick upload SHALL read the recording's own wall-clock from the uploaded file rather than from the viewer's device, and SHALL store the timezone the file names. A UTC offset in the file names the instant, not the recording's own wall-clock, so a file that names no local offset falls to the device's timezone.

#### Scenario: Preview shows the recording's own time

- **WHEN** a signed-in owner drops a GPX file whose timestamps carry `+03:00` into the quick upload dialog
- **THEN** the preview shows the recording start in that offset
- **AND** it does not show the recording start in the viewer's device timezone

#### Scenario: The suggested title and the slug read the recording's own clock

- **WHEN** the dropped file names a local UTC offset
- **THEN** the suggested title names the part of the day the recording falls in at that offset
- **AND** the proposed slug carries the date and the time at that offset

#### Scenario: The saved track carries the file's timezone

- **WHEN** a signed-in owner saves a quick upload whose file names a local UTC offset
- **THEN** the created track's recording timezone is that offset
- **AND** the surfaces show the recording time in the recording's own local time

#### Scenario: A file with no offset takes the device's timezone

- **WHEN** a signed-in owner saves a quick upload whose file names no local UTC offset
- **THEN** the created track's recording timezone is the timezone of the device the upload was made from
- **AND** the surfaces render the recording start in that timezone

#### Scenario: A file with no offset falls back to the device's own clock

- **WHEN** a signed-in owner drops a GPX file whose timestamps name no local UTC offset
- **THEN** the preview and the suggested title read the device's own local time
- **AND** the saved track carries the device's timezone

### Requirement: The quick upload falls back to the device's timezone

The system SHALL store the timezone of the device the upload was made from as the track's recording timezone when the uploaded file names no local UTC offset — the file's timestamps are then naive wall-clock values, or they are written in UTC, which names the instant and not the wall-clock the owner recorded in. The device that uploaded the file is then the only reference there is. The system SHALL validate that value the way it validates every other recording timezone, and SHALL leave the track's timezone unset when the device names one the system does not support. The file's own local offset SHALL win over the device's timezone whenever the file names one.

#### Scenario: The file's offset wins over the device's timezone

- **WHEN** a signed-in owner saves a quick upload whose file names a local UTC offset
- **THEN** the created track's recording timezone is the file's offset
- **AND** the device's timezone is not stored

#### Scenario: An unsupported device timezone is not stored

- **WHEN** the device the upload is made from reports a timezone the system does not support
- **AND** the uploaded file names no local UTC offset and is not written in UTC
- **THEN** the created track carries no confirmed recording timezone
- **AND** the save succeeds

#### Scenario: A file written in UTC keeps its own zone when the device names none usable

- **WHEN** a signed-in owner saves a quick upload whose file names no local UTC offset and whose timestamps are written in UTC
- **AND** the device the upload is made from reports a timezone the system does not support
- **THEN** the created track carries the file's own UTC as its recording timezone
- **AND** the save succeeds

### Requirement: The owner starts a quick workout upload from a per-activity-type button

The system SHALL offer a quick workout upload on the owner's workouts page, SHALL bind each such button to one activity type, and SHALL open the same dialog for every one of them with that activity type applied.

#### Scenario: Owner opens the quick upload for an activity type

- **WHEN** a signed-in owner clicks the quick upload button for one activity type
- **THEN** the system opens the quick upload dialog
- **AND** the dialog is bound to that activity type
- **AND** the dialog offers no activity type control of its own

#### Scenario: Only activity types with a wording get a button

- **WHEN** the system renders the quick upload buttons
- **THEN** it renders a button only for those active activity types that have a wording entry in the interface language
- **AND** it renders no button for an activity type that has none

#### Scenario: The quick upload button is absent outside the owner's workouts page

- **WHEN** a signed-in owner opens the track workspace or the administrative track workspace
- **THEN** the system renders no quick upload button there

### Requirement: The quick upload dialog collects a file, a title, and an optional gear item

The system SHALL collect the GPX file, the title, and an optional gear item in the quick upload dialog, and SHALL offer no other input.

#### Scenario: Owner picks a GPX file

- **WHEN** a signed-in owner drops a GPX file into the quick upload dialog
- **THEN** the system uploads that file through the shared track upload route
- **AND** it holds the uploaded file for the save

#### Scenario: Owner chooses the gear

- **WHEN** a signed-in owner opens the gear control of the quick upload dialog
- **THEN** the system offers the gear records that belong to that owner and that fit the dialog's activity type
- **AND** it offers a choice of no gear item

#### Scenario: The owner has no gear for the activity type

- **WHEN** a signed-in owner has no gear that fits the dialog's activity type
- **THEN** the system hides the gear control
- **AND** the owner can still save the workout

#### Scenario: The dialog collects nothing else

- **WHEN** the quick upload dialog is open
- **THEN** the system offers no description, status, kind, slug, recording timezone, recording start, or recording duration control

### Requirement: The quick upload suggests the title from the file

The system SHALL suggest a title for the workout from the recording start time found in the uploaded file, using the wording of the dialog's activity type, and SHALL leave the suggested title editable.

#### Scenario: The file carries a recording start

- **WHEN** the uploaded file carries a usable recording start time
- **THEN** the system fills the title with the wording for that part of the day and that activity type
- **AND** it shows the distance, the duration, and the recording start next to the file

#### Scenario: The file carries no recording start

- **WHEN** the uploaded file carries no usable recording start time
- **THEN** the system fills the title with the bare wording of the activity type
- **AND** it does not claim a time of day that the file does not contain

#### Scenario: Owner replaces the suggested title

- **WHEN** a signed-in owner types a different title
- **THEN** the system saves the workout with the typed title
- **AND** the suggestion does not overwrite it

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

### Requirement: The quick upload reuses the shared upload and discard rules

The system SHALL upload the quick upload's file through the shared track upload route, and SHALL mark an uploaded file for deletion when the owner closes the dialog without saving.

#### Scenario: Owner closes the dialog with an uploaded file

- **WHEN** a signed-in owner closes the quick upload dialog that holds an uploaded but unsaved file
- **THEN** the system asks the owner to confirm
- **AND** it marks the uploaded file for deletion once the close is confirmed
- **AND** it creates no track

#### Scenario: Owner cancels the close

- **WHEN** a signed-in owner declines the discard confirmation
- **THEN** the system keeps the dialog open with the uploaded file
- **AND** it creates no track
