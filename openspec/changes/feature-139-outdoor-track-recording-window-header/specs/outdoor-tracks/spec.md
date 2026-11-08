# Spec Delta

## MODIFIED Requirements

### Requirement: Public track pages show parsed summaries

The system SHALL show parsed GPX summary information on public track pages for published tracks when parsed metadata is available.

#### Scenario: Visitor sees parsed summary

- **WHEN** a visitor opens `/tracks/[slug]` for a published track with successful parsed metadata
- **THEN** the lower GPX summary displays visibility-safe values such as distance, elevation range when available, recording duration when available, timezone evidence, and point counts
- **AND** the recording start and finish are displayed in the page header rather than repeated in the lower summary
- **AND** it may render an interactive map when the parsed metadata includes current map-ready geometry

#### Scenario: Visitor sees unparsed fallback

- **WHEN** a visitor opens `/tracks/[slug]` for a published track without successful parsed metadata
- **THEN** the page still displays the existing track metadata and GPX download availability
- **AND** it does not fail because parsed metadata is missing

#### Scenario: Draft tracks remain private

- **WHEN** a visitor requests a draft track that has parsed metadata
- **THEN** the system responds as not found
- **AND** it does not expose the parsed summary or map-ready geometry

### Requirement: Track summaries display recording start and finish times

The system SHALL display parsed GPX recording start and finish date-times on admin and public track summary surfaces when stored parsed time metadata is available. On the public track detail page the values SHALL render as a compact line in the page header, to the right of the existing badges, in the track's recording timezone.

#### Scenario: Admin track list shows recording times

- **WHEN** an authenticated admin views `/admin/tracks` and a track has successful parsed GPX time metadata
- **THEN** the track row SHALL show recording start and finish date-times
- **AND** it SHALL omit those values without failing when parsed time metadata is unavailable

#### Scenario: Public track list shows recording times

- **WHEN** a visitor views `/tracks` and a published track has successful parsed GPX time metadata
- **THEN** the track card SHALL show recording start and finish date-times
- **AND** draft tracks remain hidden according to existing visibility rules

#### Scenario: Public track detail shows recording times

- **WHEN** a visitor views `/tracks/[slug]` for a published track with successful parsed GPX time metadata
- **THEN** the page header SHALL show the recording start and finish as a compact line to the right of the existing badges
- **AND** the values SHALL use the track's recording timezone
- **AND** the lower GPX summary SHALL NOT repeat the recording start or finish

#### Scenario: Hike linked track cards show recording times

- **WHEN** a visitor views `/hikes/[slug]` and linked published tracks have successful parsed GPX time metadata
- **THEN** each linked-track summary card SHALL show recording start and finish date-times when available

### Requirement: Track surfaces render timeSource badge

The system SHALL render a localized `timeSource` badge on the public track detail page, public track list card, `/admin/tracks` row, and published-trip linked-track card whenever a track has a non-null `Track.timeSource`. The badge SHALL render the localized label for `GPX`, `MANUAL`, or `NONE` from the `TrackTimeSource` enum and SHALL appear on the same surface as the existing recording-time summaries. On the public track detail page, MANUAL start and duration SHALL render in the header without a derived finish.

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
- **AND** the existing parsed time remains the single source of truth for that track's GPX-derived recording times
