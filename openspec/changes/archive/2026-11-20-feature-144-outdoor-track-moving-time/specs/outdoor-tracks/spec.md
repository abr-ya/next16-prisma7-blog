# Spec Delta

## ADDED Requirements

### Requirement: Moving time is derived from timed GPX points

The parser SHALL derive a moving duration from the full timed point list and store it as an optional field of the time summary without changing the metadata version. A stopped interval SHALL be a window of at least 60 seconds whose net displacement is at most 25 metres, and the stopped intervals SHALL be subtracted from the elapsed time. An older parse without the field SHALL remain readable with no moving value.

#### Scenario: A pause is removed from moving time

- **WHEN** a timed GPX contains a stationary window of at least 60 seconds and the remaining points move continuously
- **THEN** the stored moving duration is the elapsed time minus that stopped window
- **AND** the elapsed duration is unchanged

#### Scenario: Continuous movement keeps both values equal

- **WHEN** every 60-second window of a timed GPX moves farther than the stop radius
- **THEN** the moving duration equals the elapsed duration

#### Scenario: A short pause is not subtracted

- **WHEN** the track stops for less than 60 seconds
- **THEN** no stopped window qualifies
- **AND** the moving duration stays equal to the elapsed duration

#### Scenario: A GPX without usable timestamps has no moving value

- **WHEN** the file has no `<time>` elements
- **THEN** the time summary is absent as today
- **AND** no moving duration is stored

#### Scenario: An older parse stays readable

- **WHEN** a stored summary predates this field
- **THEN** the summary keeps its start, end, duration, and timezone evidence
- **AND** it reports no moving value instead of failing the parse validation

### Requirement: Moving time is shown and can be recalculated by the owner

The public track page SHALL show total and moving time for a timed GPX workout, the workouts table SHALL offer a sortable moving column, and the owner SHALL be able to re-parse an older GPX workout to fill a missing moving value. A manual or route-based workout SHALL show total time only, and a viewer who does not own the workout SHALL see no recalculation action.

#### Scenario: The public header shows both durations

- **WHEN** a viewer opens a published timed GPX workout with a moving duration
- **THEN** the header shows the total and the moving time
- **AND** a manual or route-based workout shows only its existing time line

#### Scenario: The workouts table shows moving time

- **WHEN** the owner opens `/my/workouts`
- **THEN** the **Moving** column shows the moving duration for a timed GPX row
- **AND** it shows a dash for a manual row or an older parse without the value
- **AND** the column can be sorted

#### Scenario: An older parse offers recalculation to its owner

- **WHEN** the owner opens a timed GPX workout whose parse has no moving value
- **THEN** the page shows a recalculation action next to the unavailable value
- **AND** activating it re-parses the file, reports progress, and refreshes the page with the new value

#### Scenario: The recalculation action is owner-only and GPX-only

- **WHEN** another viewer opens the same workout, or the workout is manual or route-based
- **THEN** no recalculation action is shown
- **AND** the public durations keep their existing values
