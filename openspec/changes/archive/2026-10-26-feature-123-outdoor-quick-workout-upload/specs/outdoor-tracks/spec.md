# Spec Delta

## MODIFIED Requirements

### Requirement: Tracks retain a confirmed recording timezone

The system SHALL retain a validated recording timezone for a track's recording-time presentation independently of the timezone of the administrator who later views it. The administration list SHALL show each track's confirmed timezone or clearly identify an unconfirmed legacy value, and SHALL provide an authenticated administrator with a focused action to set or correct the value. The browser's timezone SHALL be offered as an explicit suggestion the administrator may apply; the system SHALL NOT pre-fill the field with it, and SHALL NOT treat it as persisted data without server-side validation.

The focused action SHALL reject an empty, malformed, or unsupported value. The track edit dialog SHALL accept a cleared field as "no confirmed timezone" and SHALL store the track without one.

#### Scenario: Administrator confirms browser-proposed timezone

- **WHEN** an administrator opens the recording-timezone action in a browser that reports a supported IANA timezone
- **THEN** the action offers that timezone as a suggestion the administrator can apply
- **AND** the field starts empty when the track carries no timezone of its own
- **AND** the administrator can explicitly save it for the track

#### Scenario: Administrator selects a different recording timezone

- **WHEN** an administrator sets the timezone for a track whose recording location uses a timezone other than the browser-proposed value
- **THEN** the administrator can select a different supported recording timezone
- **AND** the system persists that selected timezone with the track

#### Scenario: Server rejects an invalid timezone

- **WHEN** a recording-timezone update request contains a malformed or unsupported value
- **THEN** the system rejects the request with a validation error
- **AND** it does not change the track's timezone setting

#### Scenario: Owner clears the recording timezone

- **WHEN** an owner clears the recording-timezone field in the track edit dialog and saves
- **THEN** the system stores no confirmed recording timezone for that track
- **AND** the surfaces fall back to the explicit UTC rendering with the unconfirmed marker

#### Scenario: Existing track lacks a confirmed timezone

- **WHEN** an administrator opens an existing track created before recording-timezone selection was available
- **THEN** the system preserves its GPX metadata and absolute timestamps
- **AND** the administration UI provides the focused timezone action without requiring the administrator to edit GPX or other track fields

### Requirement: Track edit dialog reflects and accepts the saved MANUAL or GPX recording metadata

The system SHALL pre-fill the track edit dialog's `Recording start`, `Recording timezone`, and `Recording duration` inputs from the saved `Track` row when an owner or administrator opens the dialog. For a row whose `Track.timeSource === "MANUAL"`, the four inputs SHALL be editable and the submit handler SHALL dispatch the `updateTrackRecordingMetadata` server action so the values the owner types persist. For a row whose `Track.timeSource === "GPX"`, the recording start and the recording duration SHALL render read-only with a localized "from file" hint, while the `Recording timezone` input SHALL stay editable: a GPX file names a UTC offset rather than a zone, so the timezone is the one recording field the owner owns. For that row the submit handler SHALL NOT call `updateTrackRecordingMetadata` and SHALL call `updateTrackRecordingTimezone` with the timezone the owner typed. The system SHALL pre-fill from the saved values for any row regardless of `timeSource` so re-opening a previously edited `MANUAL` row shows the values the owner typed the last time.

#### Scenario: Edit dialog loads saved MANUAL values

- **WHEN** an owner or administrator opens the track edit dialog for a `MANUAL` track that already has `recordingStartAt`, `recordingTimezone`, and `recordingDurationSeconds` set
- **THEN** the `Recording start` input shows the saved wall-clock value in the saved timezone
- **AND** the `Recording timezone` input shows the saved timezone
- **AND** the `Recording duration` inputs show the saved hours, minutes, and (when applicable) seconds
- **AND** the four inputs are editable

#### Scenario: Edit dialog loads saved GPX values as read-only

- **WHEN** an owner or administrator opens the track edit dialog for a `GPX` track that already has `recordingStartAt`, `recordingTimezone`, and `recordingDurationSeconds` set from a previous parse
- **THEN** the recording start and the recording duration inputs show the parsed values read-only with a localized "from file" hint
- **AND** the `Recording timezone` input shows the saved timezone and stays editable
- **AND** submitting the dialog does not call the `updateTrackRecordingMetadata` action

#### Scenario: Submitting a MANUAL edit persists the typed values

- **WHEN** an owner or administrator types new values into the four editable inputs on a `MANUAL` track and submits the dialog
- **THEN** the system calls the existing `updateTrack` action for the base fields
- **AND** it calls the `updateTrackRecordingMetadata` action for the four recording-metadata fields
- **AND** re-opening the dialog on the same row shows the newly typed values

#### Scenario: Submitting a GPX edit persists the typed timezone

- **WHEN** an owner or administrator types a different recording timezone into a `GPX` track's edit dialog and submits the dialog
- **THEN** the system calls the `updateTrackRecordingTimezone` action with that timezone
- **AND** the recording start and the recording duration stay unchanged
- **AND** the surfaces show the recording time in the newly saved timezone

#### Scenario: Re-opening a MANUAL track after save no longer resets the fields

- **WHEN** an owner or administrator closes the edit dialog after a successful `MANUAL` save and re-opens it on the same row
- **THEN** the four inputs show the values that were just saved
- **AND** none of the four fields appear empty or zeroed

