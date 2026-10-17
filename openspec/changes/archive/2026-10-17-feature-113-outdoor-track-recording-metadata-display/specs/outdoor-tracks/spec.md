# Spec Delta

## ADDED Requirements

### Requirement: Track surfaces render timeSource badge

The system SHALL render a localized `timeSource` badge on the public track detail page, public track list card, `/admin/tracks` row, and published-trip linked-track card whenever a track has a non-null `Track.timeSource`. The badge SHALL render the localized label for `GPX`, `MANUAL`, or `NONE` from the `TrackTimeSource` enum and SHALL appear on the same surface as the existing recording-time summaries.

#### Scenario: Public track detail renders GPX timeSource badge

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `GPX`
- **THEN** the page renders a `timeSource` badge labeled with the localized `GPX` label
- **AND** the existing `parsed.summary.time` block (start, finish, duration, recording timezone, timezone evidence) continues to render as the source of truth for GPX-sourced tracks

#### Scenario: Public track detail renders MANUAL timeSource badge with both optional lines

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `MANUAL`, `Track.recordingStartAt` is non-null, and `Track.recordingDurationSeconds` is non-null
- **THEN** the page renders a `timeSource` badge labeled with the localized `MANUAL` label
- **AND** the page renders a `Recording start` line whose value is `formatTrackRecordingDateTime(recordingStartAt, recordingTimezone)`
- **AND** the page renders a `Recording duration` line whose value is `formatTrackDuration(recordingDurationSeconds)`

#### Scenario: Public track detail renders MANUAL timeSource badge with start only

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `MANUAL`, `Track.recordingStartAt` is non-null, and `Track.recordingDurationSeconds` is null
- **THEN** the page renders the `timeSource` badge
- **AND** the page renders the `Recording start` line
- **AND** the page does not render the `Recording duration` line

#### Scenario: Public track detail renders MANUAL timeSource badge with duration only

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `MANUAL`, `Track.recordingStartAt` is null, and `Track.recordingDurationSeconds` is non-null
- **THEN** the page renders the `timeSource` badge
- **AND** the page does not render the `Recording start` line
- **AND** the page renders the `Recording duration` line

#### Scenario: Public track detail renders NONE timeSource badge with no extra lines

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `NONE`
- **THEN** the page renders a `timeSource` badge labeled with the localized `NONE` label
- **AND** the page does not render the `Recording start` line
- **AND** the page does not render the `Recording duration` line

#### Scenario: Public track list card renders the same badge and conditional lines

- **WHEN** a visitor opens `/tracks` and a listed published track has any `Track.timeSource`
- **THEN** the card for that track renders the `timeSource` badge
- **AND** the card renders the `Recording start` line only when `timeSource` is `MANUAL` and `recordingStartAt` is non-null
- **AND** the card renders the `Recording duration` line only when `timeSource` is `MANUAL` and `recordingDurationSeconds` is non-null

#### Scenario: Admin track list row renders the same badge and conditional lines

- **WHEN** an authenticated administrator opens `/admin/tracks`
- **THEN** every track row renders the `timeSource` badge whenever `Track.timeSource` is non-null
- **AND** the row renders the `Recording start` line only when `timeSource` is `MANUAL` and `recordingStartAt` is non-null
- **AND** the row renders the `Recording duration` line only when `timeSource` is `MANUAL` and `recordingDurationSeconds` is non-null

#### Scenario: Trip linked-track card renders the same badge and conditional lines

- **WHEN** a visitor opens `/trips/[slug]` and a linked track has any `Track.timeSource`
- **THEN** the linked-track card for that track renders the `timeSource` badge alongside the existing recording-time summaries
- **AND** the card renders the `Recording start` line only when `timeSource` is `MANUAL` and `recordingStartAt` is non-null
- **AND** the card renders the `Recording duration` line only when `timeSource` is `MANUAL` and `recordingDurationSeconds` is non-null

#### Scenario: Track surfaces do not duplicate GPX times through the MANUAL lines

- **WHEN** any of the four surfaces renders a track whose `Track.timeSource` is `GPX`
- **THEN** the surface does not render the `Recording start` line or the `Recording duration` line for that track
- **AND** the existing `parsed.summary.time` block (where present) remains the single source of truth for that track's GPX-derived recording times

### Requirement: Track read projections expose timeSource and optional MANUAL metadata

The system SHALL include `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` in the read-side projections returned to the public track detail page, the public track list, the admin track list, and the public trip linked-track card surfaces. The projections SHALL continue to expose `recordingTimezone` so the existing `formatTrackRecordingDateTime` formatter can render the localized wall-clock value for a MANUAL `Recording start` line without an additional query.

#### Scenario: Public track detail projection includes the new fields

- **WHEN** the public track detail data layer selects a published track for `/tracks/[slug]`
- **THEN** the resulting projection contains `recordingStartAt: Date | null`, `recordingDurationSeconds: number | null`, and `timeSource: TrackTimeSource | null` alongside the existing `recordingTimezone`

#### Scenario: Public track list projection includes the new fields

- **WHEN** the public track list data layer selects published tracks for `/tracks`
- **THEN** each row projection contains `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` alongside the existing `recordingTimezone`

#### Scenario: Admin track list projection includes the new fields

- **WHEN** the admin track list data layer selects tracks for `/admin/tracks`
- **THEN** each row projection contains `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` alongside the existing `recordingTimezone`

#### Scenario: Trip linked-track card projection includes the new fields

- **WHEN** the public trip linked-track card data layer selects linked tracks for `/trips/[slug]`
- **THEN** each linked-track projection contains `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` alongside the existing `recordingTimezone`

### Requirement: GPX tracks keep parsed times as the source of truth and do not write the new columns

The system SHALL NOT persist `Track.recordingStartAt` or `Track.recordingDurationSeconds` for a track whose `Track.timeSource` is `GPX`. The system SHALL continue to populate `Track.metadata.summary.time` through the existing `parseTrackGpx` pipeline and SHALL NOT mirror those parsed values into the new columns for a GPX-sourced track.

#### Scenario: GPX upload leaves the new columns null

- **WHEN** an administrator uploads or re-parses a GPX-backed track
- **THEN** the resulting `Track.recordingStartAt` and `Track.recordingDurationSeconds` remain null
- **AND** `Track.timeSource` remains `GPX`
- **AND** `Track.metadata.summary.time` continues to carry the parsed start, finish, duration, and timezone evidence for that track

#### Scenario: GPX track surfaces read parsed times, not the new columns

- **WHEN** a track has `Track.timeSource = GPX`
- **THEN** the public track detail page, public track list card, admin track list row, and trip linked-track card continue to render recording times from `Track.metadata.summary.time` through the existing parsed block
- **AND** none of those surfaces render the new `Recording start` or `Recording duration` lines for that track