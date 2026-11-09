# Spec Delta

## ADDED Requirements

### Requirement: Owner can create a draft workout

The system SHALL let a signed-in owner create a draft workout for the walking activity type without any GPX file or route. The draft SHALL capture a recording start date-time, a duration entered in minutes (fractional minutes allowed), an optional private note, and optional gear. The system SHALL generate the title and slug, store `status = DRAFT` and `geometryState = PENDING`, and apply the same trust gate and track quota as other track creation.

#### Scenario: Owner creates a draft walk

- **WHEN** a signed-in owner submits a draft with a start date-time, a duration, a note, and a pair of walking shoes
- **THEN** the system creates a workout with activity type `walking`, kind `TRAINING`, status `DRAFT`, and geometry state `PENDING`
- **AND** the workout stores the start instant, the duration in seconds, the private note, and the gear
- **AND** it stores no GPX file, no route, and no parsed metadata

#### Scenario: Draft duration accepts fractional minutes

- **WHEN** the owner enters a duration such as `90.5` minutes
- **THEN** the system stores `5430` seconds
- **AND** the stored duration is a positive whole number of seconds

#### Scenario: Draft title and slug are generated

- **WHEN** the owner creates a draft for a morning recording
- **THEN** the title is generated from the daypart and the walking wording, for example `Morning walk` or `Утренняя прогулка`
- **AND** the slug base is `walking-YYYY-MM-DD-HHmm` and is made unique with a numeric suffix when needed

#### Scenario: Draft recording timezone defaults to the device

- **WHEN** the owner creates a draft from a device with a supported timezone
- **THEN** that timezone is stored as the recording timezone
- **AND** an unsupported device timezone leaves the recording timezone unset without refusing the save

#### Scenario: Draft rejects incomplete required values

- **WHEN** the owner submits a draft without a recording start or without a duration
- **THEN** the system refuses the save with a validation message
- **AND** no workout is created

#### Scenario: Draft creation respects trust and quota

- **WHEN** an owner whose account may not upload tracks, or whose track quota is full, submits a draft
- **THEN** the system refuses the save with the same trust or quota outcome as other track creation
- **AND** no workout is created

#### Scenario: Draft is available only for the walking activity type

- **WHEN** the walking activity type is inactive or has no wording entry
- **THEN** the owner's workouts page does not offer the draft action
- **AND** no other activity type receives a draft action in this slice

### Requirement: A draft workout is completed by attaching geometry

The system SHALL complete a `PENDING` draft when the owner attaches geometry, moving it to `READY`. The owner SHALL be able to upload a GPX file, choose an existing owned route, or create a new route. A route SHALL always become the primary geometry; this slice SHALL NOT keep a demoted file as secondary geometry.

#### Scenario: Owner completes a draft with a GPX file

- **WHEN** the owner attaches a GPX file to a pending draft
- **THEN** the file becomes the draft's primary geometry and the draft becomes `READY`
- **AND** the file is parsed and its summary and map geometry become available
- **AND** when the file carries usable recording timestamps, the parsed start and duration replace the draft's provisional values
- **AND** when the file carries no usable recording timestamps, the draft's entered start, duration, and timezone are kept and the track is marked `MANUAL`

#### Scenario: Owner completes a draft with a GPX file that has no timestamps

- **WHEN** the owner attaches a GPX file without usable `<time>` values to a pending draft
- **THEN** the file supplies the geometry and distance
- **AND** the draft's entered start, duration, and recording timezone remain
- **AND** the track's time source is `MANUAL`

#### Scenario: Owner completes a draft with an existing route

- **WHEN** the owner chooses one of their own routes for a pending draft
- **THEN** the route becomes the draft's primary geometry and the draft becomes `READY`
- **AND** the draft keeps its entered start, duration, and recording timezone
- **AND** the route supplies distance and map geometry

#### Scenario: Owner completes a draft with a new route

- **WHEN** the owner creates a route from placed points for a pending draft
- **THEN** the system stores the route and links it as the draft's primary geometry
- **AND** the draft becomes `READY` and keeps its entered recording values

#### Scenario: Route belongs to another owner

- **WHEN** the owner tries to attach a route they do not own
- **THEN** the system refuses the save
- **AND** the draft remains `PENDING`

#### Scenario: Completed draft stays unpublished

- **WHEN** a draft becomes `READY`
- **THEN** its status remains `DRAFT`
- **AND** the owner can publish it later through the existing publication flow

#### Scenario: Pending draft cannot be published

- **WHEN** an owner or administrator tries to set a `PENDING` workout to `PUBLISHED`
- **THEN** the system refuses the change
- **AND** the workout stays `DRAFT` and `PENDING`

### Requirement: Draft workouts appear in the owner's workouts list and week filter

The system SHALL list a `PENDING` workout in the owner's workouts page and period filters, using its recording start as the period anchor. The distance SHALL render as unavailable rather than zero, and the week summary SHALL count the draft as a workout without adding distance.

#### Scenario: Draft appears in the workouts list

- **WHEN** the owner opens `/my/workouts`
- **THEN** the draft row shows the `Draft` status and an incomplete-geometry indicator
- **AND** its distance cell shows `—`
- **AND** its duration cell shows the entered duration

#### Scenario: Draft appears in the selected week

- **WHEN** the owner selects the ISO week that contains the draft's recording start
- **THEN** the draft is listed in that week
- **AND** it participates in the existing start-date sorting

#### Scenario: Week summary counts the draft without distance

- **WHEN** the selected week contains a pending draft and workouts with parsed distance
- **THEN** the workout count includes the draft
- **AND** the summed distance includes only workouts with distance
- **AND** the existing distance-coverage note explains that the draft has no distance

