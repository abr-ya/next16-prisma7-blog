# Spec Delta

## MODIFIED Requirements

### Requirement: GPX tracks keep parsed times as the source of truth and do not write the new columns

The system SHALL persist `Track.recordingStartAt` and `Track.recordingDurationSeconds` for a track whose `Track.timeSource` is `GPX` whenever the parsed GPX has a usable `summary.time`. The system SHALL set `Track.recordingStartAt` to the absolute instant of `metadata.summary.time.start` and `Track.recordingDurationSeconds` to the integer `metadata.summary.time.durationSeconds` as part of the same `parseTrackGpx` write that already stores `Track.metadata`. When the parsed GPX has no usable `summary.time` (no `<time>` elements), the system SHALL set both columns to `null`. The system SHALL continue to populate `Track.metadata.summary.time` through the existing `parseTrackGpx` pipeline as the authoritative GPX source; the column values are a column-level mirror of that summary so the public and admin surfaces can read a single field.

`parseTrackGpx` SHALL preserve the existing `Track.timeSource` value on every write. The only transition handled by `parseTrackGpx` is `null → "GPX"` (so a fresh row that has never been classified becomes GPX-sourced on first parse); a row whose `Track.timeSource` is already `"MANUAL"` or `"NONE"` keeps that classification through every subsequent (re-)parse, and a misclassified legacy row does not get auto-corrected by `parseTrackGpx`. The only path that reclassifies a row from `"GPX"` to `"MANUAL"` is the explicit owner-driven `markTrackAsManual` server action described below.

#### Scenario: GPX upload leaves the new columns null

- **WHEN** an administrator uploads or re-parses a GPX-backed track whose parsed `metadata.summary.time` is non-null with `start` and `durationSeconds`
- **THEN** the resulting `Track.recordingStartAt` is the absolute instant of `metadata.summary.time.start`
- **AND** `Track.recordingDurationSeconds` equals `metadata.summary.time.durationSeconds`
- **AND** `Track.metadata.summary.time` continues to carry the parsed start, finish, duration, and timezone evidence for that track

#### Scenario: GPX track surfaces read parsed times, not the new columns

- **WHEN** a track has `Track.timeSource = GPX` and the parsed `metadata.summary.time` was `null` (no `<time>` elements)
- **THEN** `Track.recordingStartAt` and `Track.recordingDurationSeconds` are `null`
- **AND** `Track.timeSource` remains `GPX`
- **AND** the public track detail page, public track list card, admin track list row, and trip linked-track card show the existing recording-time "unavailable" fallback for that track
- **AND** they do not render the `Recording start` or `Recording duration` lines for that track

#### Scenario: Re-parse of a MANUAL track keeps timeSource = MANUAL

- **WHEN** an owner or administrator triggers a `parseTrackGpx` re-parse for a track whose `Track.timeSource` is `MANUAL` (for example a legacy `Place on map` track whose synthetic GPX was re-parsed after this slice)
- **THEN** `Track.recordingStartAt` and `Track.recordingDurationSeconds` are overwritten with the freshly parsed values
- **AND** `Track.timeSource` remains `MANUAL`
- **AND** the next read of the four display surfaces keeps the `Source: Manual` badge

#### Scenario: First parse of a never-classified row sets timeSource = GPX

- **WHEN** `parseTrackGpx` runs for a row whose `Track.timeSource` is `null` (a fresh row that has never been classified)
- **THEN** the write sets `Track.timeSource` to `"GPX"` in the same update that stores `Track.metadata`

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

### Requirement: Owner or admin can reclassify a misclassified GPX track to MANUAL

The system SHALL expose a dedicated `markTrackAsManual` server action that an owner or administrator can call for a track whose `Track.timeSource` is currently `"GPX"`. The action SHALL set `Track.timeSource` to `"MANUAL"` and SHALL revalidate the track detail path and the trip detail path for every `HikesToTracks` association, matching the existing `updateTrackRecordingMetadata` revalidation. The action SHALL reject the call with a localized error when the row is already `MANUAL` and SHALL return `NOT_FOUND` for a row the caller does not own. The action SHALL be the only path that transitions a row from `GPX` to `MANUAL`; `parseTrackGpx` never does this automatically. The action SHALL accept the call regardless of whether `recordingStartAt`, `recordingDurationSeconds`, or `recordingTimezone` is populated — the absence of any timed timeline is itself evidence that the row was misclassified as `GPX`, and the owner can supply the missing columns through the edit form after the reclassification.

#### Scenario: Reclassify a legacy misclassified GPX track with metadata to MANUAL

- **WHEN** an owner or administrator calls `markTrackAsManual` for a track whose `Track.timeSource` is `"GPX"` and whose `recordingStartAt` is non-null
- **THEN** the system sets `Track.timeSource` to `"MANUAL"`
- **AND** the row's `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` columns are unchanged
- **AND** the next read of the four display surfaces shows the `Source: Manual` badge
- **AND** the `Recording start` and `Recording duration` lines render for that track

#### Scenario: Reclassify a no-timeline GPX track to MANUAL

- **WHEN** an owner or administrator calls `markTrackAsManual` for a track whose `Track.timeSource` is `"GPX"` and whose `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` are all `null` or empty (the "no timed timeline" case the system already surfaces through the `No timed timeline` badge)
- **THEN** the system sets `Track.timeSource` to `"MANUAL"`
- **AND** the row's `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` remain `null`
- **AND** the next read of the four display surfaces shows the `Source: Manual` badge and the recording-metadata inputs become editable
- **AND** the owner is expected to supply `recordingStartAt` / `recordingTimezone` / `recordingDurationSeconds` through the edit form afterwards

