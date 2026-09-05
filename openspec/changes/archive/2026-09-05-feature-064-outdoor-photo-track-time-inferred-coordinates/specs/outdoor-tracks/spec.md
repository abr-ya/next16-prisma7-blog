## ADDED Requirements

### Requirement: Parsed tracks may retain a compact timed timeline

The system SHALL allow successfully parsed GPX tracks to store a compact timestamped trackpoint timeline in track metadata when enough source points include usable times, so later photo-to-track coordinate inference can interpolate along the route without reparsing GPX during normal page rendering.

#### Scenario: GPX trackpoints include usable timestamps

- **WHEN** an authenticated admin parses or refreshes a GPX track whose trackpoints include usable timestamp values
- **THEN** the stored track metadata MAY include a downsampled timeline of time, latitude, and longitude points sufficient for along-route interpolation
- **AND** the existing simplified map geometry used for drawing remains available

#### Scenario: GPX track lacks usable timed points

- **WHEN** an authenticated admin parses or refreshes a GPX track that has no usable per-point timestamps
- **THEN** the stored track metadata omits a timed timeline or stores an empty/unavailable timeline state
- **AND** track summary start/end times may still exist when only range-level timestamps are available
- **AND** readers treat along-route interpolation as unavailable for that track

#### Scenario: Existing tracks without timeline remain readable

- **WHEN** an older successful track metadata payload has summary and map geometry but no timeline field
- **THEN** track admin and public surfaces continue to read the existing summary and geometry
- **AND** photo inference treats along-route interpolation as unavailable until the track is reparsed into a timeline-capable payload

#### Scenario: Timeline storage stays bounded

- **WHEN** a long GPX file contains a large number of timed trackpoints
- **THEN** the stored timeline SHALL be downsampled or otherwise capped so metadata remains suitable for JSON storage and normal page reads
- **AND** the system does not require public hike pages to re-fetch or reparse the original GPX file to place approved inferred photo markers
