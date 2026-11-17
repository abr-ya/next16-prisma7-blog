# Spec Delta

## MODIFIED Requirements

### Requirement: The quick walk dialog offers a route mode

The quick upload dialog SHALL offer a secondary **Create with route** action that switches the dialog to a route form in place. The action SHALL be disabled while a GPX file is uploaded or uploading. The route form SHALL offer a **Back to GPX upload** action and SHALL NOT open a second dialog. The route mode SHALL be offered for the route-capable activity types — walking and running — and SHALL NOT be offered for any other activity type. The dialog copy that names the activity type SHALL name the type the dialog creates.

#### Scenario: Owner opens the route mode

- **WHEN** the owner clicks **Create with route** in the quick upload dialog with no uploaded GPX
- **THEN** the dialog switches its content to the route form
- **AND** the GPX file, title, and upload controls are no longer shown

#### Scenario: Uploaded GPX disables the route action

- **WHEN** a GPX file is uploaded or uploading in the quick upload dialog
- **THEN** the **Create with route** action is disabled
- **AND** the owner can still save the GPX workout

#### Scenario: Owner returns to the GPX mode

- **WHEN** the owner clicks **Back to GPX upload** in the route form
- **THEN** the dialog switches back to the GPX file form
- **AND** no route is created

#### Scenario: The route mode stays inside one dialog

- **WHEN** the owner opens the route mode
- **THEN** no second modal is opened
- **AND** the dialog keeps its activity type and gear context

#### Scenario: The running quick-add dialog opens the route mode

- **WHEN** the owner opens the quick-add dialog for running
- **THEN** the dialog offers the **Create with route** action
- **AND** the dialog offers the source hint while a GPX file is uploaded
- **AND** the route form creates a run, not a walk

#### Scenario: The route mode copy names the activity type

- **WHEN** the owner opens the route mode for running in English
- **THEN** the dialog title reads `Run an existing route`
- **AND** the empty gear hint reads `No shoes for running`
- **WHEN** the owner opens the route mode for running in Russian
- **THEN** the dialog title reads `Пробежка по готовому маршруту`
- **AND** the empty gear hint reads `Нет обуви для пробежек`

#### Scenario: Another activity type opens no route mode

- **WHEN** the owner opens the quick upload dialog for an activity type other than walking or running
- **THEN** the dialog offers no **Create with route** action
- **AND** the dialog offers no source hint about a route
- **AND** the dialog offers only the file mode

### Requirement: The route mode collects an existing parsed route, a start, a duration, and gear

The route mode SHALL collect one existing parsed route, the recording start date-time, the duration in minutes (fractional minutes allowed), and optional gear that fits the dialog's activity type. It SHALL offer no route creation, title, slug, status, or activity-type control. Only routes with parsed metadata SHALL be offered.

#### Scenario: Owner picks a parsed route

- **WHEN** the owner opens the route selector
- **THEN** only routes whose metadata parsed successfully are listed
- **AND** routes without parsed metadata are not offered

#### Scenario: No parsed routes are available

- **WHEN** the owner has no route with parsed metadata
- **THEN** the route form shows an empty state
- **AND** Save stays disabled

#### Scenario: Fractional minutes are accepted

- **WHEN** the owner enters a duration such as `90.5` minutes
- **THEN** the system stores `5430` seconds
- **AND** the stored duration is a positive whole number of seconds

#### Scenario: Preferred walking gear is preselected

- **WHEN** the owner has a preferred gear record for walking that fits the activity type
- **THEN** the route form preselects it
- **AND** the owner may choose another fitting item or no gear

#### Scenario: Preferred running gear is preselected

- **WHEN** the owner has a preferred gear record for running that fits the activity type
- **THEN** the running route form preselects it
- **AND** the owner may choose another fitting item or no gear

#### Scenario: Missing start or duration is refused

- **WHEN** the owner saves the route form without a start or without a duration
- **THEN** the system refuses the save with a validation message
- **AND** no workout is created

### Requirement: Saving the route mode creates a published training workout from the route

Saving the route mode SHALL create a published `TRAINING` workout for the dialog's activity type whose primary geometry is the chosen route, with an auto-generated title and unique slug, the entered start, duration, and timezone, the selected gear, and no GPX file of its own. It SHALL use the same trust gate and track quota as other track creation.

#### Scenario: Owner saves a route walk

- **WHEN** the owner submits the route form with a parsed route, a start, a duration, and optional gear
- **THEN** the system creates a workout with activity type `walking`, kind `TRAINING`, and status `PUBLISHED`
- **AND** the chosen route is the workout's primary geometry
- **AND** the workout has no GPX file of its own
- **AND** the entered start, duration, timezone, and gear are stored

#### Scenario: Owner saves a route run

- **WHEN** the owner submits the running route form with a parsed route, a start, a duration, and optional running gear
- **THEN** the system creates a workout with activity type `running`, kind `TRAINING`, and status `PUBLISHED`
- **AND** the chosen route is the workout's primary geometry
- **AND** the workout has no GPX file of its own
- **AND** the entered start, duration, timezone, and gear are stored

#### Scenario: Title and slug match the quick upload conventions

- **WHEN** the owner saves a morning route walk
- **THEN** the title is generated from the daypart and the walking wording, for example `Morning walk` or `Утренняя прогулка`
- **AND** the slug base is `walking-YYYY-MM-DD-HHmm`
- **AND** a slug conflict gets a numeric suffix instead of failing the save

#### Scenario: Running title and slug match the quick upload conventions

- **WHEN** the owner saves a morning route run
- **THEN** the title is generated from the daypart and the running wording, for example `Morning run` or `Утренняя пробежка`
- **AND** the slug base is `running-YYYY-MM-DD-HHmm`
- **AND** a same-minute second run gets a numeric suffix instead of a slug refusal

#### Scenario: The saved workout is public

- **WHEN** the route walk or route run is saved
- **THEN** it appears among the published tracks
- **AND** its public page is reachable by its slug
- **AND** its map and distance come from the route

#### Scenario: Trust and quota are enforced

- **WHEN** an owner whose account may not upload tracks, or whose track quota is full, saves the route form
- **THEN** the system refuses the save with the same trust or quota outcome as other track creation
- **AND** no workout is created

### Requirement: Route mode refusals are explicit

The route mode SHALL report a machine-readable refusal for an unavailable or foreign route, an unsupported activity type, a missing start or duration, incompatible gear, trust, quota, slug, and internal failures. A refused save SHALL keep the dialog open with the entered values.

#### Scenario: Route belongs to another owner

- **WHEN** the owner submits a route they do not own
- **THEN** the system refuses the save with a validation message
- **AND** no workout is created

#### Scenario: Activity type is not route-capable

- **WHEN** a route save reaches the server for an activity type outside walking and running
- **THEN** the system refuses the save with a validation message
- **AND** no workout is created

#### Scenario: Gear does not fit walking

- **WHEN** the owner submits gear that does not fit the walking activity type or belongs to another owner
- **THEN** the system refuses the save with a validation message
- **AND** no workout is created

#### Scenario: Gear does not fit running

- **WHEN** the owner submits gear that does not fit the running activity type or belongs to another owner
- **THEN** the system refuses the save with a validation message
- **AND** no workout is created

#### Scenario: A refused save keeps the form

- **WHEN** the server refuses the route save
- **THEN** the dialog stays open with the selected route, start, duration, and gear
- **AND** the owner can correct the values and retry
