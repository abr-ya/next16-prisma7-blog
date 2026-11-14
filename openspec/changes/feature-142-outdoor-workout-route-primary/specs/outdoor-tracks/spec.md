# Spec Delta

## ADDED Requirements

### Requirement: Owner can make a route the primary geometry of a file-based workout

The owner SHALL be able to make an owned route the primary geometry of a published workout. The route SHALL become primary and the workout's own file and parsed metadata SHALL move to one secondary `TrackGeometry` row in a single transaction. A workout that already has a primary route SHALL accept a replacement route, leaving its secondary file untouched. The owner SHALL confirm the public geometry change before it is written.

#### Scenario: Owner attaches an existing route

- **WHEN** the owner chooses one of their own routes for a file-based published workout and confirms
- **THEN** the route becomes the workout's primary geometry
- **AND** the workout's former file and parsed metadata are stored as one secondary file
- **AND** the map, distance, and point count resolve through the route

#### Scenario: Owner replaces the primary route

- **WHEN** the owner chooses a different route for a workout that already has a primary route and confirms
- **THEN** the chosen route becomes the primary geometry
- **AND** the existing secondary file and its metadata stay unchanged
- **AND** the map, distance, and point count resolve through the new route

#### Scenario: Owner creates a route while attaching it

- **WHEN** the owner places points for a new route in the attach flow
- **THEN** the system stores the route in the owner's route library
- **AND** the new route becomes the workout's primary geometry
- **AND** the route reports the workout as a linked track

#### Scenario: Recording data is preserved

- **WHEN** a workout with parsed recording values attaches or changes its route
- **THEN** its recording start, duration, timezone, and time source stay as they were
- **AND** a demoted file keeps its parsed metadata

#### Scenario: Presentation fields are preserved

- **WHEN** a workout attaches or changes its route
- **THEN** its title, slug, description, status, kind, activity type, gear, trip links, and private note stay unchanged

#### Scenario: Confirmation names the public change

- **WHEN** the owner chooses a route
- **THEN** a confirmation states that the public map, distance, and point count will come from the route
- **AND** it states that the current file remains available as the original recording
- **AND** no change is stored until the owner confirms

#### Scenario: Attaching a route does not create a track

- **WHEN** the owner attaches a route to an existing workout
- **THEN** no track row is added
- **AND** the owner's track count and quota usage do not change

#### Scenario: Route belongs to another owner

- **WHEN** the owner tries to attach a route they do not own
- **THEN** the system refuses the change with a validation error
- **AND** the workout keeps its current geometry

#### Scenario: Pending draft cannot use the action

- **WHEN** a workout is a pending draft
- **THEN** it has no published page and no attach action
- **AND** no file or route is moved

#### Scenario: A non-owner cannot attach a route

- **WHEN** a visitor, an ordinary user who does not own the workout, or an administrator acting outside the owner's workspace tries to attach a route
- **THEN** the system refuses the change
- **AND** the workout is unchanged

### Requirement: The route action is offered only on the owner's published track page

The system SHALL render the **Attach route** control only on the public track page when the viewer owns the track. It SHALL render **Change route** instead when the track already has a primary route. Anonymous visitors, other users, and administrators who do not own the track SHALL see no control. A draft workout SHALL have no page and no control until it is published.

#### Scenario: Owner sees the control

- **WHEN** the owner opens their published file-based track page
- **THEN** the page shows an **Attach route** control
- **AND** when the track already has a primary route it shows **Change route** instead

#### Scenario: Other viewers see no control

- **WHEN** an anonymous visitor, another user, or an administrator who does not own the track opens the page
- **THEN** the page shows no route control
- **AND** a direct request from that viewer is refused

#### Scenario: Draft has no control

- **WHEN** a workout is a draft
- **THEN** no public page exists for it
- **AND** the owner attaches a route only after publishing it


### Requirement: Route creation during the attach flow shows the recorded track

When the owner creates a new route while attaching it to a file-based workout, the placement map SHALL draw the workout's current parsed geometry beneath the placed points as a non-interactive reference. The reference SHALL NOT be saved as part of the route and SHALL NOT add, move, or select route points.

#### Scenario: Current track is drawn under the placed points

