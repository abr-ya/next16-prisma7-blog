# Spec Delta

## ADDED Requirements

### Requirement: Track records may store optional manual time metadata

The system SHALL let a `Track` row additionally store an optional `recordingStartAt` (DateTime?), an optional `recordingDurationSeconds` (Int? stored as whole seconds), and a `timeSource` enum value drawn from `{ GPX, MANUAL, NONE }`. The system SHALL set `timeSource = GPX` for any track whose file asset was created by an uploaded GPX — including the initial upload and any future re-parse through the existing `parseTrackGpx` pipeline. The system SHALL set `timeSource = MANUAL` when the row was created from the `Place on map` tab and the creator supplied at least one of `recordingStartAt` or `recordingDurationSeconds`. The system SHALL set `timeSource = NONE` when the row was created from the `Place on map` tab and the creator supplied neither.

#### Scenario: GPX-backed track gets timeSource GPX on parse

- **WHEN** an administrator parses or re-parses a track whose `Track.fileAssetId` was created through the `Upload GPX` tab
- **THEN** the system stores `timeSource = GPX` on the track row alongside the existing parsed metadata
- **AND** the resulting public and admin summary surfaces identify the row as `GPX`-sourced

#### Scenario: GPX-backed track with no timestamps still gets timeSource GPX

- **WHEN** a GPX-backed track has coordinates but no `<time>` elements
- **THEN** `timeSource` is still `GPX`
- **AND** the existing recording-time "unavailable" fallback remains in place for the start/finish display

#### Scenario: Manual track with start and duration gets timeSource MANUAL

- **WHEN** a verified, trusted, or administrator viewer submits the `Place on map` tab with both `recordingStartAt` and `recordingDurationSeconds` filled
- **THEN** the system stores both values on the new track row
- **AND** it sets `timeSource = MANUAL`
- **AND** the resulting summary surfaces identify the row as `MANUAL`-sourced

#### Scenario: Manual track with only recording start gets timeSource MANUAL

- **WHEN** a viewer submits the `Place on map` tab with `recordingStartAt` filled and `recordingDurationSeconds` empty
- **THEN** the system stores the start value
- **AND** it stores null for `recordingDurationSeconds`
- **AND** it sets `timeSource = MANUAL`

#### Scenario: Manual track with neither start nor duration gets timeSource NONE

- **WHEN** a viewer submits the `Place on map` tab with both fields empty
- **THEN** the system stores null for both columns
- **AND** it sets `timeSource = NONE`
- **AND** the resulting summary surfaces identify the row as `NONE`-sourced

#### Scenario: Existing activityTypeId and recordingTimezone columns remain independent

- **WHEN** a viewer fills activity type only on the `Place on map` tab
- **THEN** the system stores the activity type and leaves `recordingStartAt` and `recordingDurationSeconds` null
- **AND** it sets `timeSource = NONE` because no timeline source was supplied

### Requirement: Place on map tab accepts four optional metadata fields

The system SHALL let the viewer fill four optional metadata fields on the `Place on map` tab inside `TrackFormDialog`: an activity-type select, a recording-start datetime input paired with an IANA recording-timezone select, a recording-duration input with a default `HH:MM` precision and an explicit "include seconds" toggle that switches the input to `HH:MM:SS` precision, and a read-only display of the derived `timeSource`. The system SHALL reuse the existing `getActiveTrackActivityTypes` helper for the activity-type select, the existing `lib/track-recording-timezone` helpers for the timezone select, and the existing `formatTrackDuration` helper for any display formatting. The system SHALL store `recordingDurationSeconds` as a whole-second `Int` regardless of the visible precision. The four fields SHALL render inside the existing `TrackEditor` `renderFormFields` slot, alongside the existing title/slug/description/status fields, on both `/admin/tracks` and `/my/tracks`.

#### Scenario: Activity-type select lists only active types with an Unclassified option

- **WHEN** a viewer opens the activity-type select on the `Place on map` tab
- **THEN** the dropdown shows every `TrackActivityType` row with `isActive = true`
- **AND** it shows an explicit "Unclassified" option at the top of the list
- **AND** selecting a type stores its `id` on `Track.activityTypeId`
- **AND** selecting "Unclassified" stores `null` on `Track.activityTypeId`
- **AND** the localized label uses the existing `nameEn` / `nameRu` resolution from feature-101

#### Scenario: Recording-start input accepts a datetime and IANA timezone

- **WHEN** a viewer enters a wall-clock datetime and an IANA timezone in the recording-start fields
- **THEN** the system converts the wall-clock value to a UTC instant using the selected timezone
- **AND** it stores the UTC instant on `Track.recordingStartAt`
- **AND** it stores the validated timezone on the existing `Track.recordingTimezone` column through `normalizeTrackRecordingTimezone`

