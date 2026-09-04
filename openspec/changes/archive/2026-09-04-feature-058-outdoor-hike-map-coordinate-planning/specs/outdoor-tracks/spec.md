## ADDED Requirements

### Requirement: Track timeline data supports future photo matching
The system SHALL plan for parsed track metadata to retain enough timestamped route context for future photo-to-track coordinate inference without reparsing raw GPX files during normal public page rendering.

#### Scenario: Parsed track has timestamped route points
- **WHEN** a GPX-backed track contains usable timestamps associated with route coordinates
- **THEN** future parsed metadata can expose a stored timeline representation suitable for matching photo capture times to positions along the track
- **AND** normal public hike map rendering still avoids fetching or parsing the raw GPX file

#### Scenario: Parsed track has no timestamped route points
- **WHEN** a GPX-backed track has coordinate geometry but no usable timestamps
- **THEN** the track can remain map-renderable as route geometry
- **AND** it is not treated as usable for timestamp-based photo coordinate inference

### Requirement: Track day filtering is based on accepted temporal track data
The system SHALL plan track day filtering around accepted track timestamp data and the hike date model.

#### Scenario: Track geometry can be assigned to a hike day
- **WHEN** a linked published track has stored timestamp data that can be interpreted for one day in the hike date range
- **THEN** a future day-filtered hike map can include the matching track geometry or segment for that selected day

#### Scenario: Track spans multiple hike days
- **WHEN** a linked published track has stored timestamp data spanning more than one hike day
- **THEN** a future day-filtered hike map can show only the segment or portion accepted for the selected day
- **AND** the all-days view can still show the full visible track geometry

#### Scenario: Track date is unavailable or ambiguous
- **WHEN** a linked published track lacks usable timestamps or has unresolved timezone ambiguity
- **THEN** the track is not shown as confidently belonging to a single day in future day-filtered map views
- **AND** the track may remain visible in all-days views when it otherwise has map-ready geometry