- **WHEN** the owner opens the new-route step from the attach flow for a workout with parsed map geometry
- **THEN** the map draws that geometry as a muted reference line
- **AND** the owner's placed points remain the only editable points

#### Scenario: Reference is not saved

- **WHEN** the owner saves the new route
- **THEN** the route contains only the points the owner placed
- **AND** the reference line's points are not stored

#### Scenario: Workout has no parsed geometry

- **WHEN** the workout's GPX file has no parsed map geometry
- **THEN** the map opens without a reference line
- **AND** the owner can still place and save the route

### Requirement: Public track page lists secondary files under the primary file's download rules

The public detail page of a published workout SHALL list each track-owned secondary file by name, size, and upload/update time. It SHALL expose a download link through an app-owned file route only when the file asset is active and has public or unlisted visibility. It SHALL NOT expose a provider URL. A track with no secondary files SHALL render no secondary-file section, and public listings SHALL NOT carry secondary files.

#### Scenario: Secondary file is publicly downloadable

- **WHEN** a published workout has a secondary file asset that is active and public or unlisted
- **THEN** its detail page shows the file with a download link through the app-owned file route
- **AND** it does not link directly to the provider URL

#### Scenario: Secondary file is not downloadable

- **WHEN** a secondary file asset is private or inactive
- **THEN** the detail page reports that its download is unavailable
- **AND** it exposes no download link or provider URL

#### Scenario: Track has no secondary files

- **WHEN** a track renders with no secondary files
- **THEN** its detail page shows no secondary-file section
- **AND** the public track list payload is unchanged

### Requirement: Deleting a workout retires its secondary files

Deleting a workout SHALL mark every track-owned secondary file asset as `PENDING_DELETE` in the same transaction as the track deletion. A route's own file SHALL stay untouched.

#### Scenario: Deleting a route-primary workout retires the secondary file

- **WHEN** the owner deletes a workout whose primary geometry is a route and whose original file is secondary
- **THEN** the workout is removed
- **AND** the secondary file asset is marked pending delete
- **AND** the route and its own file stay active

#### Scenario: The route can still back other workouts

- **WHEN** the deleted workout shared its route with another workout
- **THEN** the other workout keeps the route's geometry
- **AND** only the deleted workout's own secondary file is retired

### Requirement: Secondary files stay read-only in this slice

The public track page SHALL NOT offer the rename control or the point-cleanup action for a route-primary workout or any of its secondary files. A direct rename or cleanup request for such a workout SHALL be rejected without changing any file.

#### Scenario: Owner sees no file-edit controls

- **WHEN** the owner views a published workout whose primary geometry is a route
- **THEN** the page shows no rename control and no cleanup action
- **AND** the secondary file remains downloadable under the visibility rules

#### Scenario: A direct file-edit request is refused

- **WHEN** a rename or cleanup request targets a route-primary workout
- **THEN** the system rejects it
- **AND** the route and the secondary file stay unchanged

## MODIFIED Requirements

### Requirement: A track's geometry has exactly one source

The system SHALL keep at most one primary geometry source per track. A `READY` track SHALL have exactly one primary source: its own GPX file and parsed metadata, or one linked route. A `PENDING` draft SHALL have no file, no route, and no metadata. A `READY` track SHALL NOT hold its own primary file and a linked route at the same time. A `READY` track MAY additionally hold track-owned secondary GPX files with their own parsed metadata; secondary files are never primary and do not satisfy the primary-source rule. The system SHALL enforce the primary rule in the database as well as in the creation actions.

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
- **AND** it then satisfies the exactly-one-primary-source rule

#### Scenario: Track keeps its file as secondary when a route becomes primary

- **WHEN** a file-based `READY` track attaches a route
- **THEN** the route is its only primary source
- **AND** its former file and metadata are stored as a secondary file
- **AND** the database accepts the row

### Requirement: A draft workout is completed by attaching geometry

The system SHALL complete a `PENDING` draft when the owner attaches geometry, moving it to `READY`. The owner SHALL be able to upload a GPX file, choose an existing owned route, or create a new route. A route SHALL always become the primary geometry; a demoted file is allowed only as secondary geometry on an already-ready workout.

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