#### Scenario: Recording-start with unsupported timezone is rejected

- **WHEN** a viewer submits a recording-start pair with a timezone the `normalizeTrackRecordingTimezone` helper rejects
- **THEN** the system rejects the submission with a localized validation message
- **AND** no `Track` or `FileAsset` row is created

#### Scenario: Duration default precision is HH:MM

- **WHEN** the viewer opens the duration input for the first time on a fresh `Place on map` tab
- **THEN** the input renders two numeric fields (hours and minutes) and stores `recordingDurationSeconds` as `(hours * 3600) + (minutes * 60)` on submit

#### Scenario: Duration with "include seconds" toggled on becomes HH:MM:SS

- **WHEN** the viewer toggles the "include seconds" switch on
- **THEN** the input renders three numeric fields (hours, minutes, seconds)
- **AND** on submit the system stores `recordingDurationSeconds` as `(hours * 3600) + (minutes * 60) + seconds`

#### Scenario: Duration left empty stores null

- **WHEN** the viewer leaves the duration fields empty
- **THEN** the system stores `recordingDurationSeconds = null`
- **AND** the `timeSource` display shows `NONE` until the viewer also supplies a recording start

#### Scenario: timeSource is shown read-only on the tab

- **WHEN** the viewer changes any of activity type, recording start, recording timezone, or duration
- **THEN** the displayed `timeSource` updates to `NONE`, `MANUAL`, or `GPX` accordingly
- **AND** the display is a read-only badge (no separate selector)

#### Scenario: Existing Upload GPX tab is not extended in this slice

- **WHEN** a viewer opens the existing `Upload GPX` tab on `TrackFormDialog`
- **THEN** the four new fields are not rendered there
- **AND** the existing GPX upload form keeps its current shape

### Requirement: Display surfaces are deferred to feature-113

Display of `timeSource`, `recordingStartAt`, and `recordingDurationSeconds` on the public track detail page, public track list card, admin track list row, and hike linked-track card is intentionally deferred to the feature-113 (`feature-113-outdoor-track-time-source-display`) slice; this slice (feature-112) owns the data shape, server-action persistence, and form input only. Display requirements for those surfaces are documented in the feature-113 OpenSpec change.

### Requirement: Existing tracks are backfilled to timeSource GPX on migration

The system SHALL set `timeSource = GPX` for every `Track` row that exists at the time the schema migration is applied. The system SHALL leave `recordingStartAt` and `recordingDurationSeconds` null for those rows. The system SHALL continue to set `timeSource = GPX` on every subsequent parse or re-parse of any GPX-backed track.

#### Scenario: Pre-migration tracks become timeSource GPX after backfill

- **WHEN** the schema migration runs
- **THEN** every pre-existing `Track` row has `timeSource = GPX`
- **AND** `recordingStartAt` and `recordingDurationSeconds` remain null unless the row already had non-null values before the migration

#### Scenario: A re-parse keeps timeSource GPX

- **WHEN** an administrator re-parses an existing GPX-backed track after the migration
- **THEN** the system writes `timeSource = GPX` again
- **AND** the row's existing parsed metadata is replaced with the new parse result

### Requirement: Place on map submission persists the new fields through the existing create flow

The system SHALL persist the four optional fields through the existing `createManualTrack` server action without introducing a second server action. The system SHALL validate the input through the existing `getTrackData` / `ensureSlugAvailable` helpers, SHALL persist the four fields alongside the synthetic GPX file asset and the new `Track` row inside the same `prisma.$transaction` that already creates those rows, and SHALL derive `timeSource` server-side as specified in the previous requirements.

#### Scenario: Eligible viewer saves a manual track with all four fields

- **WHEN** a verified, trusted, or administrator viewer submits the `Place on map` tab with at least two placed points, a unique slug, and a non-null value in any of the four new fields
- **THEN** the system creates the new `Track` row with all four fields stored on the row
- **AND** the new row's `timeSource` reflects the supplied combination

#### Scenario: Quota, trust, slug, and validation failures stay distinct

- **WHEN** the new server-action input fails any existing `TRUST | QUOTA | SLUG | VALIDATION | INTERNAL` check
- **THEN** the system surfaces the same `code` vocabulary feature-111 established
- **AND** no `Track` or `FileAsset` row is created
- **AND** the rejection mapping for the new fields uses `VALIDATION` for malformed inputs (unparsable datetime, out-of-range duration, unsupported timezone) and inherits the other codes from the existing gates