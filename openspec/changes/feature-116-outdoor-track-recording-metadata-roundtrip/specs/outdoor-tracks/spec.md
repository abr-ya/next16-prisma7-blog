# Spec Delta

## MODIFIED Requirements

### Requirement: GPX tracks keep parsed times as the source of truth and do not write the new columns

The system SHALL persist `Track.recordingStartAt` and `Track.recordingDurationSeconds` for a track whose `Track.timeSource` is `GPX` whenever the parsed GPX has a usable `summary.time`. The system SHALL set `Track.recordingStartAt` to the absolute instant of `metadata.summary.time.start` and `Track.recordingDurationSeconds` to the integer `metadata.summary.time.durationSeconds` as part of the same `parseTrackGpx` write that already stores `Track.metadata` and re-asserts `Track.timeSource = "GPX"`. When the parsed GPX has no usable `summary.time` (no `<time>` elements), the system SHALL set both columns to `null` and SHALL keep `Track.timeSource = "GPX"`. The system SHALL continue to populate `Track.metadata.summary.time` through the existing `parseTrackGpx` pipeline as the authoritative GPX source; the column values are a column-level mirror of that summary so the public and admin surfaces can read a single field.

#### Scenario: GPX upload leaves the new columns null

- **WHEN** an administrator uploads or re-parses a GPX-backed track whose parsed `metadata.summary.time` is non-null with `start` and `durationSeconds`
- **THEN** the resulting `Track.recordingStartAt` is the absolute instant of `metadata.summary.time.start`
- **AND** `Track.recordingDurationSeconds` equals `metadata.summary.time.durationSeconds`
- **AND** `Track.timeSource` is `GPX`
- **AND** `Track.metadata.summary.time` continues to carry the parsed start, finish, duration, and timezone evidence for that track

#### Scenario: GPX track surfaces read parsed times, not the new columns

- **WHEN** a track has `Track.timeSource = GPX` and the parsed `metadata.summary.time` was `null` (no `<time>` elements)
- **THEN** `Track.recordingStartAt` and `Track.recordingDurationSeconds` are `null`
- **AND** `Track.timeSource` remains `GPX`
- **AND** the public track detail page, public track list card, admin track list row, and trip linked-track card show the existing recording-time "unavailable" fallback for that track
- **AND** they do not render the `Recording start` or `Recording duration` lines for that track

## ADDED Requirements

### Requirement: Owner or admin can edit recordingStartAt and recordingDurationSeconds on a MANUAL track

The system SHALL accept updates to `Track.recordingStartAt`, `Track.recordingDurationSeconds`, and the existing `Track.recordingTimezone` for a track whose `Track.timeSource === "MANUAL"` through a dedicated server action that enforces the same ownership and trust gate the other track mutations already enforce. The system SHALL require a non-empty IANA `recordingTimezone` whenever `recordingStartAt` is supplied and SHALL convert the supplied wall-clock value to a UTC instant through the existing `parseManualTrackStartAt` helper before persisting. The system SHALL accept `recordingDurationSeconds` as a non-negative whole number of seconds and SHALL reject any negative or non-integer value. The system SHALL keep `Track.timeSource` unchanged by this action; the row remains `MANUAL` after the edit. After the write, the system SHALL revalidate the track detail path and the trip detail path for every `HikesToTracks` association, matching the existing `updateTrackRecordingTimezone` action.

#### Scenario: MANUAL edit with both fields writes the columns

- **WHEN** an authenticated owner or administrator submits a valid `recordingStartAt` wall-clock + IANA timezone pair and a valid `recordingDurationSeconds` value for a `MANUAL` track they own through the edit dialog
- **THEN** the system stores the converted `recordingStartAt` UTC instant on the row
- **AND** it stores `recordingDurationSeconds` on the row
- **AND** the row's `timeSource` remains `MANUAL`
- **AND** subsequent reads of the row from the four display surfaces show the new start and duration

#### Scenario: MANUAL edit with start only clears duration

- **WHEN** the owner submits `recordingStartAt` and a timezone, and leaves `recordingDurationSeconds` empty, for a `MANUAL` track they own
- **THEN** the system stores the new `recordingStartAt`
- **AND** it stores `null` for `recordingDurationSeconds`
- **AND** the row's `timeSource` remains `MANUAL`

#### Scenario: MANUAL edit with duration only clears start

