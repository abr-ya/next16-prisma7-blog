# Spec Delta

## ADDED Requirements

### Requirement: Linked trip tracks use chronological recording order

The system SHALL present linked trip tracks in ascending order of their stored successful GPX recording start instant on published trip detail pages and in the authenticated administrator trip track-management surface. A linked track without a usable stored recording start SHALL follow all dated tracks; among such undated tracks, the system SHALL retain the existing reverse-association order. The ordering SHALL use stored metadata only and SHALL preserve current visibility, timezone-display, map, and association-management behavior.

#### Scenario: Published trip has dated linked tracks

- **WHEN** a visitor opens a published trip with two or more linked published tracks whose successful parsed metadata has different recording start instants
- **THEN** the linked-track cards appear in ascending recording-start order
- **AND** each track retains its existing selected recording-timezone display

#### Scenario: Linked track lacks a usable recording start

- **WHEN** a published trip has linked published tracks with usable recording start instants and one or more linked published tracks without a usable stored recording start
- **THEN** every dated linked track appears before every undated linked track
- **AND** undated tracks retain reverse association order relative to one another

#### Scenario: Administrator manages a trip's tracks

- **WHEN** an authenticated administrator opens the trip track-management surface for a trip with attached dated and undated tracks
- **THEN** its attached-track list uses the same chronological and undated fallback order as the public trip detail
- **AND** each attached track with successful stored recording time metadata displays its recording start and finish range with its selected recording timezone
- **AND** an attached track without successful stored recording time metadata displays no invented or manually derived date
- **AND** existing attach and detach authorization and behavior remain unchanged

#### Scenario: Stored time metadata remains unavailable

- **WHEN** a linked track has no successful parsed recording start metadata
- **THEN** rendering the public or administrator trip surface does not parse or fetch the raw GPX file
- **AND** the track remains visible only according to its existing surface-specific visibility rules
