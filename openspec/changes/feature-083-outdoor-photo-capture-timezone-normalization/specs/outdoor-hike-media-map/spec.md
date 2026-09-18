## ADDED Requirements

### Requirement: Track timezone can provide a labelled photo-time assumption

The system SHALL use a linked published track's confirmed IANA recording timezone as a default assumption for an unconfirmed photo camera-local time only when exactly one such timezone is available for the trip. The resulting candidate SHALL identify the track-timezone assumption.

#### Scenario: Trip has one confirmed linked-track timezone

- **WHEN** a photo has unconfirmed camera-local time and its published trip has exactly one confirmed linked-track IANA timezone
- **THEN** track-time coordinate matching may interpret the wall-clock time in that timezone
- **AND** the review identifies the timezone as an assumption from the linked track
- **AND** the user can explicitly replace it through authorized timezone confirmation

#### Scenario: Trip timezone context is ambiguous

- **WHEN** the trip has zero or multiple confirmed linked-track IANA timezones
- **THEN** the system does not silently choose one for automatic matching
- **AND** it requires an authorized explicit timezone choice before deriving an absolute capture instant

### Requirement: Coordinate matching excludes unconfirmed absolute time

The system SHALL not generate or approve automatic track-time coordinate candidates from a timezone-less camera-local capture time unless an unambiguous track-timezone assumption or an authorized explicit timezone confirmation provides the required instant.

#### Scenario: Photo has no safe timezone assumption

- **WHEN** an unconfirmed photo camera-local time has no single confirmed linked-track timezone and no authorized confirmed timezone
- **THEN** the coordinate review explains that timezone confirmation is required
- **AND** it does not use a process timezone or invented UTC instant to match the photo to a track
