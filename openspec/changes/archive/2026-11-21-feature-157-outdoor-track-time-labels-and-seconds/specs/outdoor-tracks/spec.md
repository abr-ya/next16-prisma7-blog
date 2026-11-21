# Spec Delta

## ADDED Requirements

### Requirement: Durations include seconds when present

The shared duration formatter SHALL render hours, minutes, and seconds from the stored whole seconds, SHALL include seconds whenever the remainder is non-zero, SHALL omit zero units, and SHALL keep `0 min` for a zero duration. Every surface SHALL use that formatter without its own rounding.

#### Scenario: A duration with a seconds remainder shows seconds

- **WHEN** a duration of `5310` seconds is rendered on any surface
- **THEN** it reads `1 h 28 min 30 s`
- **AND** the surface applies no additional rounding

#### Scenario: A sub-minute duration shows seconds

- **WHEN** a duration of `45` seconds is rendered
- **THEN** it reads `45 s`

#### Scenario: A whole minute stays compact

- **WHEN** a duration of `60` seconds is rendered
- **THEN** it reads `1 min`
- **AND** no zero seconds are appended

#### Scenario: An hour with only seconds omits the zero minutes

- **WHEN** a duration of `3630` seconds is rendered
- **THEN** it reads `1 h 30 s`

#### Scenario: A missing duration stays absent

- **WHEN** a duration is null or not finite
- **THEN** the formatter returns no value
- **AND** the surface keeps its existing placeholder

### Requirement: Time labels and kind badges follow the data

The public track header SHALL label its time line by the track's source: `Logged` for a manual workout, `Recorded` for a GPX parse, and `Time` for an unclassified row. The label SHALL be omitted when no time is recorded. The kind badge SHALL read `Route track` when the primary geometry is a route and `GPX track` otherwise, on both the detail page and the public list card.

#### Scenario: A manual workout reads as logged

- **WHEN** a viewer opens a manual or route-based workout with a time line
- **THEN** the header labels it `Logged`

#### Scenario: A GPX workout reads as recorded

- **WHEN** a viewer opens a GPX workout with a time line
- **THEN** the header labels it `Recorded`

#### Scenario: An unclassified row reads as time

- **WHEN** a viewer opens a workout whose `timeSource` is null and which has a time line
- **THEN** the header labels it `Time`

#### Scenario: An unknown time line hides the label

- **WHEN** a workout has no recorded time
- **THEN** the header shows `Time not recorded`
- **AND** no label is prepended

#### Scenario: A route-primary workout carries a route badge

- **WHEN** a viewer opens a workout whose primary geometry is a route
- **THEN** the header badge reads `Route track`
- **AND** the same workout reads `Route track` on the `/tracks` list card

#### Scenario: A file-based workout keeps the GPX badge

- **WHEN** a viewer opens a workout whose primary geometry is its own GPX file
- **THEN** the header badge reads `GPX track`

## MODIFIED Requirements

### Requirement: Track surfaces render timeSource badge

The system SHALL render a localized `timeSource` badge on the public track detail page, public track list card, `/admin/tracks` row, and published-trip linked-track card whenever a track has a non-null `Track.timeSource`. The badge SHALL render the localized label for `GPX`, `MANUAL`, or `NONE` from the `TrackTimeSource` enum and SHALL appear on the same surface as the existing recording-time summaries.

#### Scenario: Public track detail renders GPX timeSource badge

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `GPX`
- **THEN** the page renders a `timeSource` badge labeled with the localized `GPX` label
- **AND** the page header shows the parsed recording start and finish as the source of truth for that track
- **AND** the lower GPX summary keeps duration, recording timezone, and timezone evidence and does not repeat the start or finish

#### Scenario: Public track detail renders MANUAL timeSource badge with both optional lines

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `MANUAL`, `Track.recordingStartAt` is non-null, and `Track.recordingDurationSeconds` is non-null
- **THEN** the page renders a `timeSource` badge labeled with the localized `MANUAL` label
- **AND** the page header renders a recording line whose start value is `formatTrackRecordingDateTime(recordingStartAt, recordingTimezone)` and whose duration value is `formatTrackDuration(recordingDurationSeconds)`
- **AND** the page does not render a separate `Recording details` block

#### Scenario: Manual duration uses the shared human-readable format

- **WHEN** a visitor opens `/tracks/[slug]` for a `MANUAL` track with a recording duration
- **THEN** the header renders the duration in the same human-readable form used by the GPX summary and the full track tables
- **AND** the page does not apply its own rounding or unit rules

#### Scenario: Public track detail renders MANUAL timeSource badge with start only

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `MANUAL`, `Track.recordingStartAt` is non-null, and `Track.recordingDurationSeconds` is null
- **THEN** the page renders the `timeSource` badge
- **AND** the header shows the recording start and an explicit unknown for the duration
- **AND** the page does not derive a finish

#### Scenario: Public track detail renders MANUAL timeSource badge with duration only

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `MANUAL`, `Track.recordingStartAt` is null, and `Track.recordingDurationSeconds` is non-null
- **THEN** the page renders the `timeSource` badge
- **AND** the header shows an explicit unknown for the start and shows the recording duration
- **AND** the page does not derive a finish

#### Scenario: Public track detail renders NONE timeSource badge with no extra lines

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `NONE`
- **THEN** the page renders a `timeSource` badge labeled with the localized `NONE` label
- **AND** the header states that no recording time is recorded
- **AND** no recording start or duration value is shown

#### Scenario: Public track detail without parsed times states the recording time is unknown

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose parsed summary has no usable recording time
- **THEN** the header states that the recording time is unknown or not recorded
- **AND** the page does not fail because the recording time is missing

#### Scenario: Public track list card renders the same badge and conditional lines

- **WHEN** a visitor opens `/tracks` and a listed published track has any `Track.timeSource`
- **THEN** the card for that track renders the `timeSource` badge
- **AND** the card renders the `Start` line only when `timeSource` is `MANUAL` and `recordingStartAt` is non-null
- **AND** the card renders the `Duration` line only when `timeSource` is `MANUAL` and `recordingDurationSeconds` is non-null

#### Scenario: Admin track list row renders the same badge and conditional lines

- **WHEN** an authenticated administrator opens `/admin/tracks`
- **THEN** every track row renders the `timeSource` badge whenever `Track.timeSource` is non-null
- **AND** the row renders the `Recording start` line only when `timeSource` is `MANUAL` and `recordingStartAt` is non-null
- **AND** the row renders the `Recording duration` line only when `timeSource` is `MANUAL` and `recordingDurationSeconds` is non-null

#### Scenario: Trip linked-track card renders the same badge and conditional lines

- **WHEN** a visitor opens `/trips/[slug]` and a linked track has any `Track.timeSource`
- **THEN** the linked-track card for that track renders the `timeSource` badge alongside the existing recording-time summaries
- **AND** the card renders the `Start` line only when `timeSource` is `MANUAL` and `recordingStartAt` is non-null
- **AND** the card renders the `Duration` line only when `timeSource` is `MANUAL` and `recordingDurationSeconds` is non-null

#### Scenario: Track surfaces do not duplicate GPX times through the MANUAL lines

- **WHEN** any of the four surfaces renders a track whose `Track.timeSource` is `GPX`
- **THEN** the surface does not render the `Recording start` line or the `Recording duration` line for that track
- **AND** the existing parsed time remains the single source of truth for that track's GPX-derived recording times