#### Scenario: Reclassify is a no-op when the track is already MANUAL

- **WHEN** an owner or administrator calls `markTrackAsManual` for a track whose `Track.timeSource` is already `"MANUAL"`
- **THEN** the system rejects the call with a localized error
- **AND** no write to the row occurs

#### Scenario: Reclassify denied for a track the caller does not own

- **WHEN** an authenticated caller who is not the owner of the `GPX` track and is not an administrator attempts to call `markTrackAsManual`
- **THEN** the system rejects the request
- **AND** the row is unchanged

### Requirement: Track edit dialog and table row surface a Mark as manual control for misclassified GPX rows

The system SHALL render a `Mark as manual` control in two places for a `GPX` row, gated on complementary predicates that cover the two distinct misclassification cases the system recognizes:

1. Inside the track edit dialog, as a button rendered below the read-only recording-metadata inputs. The button SHALL be visible when `Track.timeSource === "GPX"` AND at least one of `recordingStartAt`, `recordingDurationSeconds`, or `recordingTimezone` is non-null — the "owner supplied timing, but Source is wrong" case (legacy misclassification). The button is hidden for `GPX` rows whose three recording columns are all `null` and for `MANUAL` rows.
2. In the admin tracks table row, as a clickable variant of the existing `Source: …` badge. The badge SHALL be visible as the clickable, warning-styled variant when `Track.timeSource === "GPX"` AND `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` are all `null` or empty — the "no timed timeline" case, where the system already renders the `No timed timeline` fallback. The badge SHALL be the static `secondary` variant for `GPX` rows that have at least one recording column populated (so the table does not double up with the in-dialog button) and for `MANUAL` rows.

Clicking either control SHALL open a `ConfirmDialog` (the same shared dialog component the delete and timezone dialogs already use) with a localized title, description, and confirm button. On confirm, the system SHALL call the `markTrackAsManual` server action described in the previous requirement. On `{ ok: true }` the dialog SHALL close and the track list SHALL refresh with the `Source: Manual` badge. On `{ ok: false }` a localized error toast SHALL surface and the dialog SHALL stay open. The in-dialog button keeps its existing inline-error rendering; the row-level badge keeps its existing `markingAsManualId` pending indicator.

#### Scenario: In-dialog Mark as manual button appears for a misclassified GPX row with metadata

- **WHEN** an owner or administrator opens the track edit dialog for a `GPX` track that has at least one recording-metadata column populated
- **THEN** the `Mark as manual` button is visible below the read-only inputs
- **AND** the four inputs above it stay read-only with the localized "from file" hint

#### Scenario: In-dialog Mark as manual button is hidden for a true GPX row with no metadata

- **WHEN** an owner or administrator opens the track edit dialog for a `GPX` track whose `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` are all `null` or empty
- **THEN** the `Mark as manual` button is not rendered
- **AND** the owner is expected to use the row-level `Source: GPX` badge to reclassify the row, or to supply metadata through the form

#### Scenario: Clicking the in-dialog Mark as manual refreshes the row to MANUAL

- **WHEN** an owner or administrator clicks the in-dialog `Mark as manual` button on a misclassified `GPX` track that has at least one recording column populated
- **THEN** the system calls `markTrackAsManual` for that row
- **AND** on `{ ok: true }` the dialog closes and the track list refreshes with the `Source: Manual` badge
- **AND** on `{ ok: false }` the dialog stays open and a localized error message is rendered next to the button

#### Scenario: Row-level Source: GPX badge is clickable and visually distinct for a no-timeline row

- **WHEN** the admin tracks table renders a `GPX` row whose `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` are all `null` or empty
- **THEN** the `Source: GPX` badge in that row is rendered with the warning-style outline variant (visually distinct from the static `Source: …` badge)
- **AND** the badge is a focusable, keyboard-activatable button with a localized `aria-label`
- **AND** clicking or pressing Enter on the badge opens a `ConfirmDialog` with a localized title, description, and confirm button

#### Scenario: Row-level Source: GPX badge is not clickable for a true GPX row with metadata

- **WHEN** the admin tracks table renders a `GPX` row that has at least one recording-metadata column populated
- **THEN** the `Source: GPX` badge is rendered as the static `secondary` variant
- **AND** the badge has no click handler, no focus ring, and no warning style
- **AND** the owner is expected to reclassify the row through the in-dialog `Mark as manual` button instead

#### Scenario: Row-level Source: GPX badge is not clickable for a MANUAL row

- **WHEN** the admin tracks table renders a `MANUAL` row
- **THEN** the `Source: Manual` badge is rendered as the static `secondary` variant
- **AND** the badge has no click handler, no focus ring, and no warning style

#### Scenario: Confirming the row-level dialog reclassifies the row

- **WHEN** an owner or administrator confirms the `ConfirmDialog` opened by the row-level `Source: GPX` badge
- **THEN** the system calls `markTrackAsManual` for that row
- **AND** on `{ ok: true }` the dialog closes, a localized success toast surfaces, and the track list refreshes with the `Source: Manual` badge
- **AND** on `{ ok: false }` the dialog stays open and a localized error toast surfaces
