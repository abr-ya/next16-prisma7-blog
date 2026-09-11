## ADDED Requirements

### Requirement: Tracks retain a confirmed recording timezone

The system SHALL retain a validated IANA timezone for a track's recording-time presentation independently of the timezone of the administrator who later views it. The administration list SHALL show each track's confirmed timezone or clearly identify an unconfirmed legacy value, and SHALL provide an authenticated administrator with a focused action to set or correct the value; the browser proposal SHALL be a convenience only and SHALL NOT be trusted as persisted data without server-side validation.

#### Scenario: Administrator confirms browser-proposed timezone

- **WHEN** an administrator opens the recording-timezone action in a browser that reports a supported IANA timezone
- **THEN** the action proposes that timezone as its initial choice
- **AND** the administrator can explicitly save it for the track

#### Scenario: Administrator selects a different recording timezone

- **WHEN** an administrator sets the timezone for a track whose recording location uses a timezone other than the browser-proposed value
- **THEN** the administrator can select a different supported IANA timezone
- **AND** the system persists that selected timezone with the track

#### Scenario: Server rejects an invalid timezone

- **WHEN** a recording-timezone update request contains an empty, malformed, or unsupported value
- **THEN** the system rejects the request with a validation error
- **AND** it does not change the track's timezone setting

#### Scenario: Existing track lacks a confirmed timezone

- **WHEN** an administrator opens an existing track created before recording-timezone selection was available
- **THEN** the system preserves its GPX metadata and absolute timestamps
- **AND** the administration UI provides the focused timezone action without requiring the administrator to edit GPX or other track fields

### Requirement: Track recording-time display is timezone-stable

The system SHALL render a parsed track's recording start, finish, and range in its persisted recording timezone on administration, public track, and published trip surfaces. The rendered local time SHALL not change when the same track is viewed from a browser or server in another timezone; surfaces SHALL identify the applied timezone or UTC fallback clearly enough to avoid ambiguity.

#### Scenario: Sofia UTC GPX timestamp uses selected timezone

- **WHEN** a track has recording timezone `Europe/Sofia` and parsed GPX time `2016-11-10T10:35:42Z`
- **THEN** the system renders the recording time as 12:35 on 10 November 2016
- **AND** it does so regardless of the viewer's browser timezone

#### Scenario: Viewer in another timezone opens a published track

- **WHEN** viewers in different browser timezones open the same published track with a confirmed recording timezone
- **THEN** they see the same recording start, finish, and range values for that track
- **AND** the track's selected timezone remains visible with those values

#### Scenario: Legacy track is displayed before confirmation

- **WHEN** a parsed legacy track has no persisted recording timezone
- **THEN** the system renders its recording timestamps in explicit UTC rather than a viewer-local timezone
- **AND** it does not represent UTC as a confirmed local recording timezone

### Requirement: Recording timezone never changes GPX instants or coordinate matching

The system SHALL treat the recording-timezone setting as presentation metadata only. Changing it SHALL NOT rewrite parsed GPX timestamps, durations, timeline ordering, map geometry, or photo-to-track coordinate matching inputs and results.

#### Scenario: Administrator corrects a track timezone

- **WHEN** an administrator changes a parsed track from one valid recording timezone to another
- **THEN** the displayed local clock values update to the selected timezone
- **AND** the stored GPX start/end instants and timed-point instants remain unchanged
- **AND** the parsed duration, route geometry, and coordinate-match outcome remain unchanged

#### Scenario: GPX parse runs after timezone selection

- **WHEN** an administrator parses or reparses a track with a confirmed recording timezone
- **THEN** the parser stores GPX timestamps as their original absolute instants
- **AND** subsequent presentation uses the track's confirmed timezone without applying a browser-derived offset

### Requirement: Authorized photo-to-track time comparison is timezone-explicit

The system SHALL show an authorized photo-detail or coordinate reviewer the stored photo capture instant in explicit UTC and its existing timezone-evidence state, together with each source track's recording range rendered in that track's persisted recording timezone. The system SHALL retain the existing candidate and coordinate-placement result; it SHALL NOT reinterpret or rewrite a photo or GPX timestamp for display.

#### Scenario: Browser-local photo clock differs from the source-track timezone

- **WHEN** an authorized reviewer opens a photo whose browser-local readable clock differs from a source track's persisted recording timezone
- **THEN** the view identifies the photo's canonical UTC instant and timezone evidence
- **AND** it renders the source-track range with its persisted timezone label rather than comparing unlabelled clocks

#### Scenario: Sofia track candidate retains its absolute-time outcome

- **WHEN** a `Europe/Sofia` track has a parsed range beginning `2016-11-10T10:35:42Z` and a linked photo has a stored capture instant outside that absolute range
- **THEN** the review shows the labelled UTC photo instant and the `Europe/Sofia` recording range
- **AND** it preserves the existing inside-track, between-track, or previous-day-finish candidate outcome
