# Spec Delta

## ADDED Requirements

### Requirement: A stored GPX parse records the parser capabilities

The metadata envelope SHALL record, as an additive optional list, which outputs the parser that produced the row could derive. The list SHALL describe the parser rather than the specific file, SHALL be written for both a successful and a failed parse, and SHALL NOT change `TRACK_GPX_METADATA_VERSION`. A reader SHALL tolerate an absent list, unknown names, and older rows.

#### Scenario: A new parse records the current capabilities

- **WHEN** a GPX file is parsed successfully
- **THEN** its metadata records the current parser capability list
- **AND** the envelope version stays `v1`

#### Scenario: A file without timestamps still records the time capability

- **WHEN** a GPX file has no `<time>` elements
- **THEN** the parse records the same capability list
- **AND** the time summary stays empty because the file has no data

#### Scenario: An older parse stays readable

- **WHEN** a stored parse predates the capability field
- **THEN** the summary, map geometry, and timeline remain readable
- **AND** the row reports no capability list instead of failing validation

#### Scenario: A failed parse still records the capabilities

- **WHEN** a file cannot be parsed into coordinates
- **THEN** the failed metadata records the current capability list
- **AND** the failure reason stays visible

### Requirement: One owner action updates an outdated parse

The track detail page SHALL offer one owner-only **Update track data** action when the stored parse is missing, failed, stale, or produced by an older parser, and SHALL NOT offer it for a manual, unclassified, route-based, or non-owned track. The action SHALL require the track's own active GPX file and no route as its primary geometry. The action SHALL reuse the existing parse path, preserve `timeSource`, keep a confirmed recording timezone, and report a failed reparse as a failure rather than as a refresh.

#### Scenario: An outdated parse offers the action

- **WHEN** the owner opens a GPX workout whose stored capabilities miss a current one
- **THEN** the page shows **Update track data**
- **AND** activating it reparses, reports progress, and refreshes the page

#### Scenario: A fresh parse with no timestamps offers no action

- **WHEN** a GPX workout was parsed with the current capabilities but its file has no timestamps
- **THEN** no update action is shown
- **AND** the page keeps its "time not recorded" state

#### Scenario: A fresh parse without a moving value offers no action

- **WHEN** a file yields a timed summary from a single timestamp but no moving duration
- **THEN** the moving value reads unavailable
- **AND** no update action is shown, because the capability is present and a retry cannot add data

#### Scenario: A failed parse can be retried

- **WHEN** the owner opens a GPX workout whose parse failed
- **THEN** the page offers the update action in a dedicated status row
- **AND** a successful retry replaces the failed state
- **AND** a retry that fails again keeps the failed state and reports the failure

#### Scenario: A stale parse can be refreshed

- **WHEN** the owner replaced a track's GPX file and the stored metadata was marked stale
- **THEN** the page offers the update action in the status row
- **AND** the action reparses the new file and restores the summary

#### Scenario: A never-parsed file can be parsed

- **WHEN** an owned GPX workout has no stored parse
- **THEN** the page offers the update action in the status row
- **AND** a successful parse fills the summary and clears the status row

#### Scenario: Manual and route-based workouts are excluded

- **WHEN** the owner opens a manual, unclassified, or route-based workout
- **THEN** no update action is shown
- **AND** its stored start, duration, and timezone are never rewritten by this action
- **AND** a route-primary workout is not mistaken for a file-based one because its resolved geometry is the route's file

#### Scenario: Another viewer sees no action

- **WHEN** a viewer who does not own the workout opens it
- **THEN** no update action is shown
- **AND** the existing durations stay visible

## MODIFIED Requirements

### Requirement: Moving time is shown and can be recalculated by the owner

The public track page SHALL show total and moving time for a timed GPX workout, the workouts table SHALL offer a sortable moving column, and the owner SHALL be able to update an outdated parse through the general **Update track data** action to fill a missing moving value. A manual or route-based workout SHALL show total time only, and a viewer who does not own the workout SHALL see no update action.

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
- **THEN** the page shows the **Update track data** action next to the unavailable value
- **AND** activating it re-parses the file, reports progress, and refreshes the page with the new value

#### Scenario: The recalculation action is owner-only and GPX-only

- **WHEN** another viewer opens the same workout, or the workout is manual or route-based
- **THEN** no update action is shown
- **AND** the public durations keep their existing values
