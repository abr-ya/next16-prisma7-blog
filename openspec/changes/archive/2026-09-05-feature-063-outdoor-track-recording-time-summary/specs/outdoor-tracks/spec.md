## ADDED Requirements

### Requirement: Track summaries display recording start and finish times

The system SHALL display parsed GPX recording start and finish date-times on admin and public track summary surfaces when stored parsed time metadata is available.

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
- **THEN** the detail page SHALL show recording start and finish date-times near the existing parsed summary values

#### Scenario: Hike linked track cards show recording times

- **WHEN** a visitor views `/hikes/[slug]` and linked published tracks have successful parsed GPX time metadata
- **THEN** each linked-track summary card SHALL show recording start and finish date-times when available

### Requirement: Track time summaries expose timezone evidence

The system SHALL make track timestamp timezone evidence visible enough for admins and readers to notice whether recording times came from UTC/offset-bearing GPX timestamps or from ambiguous timezone-free timestamps.

#### Scenario: GPX timestamps include UTC or offset evidence

- **WHEN** a parsed GPX track has timestamp strings that include `Z` or an explicit numeric UTC offset
- **THEN** the stored parsed metadata SHALL record that timezone evidence was present
- **AND** admin and public track summary displays SHALL identify the recording time as having UTC/offset evidence

#### Scenario: GPX timestamps omit timezone evidence

- **WHEN** a parsed GPX track has timestamp strings that parse as dates but do not include `Z` or an explicit numeric UTC offset
- **THEN** the stored parsed metadata SHALL record that timezone evidence is missing or ambiguous
- **AND** admin and public track summary displays SHALL identify the recording time as timezone ambiguous

#### Scenario: GPX has no usable timestamps

- **WHEN** a parsed GPX track has coordinates but no usable timestamp values
- **THEN** the system SHALL keep the track map-renderable when geometry exists
- **AND** recording start/finish and timezone evidence displays SHALL be omitted or shown as unavailable without failing the page

#### Scenario: Timezone evidence does not infer photo coordinates

- **WHEN** timezone evidence is displayed for a track
- **THEN** the system SHALL NOT automatically persist inferred photo coordinates from that evidence in this slice
- **AND** later photo matching workflows still require their own accepted confidence and approval rules
