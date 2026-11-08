# Spec Delta

## ADDED Requirements

### Requirement: Full track tables group each column by one kind of information

The full track tables on `/my/tracks` and `/admin/tracks` SHALL present each kind of information in exactly one column. A single **Classification** column SHALL combine the track kind badge (`Route` / `Workout`) with the activity-type badge. A single **Recording** column SHALL own the recording time: the effective start, the finish, and the recording-timezone badge. The standalone **Timezone** column SHALL be removed. The standalone **GPX file** column SHALL also be removed: the actions column SHALL offer a download action for the track's resolved GPX file (its own file or the linked route's file) with the file size beneath the button, and the track status badge SHALL stay visible in the title cell. The **GPX summary** cell SHALL be limited to parsing state, distance, point count, timeline, and timezone evidence. The Recording column SHALL be sortable through the same effective-start value its cell renders, and the `/my/workouts` short table SHALL remain unchanged.

#### Scenario: Classification combines kind and type

- **WHEN** an owner or administrator views a full track table row
- **THEN** one Classification cell shows the kind badge and the activity-type badge
- **AND** separate Kind and Type columns are no longer rendered

#### Scenario: Recording owns the time and timezone

- **WHEN** a row has a parsed GPX start and finish
- **THEN** the Recording cell shows the start and finish in the track's recording timezone
- **AND** the same cell shows the recording-timezone badge
- **AND** no standalone Timezone column is rendered

#### Scenario: Manual recording shows its derived finish

- **WHEN** a row is a MANUAL track with a recording start and duration but no parsed GPX time
- **THEN** the Recording cell shows the confirmed start and the finish derived from start + duration
- **AND** the GPX summary cell does not repeat those values

#### Scenario: Missing recording values stay empty

- **WHEN** a row has no effective start, finish, or timezone
- **THEN** the Recording cell renders an empty value instead of a zero or a placeholder date

#### Scenario: GPX summary does not duplicate recording time

- **WHEN** a row is parsed successfully
- **THEN** the GPX summary cell shows parse status, timezone evidence, distance, point count, and timeline
- **AND** it does not repeat the recording start, finish, or manual duration

#### Scenario: GPX file becomes a download action

- **WHEN** a full-table row resolves a GPX file, either its own or its linked route's
- **THEN** the actions column shows a download button for that file
- **AND** the file size is shown beneath the button
- **AND** no standalone GPX file column is rendered

#### Scenario: Row without a GPX file

- **WHEN** a row resolves no GPX file
- **THEN** the download action is disabled or absent
- **AND** the size area stays empty rather than showing a zero

#### Scenario: Track status stays visible

- **WHEN** a full-table row is rendered
- **THEN** its draft/published status badge appears in the title cell
- **AND** removing the GPX file column does not hide the status

#### Scenario: Recording sorting matches the visible order

- **WHEN** the owner or administrator sorts by Recording
- **THEN** rows order by the same effective start the cell renders
- **AND** rows without an effective start sort last in both directions

#### Scenario: Workouts table is unchanged

- **WHEN** the owner opens `/my/workouts`
- **THEN** the short column set, including its own timezone column, is unchanged