#### Scenario: Pending draft is never public

- **WHEN** a visitor opens `/tracks` or `/tracks/[slug]`
- **THEN** no `PENDING` workout is listed or reachable
- **AND** the public queries exclude pending rows even if their status is `PUBLISHED`

### Requirement: A private workout note stays owner-only

The system SHALL store `Track.privateNote` as an owner-only field. The owner SHALL be able to add, edit, and clear it in the draft and owner edit surfaces. The owner SHALL also see it on their own published track page. The field SHALL NOT appear in public projections or public pages for any viewer other than the owner, nor in administrative lists or administrative edit dialogs.

#### Scenario: Owner reads and edits the private note

- **WHEN** the owner opens a draft or owned workout for editing
- **THEN** the private note is shown and editable
- **AND** clearing it stores no note

#### Scenario: Owner sees the private note on the published track page

- **WHEN** the owner opens `/tracks/[slug]` for their published workout that has a private note
- **THEN** the page renders the note in an owner-only block
- **AND** the block is not rendered for any other viewer
- **AND** the note is absent from the public payload served to other viewers

#### Scenario: Public page hides the private note

- **WHEN** a visitor who is not the owner opens the public page of a published workout that has a private note
- **THEN** the note is not rendered and is absent from the public payload

#### Scenario: Administrator cannot see the private note

- **WHEN** an administrator opens `/admin/tracks` or its edit dialog
- **THEN** the private note is not shown and is absent from the administrative projection

#### Scenario: Another user cannot read the private note

- **WHEN** a signed-in user requests a workout they do not own
- **THEN** the system does not return the private note

## MODIFIED Requirements

### Requirement: A track's geometry has exactly one source

The system SHALL keep at most one geometry source per track. A `READY` track SHALL have exactly one source: its own GPX file and parsed metadata, or one linked route. A `PENDING` draft SHALL have no file, no route, and no metadata. A `READY` track SHALL NOT hold a file and a linked route at the same time. The system SHALL enforce this rule in the database as well as in the creation actions.

#### Scenario: Uploaded track owns its geometry

- **WHEN** a signed-in owner uploads a GPX file through the main track path
- **THEN** the stored track carries its own file and its own parsed metadata
- **AND** the track has no linked route
- **AND** its behavior is unchanged from before this change

#### Scenario: Manual track borrows geometry from a route

- **WHEN** a track is created from a route
- **THEN** the track stores no file and no metadata of its own
- **AND** it stores the linked route
- **AND** its recording data is entered by the owner, not parsed from a file

#### Scenario: The database rejects a track with no geometry source

- **WHEN** a write would leave a `READY` track with neither its own file nor a linked route
- **THEN** the database rejects the write

#### Scenario: The database rejects two geometry sources on one track

- **WHEN** a write would give a track both its own file and a linked route
- **THEN** the database rejects the write

#### Scenario: Draft track has no geometry source

- **WHEN** a `PENDING` draft is stored
- **THEN** it has no file, no route, and no metadata
- **AND** the database accepts the row

#### Scenario: Draft becomes ready when geometry is attached

- **WHEN** a `PENDING` draft receives a file or a route
- **THEN** its geometry state becomes `READY`
- **AND** it then satisfies the exactly-one-source rule

### Requirement: Manual track creation starts from a route

The system SHALL create a `READY` track without an uploaded file only from a route, either newly placed or already in the owner's library, and SHALL require the recording start and the duration before the track can be saved. A `PENDING` draft is the exception: it may be created without a route or file.

#### Scenario: Owner creates a track from an existing route

- **WHEN** a signed-in owner chooses an existing route and submits a recording start and a duration
- **THEN** the system stores a track linked to that route
- **AND** the track appears in the owner's tracks with the route's geometry

#### Scenario: Owner creates a track from a new route

- **WHEN** a signed-in owner places points for a new route and submits a recording start and a duration
- **THEN** the system stores the route and a track linked to it
- **AND** the route appears in the owner's route library with one linked track

#### Scenario: Recording data is incomplete

- **WHEN** a signed-in owner submits manual track creation without a recording start or without a duration
- **THEN** the system refuses the save with a validation message
- **AND** no track is stored

#### Scenario: One route backs several tracks

- **WHEN** a signed-in owner creates a second track from a route that already has a linked track
- **THEN** both tracks stay linked to the same route
- **AND** the route reports two linked tracks

#### Scenario: Draft creation does not require a route

- **WHEN** a signed-in owner creates a `PENDING` draft
- **THEN** the system stores no route and no file
- **AND** the draft is accepted with its recording values and private note

### Requirement: Public can browse published tracks

The system SHALL provide public track listing and detail pages that expose only published tracks with `READY` geometry.

#### Scenario: Visitor opens public track listing

- **WHEN** a visitor opens `/tracks`
- **THEN** the page lists published tracks with `READY` geometry
- **AND** it does not list draft or pending tracks

#### Scenario: Visitor opens public track detail

- **WHEN** a visitor opens `/tracks/[slug]` for a published track with `READY` geometry
- **THEN** the page displays the track title, description when present, linked GPX filename, file size, and updated timestamp
- **AND** it renders an interactive map only when current successful map-ready geometry is available

#### Scenario: Visitor opens missing or draft track detail

- **WHEN** a visitor opens `/tracks/[slug]` for a missing or draft track
- **THEN** the system responds as not found

#### Scenario: Visitor opens a published track without ready geometry

- **WHEN** a visitor opens `/tracks/[slug]` for a track whose status is `PUBLISHED` but whose geometry state is `PENDING`
- **THEN** the system responds as not found
- **AND** the public listing does not include that track