#### Scenario: GPX row with no usable parse times shows the unavailable fallback

- **WHEN** an owner or administrator opens the track edit dialog for a `GPX` track whose `recordingStartAt` and `recordingDurationSeconds` are both `null` because the parsed GPX had no `<time>` elements
- **THEN** the recording start and the recording duration are read-only
- **AND** the `Recording start` and `Recording duration` rows show the existing recording-time "unavailable" fallback instead of empty inputs

### Requirement: My workouts lists only the owner's workouts

The system SHALL provide an authenticated `/my/workouts` page where a signed-in user can view and manage only the tracks they own whose kind is a workout. The page SHALL use the same track management surface as `/my/tracks` and SHALL exclude the owner's routes from the list. The page SHALL render a short owner-side table rather than the full admin column set: each listed workout SHALL show its badges, title, start date, the recording timezone, distance, the recording duration, and its activity type, and the row SHALL keep the edit and delete actions. A value the track does not carry SHALL read as empty rather than as a zero. A track created from `/my/workouts` SHALL default to the workout kind, and the owner SHALL be able to change it before saving. The page SHALL be reachable from the user menu.

#### Scenario: Owner opens My workouts

- **WHEN** a signed-in user opens `/my/workouts`
- **THEN** the system displays only that user's tracks whose kind is a workout
- **AND** it does not display that user's routes

#### Scenario: Owner reads the workout list

- **WHEN** a signed-in user views the workouts list
- **THEN** each listed workout shows its badges, title, start date, the recording timezone, distance, the recording duration, and its activity type
- **AND** the row offers the edit and delete actions
- **AND** a workout without a recorded start or without a parsed distance shows an empty value in that column

#### Scenario: Owner reads the recording timezone of a workout

- **WHEN** a signed-in user views the workouts list
- **THEN** each listed workout shows the timezone its recording was made in
- **AND** the start date in the same row is rendered in that timezone
- **AND** a workout without a confirmed timezone shows the explicit UTC fallback with the unconfirmed marker

#### Scenario: Owner reads the recording duration of a workout

- **WHEN** a signed-in user views the workouts list
- **THEN** each listed workout shows how long its recording lasted
- **AND** a workout without a recorded duration shows an empty value in that column

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

## ADDED Requirements

### Requirement: A parsed GPX file's own UTC offset becomes the track's recording timezone

The system SHALL read the UTC offset that a parsed GPX file's own timestamps carry and SHALL store it as the track's recording timezone when the track has no confirmed timezone of its own. The offset is the recording's own wall-clock — a file written in Moscow carries `+03:00` in every `<time>` — and the normalized GPX instants keep no offset, so the file is the only place it survives. The system SHALL NOT overwrite a timezone the owner has already confirmed, and SHALL NOT give a manually-sourced track a timezone it never had.

#### Scenario: Parsing a Moscow recording stores the offset

- **WHEN** the system parses a GPX file whose `<time>` values carry `+03:00` for a track that has no confirmed recording timezone
- **THEN** the track's recording timezone becomes `+03:00`
- **AND** the surfaces render the recording start in that offset

#### Scenario: A confirmed timezone survives a re-parse

- **WHEN** the system re-parses the file of a track whose recording timezone the owner has already confirmed
- **THEN** the confirmed timezone stays as it is
- **AND** the file's offset does not replace it

#### Scenario: A file with no offset leaves the timezone unset

- **WHEN** the system re-parses a GPX file from the track form whose `<time>` values name no offset
- **THEN** the track keeps no confirmed recording timezone
- **AND** the surfaces show the explicit UTC fallback with the unconfirmed marker

#### Scenario: A manual track is not given a timezone by a parse

- **WHEN** the system parses the file of a track whose `timeSource` is `MANUAL`
- **THEN** the track's recording timezone is not changed by that parse

### Requirement: A fixed UTC offset is a valid recording timezone

The system SHALL accept a fixed UTC offset as a recording timezone. The canonical form SHALL be `+HH:MM` or `-HH:MM`, and the system SHALL accept the equivalent `UTC+HH:MM` and `+HHMM` spellings and canonicalise them to that form. A track whose recording timezone is a fixed offset SHALL render its recording times in that offset and SHALL identify the offset in the surfaces that show the timezone. The system SHALL continue to accept every IANA timezone name it accepted before, and SHALL keep the explicit UTC fallback for a track with no confirmed timezone.

#### Scenario: Fixed offset is accepted and canonicalised

- **WHEN** a recording-timezone update carries `UTC+03:00`
- **THEN** the system accepts the value
- **AND** it stores the canonical form `+03:00`

#### Scenario: Fixed offset renders the recording's own time

- **WHEN** a track has recording timezone `+03:00` and a recording start instant of `2026-10-26T05:30:00Z`
- **THEN** the surfaces render the recording start as 08:30 on 26 October 2026
- **AND** the timezone is shown as `UTC+03:00`
- **AND** the rendered value does not change when the track is viewed from a browser or server in another timezone

#### Scenario: An IANA timezone keeps working

- **WHEN** a recording-timezone update carries `Europe/Sofia`
- **THEN** the system stores `Europe/Sofia`
- **AND** the surfaces render the recording time in that zone

#### Scenario: An unsupported value is rejected

- **WHEN** a recording-timezone update carries `Not/A-Timezone`
- **THEN** the system rejects the request with a validation error
- **AND** it does not change the track's timezone setting
