# Spec Delta

## MODIFIED Requirements

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