- **WHEN** the owner submits `recordingDurationSeconds` and leaves `recordingStartAt` empty, for a `MANUAL` track they own
- **THEN** the system stores the new `recordingDurationSeconds`
- **AND** it stores `null` for `recordingStartAt`
- **AND** the row's `timeSource` remains `MANUAL`

#### Scenario: MANUAL edit rejects unsupported timezone

- **WHEN** the owner submits a `recordingStartAt` wall-clock with a timezone the existing `parseManualTrackStartAt` / `normalizeTrackRecordingTimezone` helpers reject
- **THEN** the system rejects the submission with a localized validation error
- **AND** the row's `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` are unchanged

#### Scenario: MANUAL edit rejects negative or non-integer duration

- **WHEN** the owner submits a `recordingDurationSeconds` value that is negative, non-integer, or otherwise out of the accepted range
- **THEN** the system rejects the submission with a localized validation error
- **AND** no write to the row occurs

#### Scenario: Edit denied for a track the caller does not own

- **WHEN** an authenticated caller who is not the owner of a `MANUAL` track and is not an administrator attempts to call the new server action
- **THEN** the system rejects the request
- **AND** the row is unchanged

#### Scenario: Edit denied for a GPX or NONE track

- **WHEN** an owner or administrator attempts to call the new server action for a track whose `Track.timeSource` is `GPX` or `NONE`
- **THEN** the system rejects the request
- **AND** the row is unchanged
- **AND** the caller is expected to use the existing parse / create / replace-GPX paths for those rows

### Requirement: Track edit dialog reflects and accepts the saved MANUAL or GPX recording metadata

The system SHALL pre-fill the track edit dialog's `Recording start`, `Recording timezone`, and `Recording duration` inputs from the saved `Track` row when an owner or administrator opens the dialog. For a row whose `Track.timeSource === "MANUAL"`, the four inputs SHALL be editable and the submit handler SHALL dispatch the new `updateTrackRecordingMetadata` server action so the values the owner types persist. For a row whose `Track.timeSource === "GPX"`, the four inputs SHALL render read-only with a localized "from file" hint and the submit handler SHALL NOT call the new server action. The system SHALL pre-fill from the saved values for any row regardless of `timeSource` so re-opening a previously edited `MANUAL` row shows the values the owner typed the last time.

#### Scenario: Edit dialog loads saved MANUAL values

- **WHEN** an owner or administrator opens the track edit dialog for a `MANUAL` track that already has `recordingStartAt`, `recordingTimezone`, and `recordingDurationSeconds` set
- **THEN** the `Recording start` input shows the saved wall-clock value in the saved timezone
- **AND** the `Recording timezone` select shows the saved IANA value
- **AND** the `Recording duration` inputs show the saved hours, minutes, and (when applicable) seconds
- **AND** the four inputs are editable

#### Scenario: Edit dialog loads saved GPX values as read-only

- **WHEN** an owner or administrator opens the track edit dialog for a `GPX` track that already has `recordingStartAt`, `recordingTimezone`, and `recordingDurationSeconds` set from a previous parse
- **THEN** the four inputs show the parsed values
- **AND** the four inputs are read-only with a localized "from file" hint
- **AND** submitting the dialog does not call the new server action

#### Scenario: Submitting a MANUAL edit persists the typed values

- **WHEN** an owner or administrator types new values into the four editable inputs on a `MANUAL` track and submits the dialog
- **THEN** the system calls the existing `updateTrack` action for the base fields
- **AND** it calls the new `updateTrackRecordingMetadata` action for the four recording-metadata fields
- **AND** re-opening the dialog on the same row shows the newly typed values

#### Scenario: Re-opening a MANUAL track after save no longer resets the fields

- **WHEN** an owner or administrator closes the edit dialog after a successful `MANUAL` save and re-opens it on the same row
- **THEN** the four inputs show the values that were just saved
- **AND** none of the four fields appear empty or zeroed

#### Scenario: GPX row with no usable parse times shows the unavailable fallback

- **WHEN** an owner or administrator opens the track edit dialog for a `GPX` track whose `recordingStartAt` and `recordingDurationSeconds` are both `null` because the parsed GPX had no `<time>` elements
- **THEN** the four inputs are read-only
- **AND** the `Recording start` and `Recording duration` rows show the existing recording-time "unavailable" fallback instead of empty inputs
