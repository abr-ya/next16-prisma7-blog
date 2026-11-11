# outdoor-quick-route-workout Specification

## Purpose

Defines the quick path that turns an existing route into a published walking workout from the owner's quick walk dialog, without leaving the dialog for the full track form.

## Requirements

### Requirement: The quick walk dialog offers a route mode

The quick walk dialog SHALL offer a secondary **Create with route** action that switches the dialog to a route form in place. The action SHALL be disabled while a GPX file is uploaded or uploading. The route form SHALL offer a **Back to GPX upload** action and SHALL NOT open a second dialog. The route mode SHALL be offered for the walking activity type only, because the workout it creates is a walking workout.

#### Scenario: Owner opens the route mode

- **WHEN** the owner clicks **Create with route** in the quick walk dialog with no uploaded GPX
- **THEN** the dialog switches its content to the route form
- **AND** the GPX file, title, and upload controls are no longer shown

#### Scenario: Uploaded GPX disables the route action

- **WHEN** a GPX file is uploaded or uploading in the quick walk dialog
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

#### Scenario: Another activity type opens no route mode

- **WHEN** the owner opens the quick upload dialog for an activity type other than walking
- **THEN** the dialog offers no **Create with route** action
- **AND** the dialog offers no source hint about a route
- **AND** the dialog offers only the file mode

### Requirement: The route mode collects an existing parsed route, a start, a duration, and gear

The route mode SHALL collect one existing parsed route, the recording start date-time, the duration in minutes (fractional minutes allowed), and optional walking gear. It SHALL offer no route creation, title, slug, status, or activity-type control. Only routes with parsed metadata SHALL be offered.

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

#### Scenario: Missing start or duration is refused

- **WHEN** the owner saves the route form without a start or without a duration
- **THEN** the system refuses the save with a validation message
- **AND** no workout is created

### Requirement: Saving the route mode creates a published training workout from the route

Saving the route mode SHALL create a published `TRAINING` workout for the walking activity type whose primary geometry is the chosen route, with an auto-generated title and unique slug, the entered start, duration, and timezone, the selected gear, and no GPX file of its own. It SHALL use the same trust gate and track quota as other track creation.

#### Scenario: Owner saves a route walk

- **WHEN** the owner submits the route form with a parsed route, a start, a duration, and optional gear
- **THEN** the system creates a workout with activity type `walking`, kind `TRAINING`, and status `PUBLISHED`
- **AND** the chosen route is the workout's primary geometry
- **AND** the workout has no GPX file of its own
- **AND** the entered start, duration, timezone, and gear are stored

#### Scenario: Title and slug match the quick upload conventions

- **WHEN** the owner saves a morning route walk
- **THEN** the title is generated from the daypart and the walking wording, for example `Morning walk` or `Утренняя прогулка`
- **AND** the slug base is `walking-YYYY-MM-DD-HHmm`
- **AND** a slug conflict gets a numeric suffix instead of failing the save

#### Scenario: The saved workout is public

- **WHEN** the route walk is saved
- **THEN** it appears among the published tracks
- **AND** its public page is reachable by its slug
- **AND** its map and distance come from the route

#### Scenario: Trust and quota are enforced

- **WHEN** an owner whose account may not upload tracks, or whose track quota is full, saves the route form
- **THEN** the system refuses the save with the same trust or quota outcome as other track creation
- **AND** no workout is created

### Requirement: Route mode refusals are explicit

The route mode SHALL report a machine-readable refusal for an unavailable or foreign route, a missing start or duration, incompatible gear, trust, quota, slug, and internal failures. A refused save SHALL keep the dialog open with the entered values.

#### Scenario: Route belongs to another owner

- **WHEN** the owner submits a route they do not own
- **THEN** the system refuses the save with a validation message
- **AND** no workout is created

#### Scenario: Gear does not fit walking

- **WHEN** the owner submits gear that does not fit the walking activity type or belongs to another owner
- **THEN** the system refuses the save with a validation message
- **AND** no workout is created

#### Scenario: A refused save keeps the form

- **WHEN** the server refuses the route save
- **THEN** the dialog stays open with the selected route, start, duration, and gear
- **AND** the owner can correct the values and retry
