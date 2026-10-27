## Purpose

Defines the track content capability: storing GPX-backed tracks, managing them from admin, exposing published track pages publicly, storing parsed GPX summaries with simplified map-ready geometry, and rendering public maps for published tracks when current map-ready geometry exists.

## Requirements

### Requirement: Track records store core GPX-backed information

The system SHALL store tracks with title, unique slug, optional description, publication status, required GPX file asset reference, nullable metadata shell, optional activity-type classification, owner, creation timestamp, and update timestamp.

#### Scenario: Track has required fields

- **WHEN** an authenticated admin creates a track with valid title, slug, status, and an eligible GPX file asset reference
- **THEN** the system stores the track with those values
- **AND** it records the creating user and timestamps

#### Scenario: Track slug conflicts

- **WHEN** an authenticated admin submits a track slug that is already used by another track
- **THEN** the system rejects the save with a validation error
- **AND** it preserves the existing track using that slug

#### Scenario: Track requires a GPX file asset

- **WHEN** an authenticated admin submits a track without a GPX file asset reference
- **THEN** the system rejects the save with a validation error
- **AND** it does not create or update the track

#### Scenario: Track rejects ineligible file asset

- **WHEN** an authenticated admin submits a track that references a missing, non-active, non-GPX-purpose, or already-bound file asset
- **THEN** the system rejects the save with a validation error
- **AND** it does not bind the ineligible file to the track

#### Scenario: Track can start without parsed metadata

- **WHEN** an authenticated admin creates or updates a track before GPX parsing succeeds
- **THEN** the system allows the track metadata shell to remain empty or unparsed
- **AND** later parse actions can populate parsed GPX summary fields

#### Scenario: Published track is eligible for public track pages

- **WHEN** a track has `PUBLISHED` status
- **THEN** the system MAY expose its visibility-safe metadata on public track pages
- **AND** public pages SHALL NOT expose private GPX provider URLs

### Requirement: Admin can manage tracks

The system SHALL provide an authenticated admin page for listing, creating, editing, and deleting track records.

#### Scenario: Admin opens tracks page

- **WHEN** an authenticated admin opens `/admin/tracks`
- **THEN** the page displays stored tracks with title, linked GPX file name, status, kind, and updated timestamp

#### Scenario: Admin creates track with GPX upload

- **WHEN** an authenticated admin uploads a valid GPX file and submits valid new track fields from the admin UI
- **THEN** the track appears in the admin tracks list
- **AND** the track references the uploaded GPX file asset

#### Scenario: Admin edits track metadata

- **WHEN** an authenticated admin updates editable metadata fields for an existing track
- **THEN** the system persists the changes
- **AND** it preserves the track identity

#### Scenario: Admin replaces track GPX file

- **WHEN** an authenticated admin uploads a new valid GPX file for an existing track and saves the change
- **THEN** the track references the new GPX file asset
- **AND** the previous file asset is not deleted automatically by this slice

#### Scenario: Admin deletes track

- **WHEN** an authenticated admin deletes a track
- **THEN** the track is removed from the admin tracks list
- **AND** the linked GPX file asset remains stored unless removed through existing file-management workflows

#### Scenario: Admin sees the kind of a track

- **WHEN** an authenticated admin views the admin tracks list
- **THEN** each listed track shows whether it is a route or a workout

### Requirement: Tracks are discoverable in admin navigation

The system SHALL expose the track admin page through the admin navigation for authenticated admins.

#### Scenario: Admin sees tracks navigation item

- **WHEN** an authenticated admin opens the admin area
- **THEN** the admin navigation includes a Tracks link that points to `/admin/tracks`

### Requirement: Public can browse published tracks

The system SHALL provide public track listing and detail pages that expose only published tracks.

#### Scenario: Visitor opens public track listing

- **WHEN** a visitor opens `/tracks`
- **THEN** the page lists published tracks
- **AND** it does not list draft tracks

#### Scenario: Visitor opens public track detail

- **WHEN** a visitor opens `/tracks/[slug]` for a published track
- **THEN** the page displays the track title, description when present, linked GPX filename, file size, and updated timestamp
- **AND** it renders an interactive map only when current successful map-ready geometry is available

#### Scenario: Visitor opens missing or draft track detail

- **WHEN** a visitor opens `/tracks/[slug]` for a missing or draft track
- **THEN** the system responds as not found

### Requirement: Public track GPX downloads respect file visibility

The system SHALL expose GPX download links on public track pages only when the linked GPX file asset is active and public-download eligible.

#### Scenario: Published track has public GPX file

- **WHEN** a published track references an active GPX file asset with `PUBLIC` or `UNLISTED` visibility
- **THEN** the public track detail page shows a GPX download link through an app-owned file route
- **AND** it does not link directly to the provider URL

#### Scenario: Published track has private GPX file

- **WHEN** a published track references an active GPX file asset with `PRIVATE` visibility
- **THEN** the public track detail page shows that the GPX download is unavailable
- **AND** it does not expose a download link or provider URL

#### Scenario: Published track has inactive GPX file

- **WHEN** a published track references a GPX file asset that is not active
- **THEN** the public track detail page shows that the GPX download is unavailable
- **AND** it does not expose a download link or provider URL

### Requirement: Tracks store parsed GPX summary metadata

The system SHALL parse eligible GPX-backed tracks into stored summary metadata that can be read without reparsing the uploaded GPX file during normal admin or public page rendering.

#### Scenario: Admin parses a valid GPX track

- **WHEN** an authenticated admin parses a track whose linked active `TRACK_GPX` file contains valid GPX track geometry
- **THEN** the system stores parsed metadata for the track
- **AND** the metadata includes parse status, parser version, parsed timestamp, source file identity, distance, bounds, elevation range when elevation exists, time range when timestamps exist, and point counts

#### Scenario: GPX has no elevation or timestamps

- **WHEN** an authenticated admin parses a valid GPX file that has coordinates but omits elevation or timestamp values
- **THEN** the system stores available geometry, distance, bounds, and point counts
- **AND** it leaves unavailable elevation or time summary fields empty instead of failing the parse

#### Scenario: Track uses stored parsed metadata

- **WHEN** an admin or visitor opens a track page after that track has parsed metadata
- **THEN** the system reads the stored summary metadata
- **AND** it does not parse the raw GPX file as part of the page request

### Requirement: Tracks store simplified map-ready geometry

The system SHALL store simplified map-ready geometry for parsed GPX tracks so public map components can render a lightweight polyline without reading the raw GPX file.

#### Scenario: Valid GPX creates map geometry

- **WHEN** an authenticated admin parses a track with valid GPX coordinate geometry
- **THEN** the system stores simplified map geometry for that track
- **AND** the geometry preserves route order, start point, end point, and track bounds
- **AND** the geometry contains fewer or equal coordinate points than the parsed source geometry

#### Scenario: Small GPX still creates usable geometry

- **WHEN** an authenticated admin parses a GPX file whose coordinate count is already small enough for public rendering
- **THEN** the system may store geometry with the original coordinate count
- **AND** it still records both source point count and rendered geometry point count

#### Scenario: Public map reads no raw file URLs

- **WHEN** public track data includes map-ready geometry
- **THEN** the public data SHALL NOT expose private provider URLs or raw GPX file URLs
- **AND** it SHALL expose only the stored geometry and visibility-safe track metadata needed for rendering

### Requirement: Track parse lifecycle is visible and retryable in admin

The system SHALL make GPX parse state visible to administrators and allow failed or stale parses to be retried without changing the track identity.

#### Scenario: Admin sees parsed track state

- **WHEN** an authenticated admin views `/admin/tracks` or a track edit surface for a parsed track
- **THEN** the UI displays that parsing succeeded
- **AND** it shows useful summary values such as distance, point count, and parsed timestamp when available

#### Scenario: Admin sees failed parse state

- **WHEN** a track parse fails because the linked file cannot be fetched, is not valid GPX XML, or contains no usable coordinates
- **THEN** the system records a failed parse state with a safe error message
- **AND** the admin UI displays the failure without exposing private provider details

#### Scenario: Admin retries parse

- **WHEN** an authenticated admin retries parsing for a track with failed or stale parsed metadata
- **THEN** the system attempts to parse the track's current linked GPX file
- **AND** it replaces the previous parse state with the latest success or failure result

#### Scenario: Replacing GPX marks metadata stale

- **WHEN** an authenticated admin replaces the GPX file linked to an existing track
- **THEN** the system SHALL prevent the old parsed metadata from being treated as current for the new file
- **AND** the admin UI SHALL make the track's parse state indicate that parsing is needed or pending

### Requirement: Public track pages show parsed summaries

The system SHALL show parsed GPX summary information on public track pages for published tracks when parsed metadata is available.

#### Scenario: Visitor sees parsed summary

- **WHEN** a visitor opens `/tracks/[slug]` for a published track with successful parsed metadata
- **THEN** the page displays visibility-safe summary values such as distance, elevation range when available, time range when available, and point counts
- **AND** it may render an interactive map when the parsed metadata includes current map-ready geometry

#### Scenario: Visitor sees unparsed fallback

- **WHEN** a visitor opens `/tracks/[slug]` for a published track without successful parsed metadata
- **THEN** the page still displays the existing track metadata and GPX download availability
- **AND** it does not fail because parsed metadata is missing

#### Scenario: Draft tracks remain private

- **WHEN** a visitor requests a draft track that has parsed metadata
- **THEN** the system responds as not found
- **AND** it does not expose the parsed summary or map-ready geometry

### Requirement: Public track detail renders a stored geometry map

The system SHALL render an interactive map on published track detail pages when the track has successful parsed map-ready geometry.

#### Scenario: Visitor opens parsed track detail

- **WHEN** a visitor opens `/tracks/[slug]` for a published track with successful parsed map-ready geometry
- **THEN** the page displays an interactive map for that track
- **AND** the map renders the stored route geometry as an ordered polyline
- **AND** the map viewport frames the route bounds

#### Scenario: Map identifies route endpoints

- **WHEN** the rendered track geometry contains at least two coordinate points
- **THEN** the map visually distinguishes the route start and end points
- **AND** the start and end points use the stored geometry order

#### Scenario: Public map uses stored metadata

- **WHEN** a visitor opens a track detail page with a rendered map
- **THEN** the system uses stored parsed metadata and map-ready geometry
- **AND** it does not parse or fetch the raw GPX file as part of rendering the map

### Requirement: Public track detail handles missing map geometry gracefully

The system SHALL preserve the published track detail page when map-ready geometry is unavailable.

#### Scenario: Visitor opens unparsed track detail

- **WHEN** a visitor opens `/tracks/[slug]` for a published track without successful map-ready geometry
- **THEN** the page displays the existing track metadata, GPX summary when available, and GPX download availability
- **AND** it shows a non-failing fallback instead of an interactive map

#### Scenario: Visitor opens stale or failed parsed track detail

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose parsed metadata is stale or failed
- **THEN** the page remains usable
- **AND** it does not expose stale or failed map geometry as a current route map

### Requirement: Public track map preserves visibility boundaries

The system SHALL render public track maps only through published track detail pages and visibility-safe stored metadata.

#### Scenario: Draft track has map geometry

- **WHEN** a visitor requests a draft track that has parsed map-ready geometry
- **THEN** the system responds as not found
- **AND** it does not expose the route map or geometry

#### Scenario: Map rendering avoids private file URLs

- **WHEN** the public track map renders for a published track
- **THEN** the page SHALL NOT expose UploadThing provider URLs or raw GPX file URLs for map rendering
- **AND** GPX download links continue to follow existing file visibility rules

### Requirement: Track timeline data supports future photo matching

The system SHALL plan for parsed track metadata to retain enough timestamped route context for future photo-to-track coordinate inference without reparsing raw GPX files during normal public page rendering.

#### Scenario: Parsed track has timestamped route points

- **WHEN** a GPX-backed track contains usable timestamps associated with route coordinates
- **THEN** future parsed metadata can expose a stored timeline representation suitable for matching photo capture times to positions along the track
- **AND** normal public hike map rendering still avoids fetching or parsing the raw GPX file

#### Scenario: Parsed track has no timestamped route points

- **WHEN** a GPX-backed track has coordinate geometry but no usable timestamps
- **THEN** the track can remain map-renderable as route geometry
- **AND** it is not treated as usable for timestamp-based photo coordinate inference

### Requirement: Parsed tracks may retain a compact timed timeline

The system SHALL allow successfully parsed GPX tracks to store a compact timestamped trackpoint timeline in track metadata when enough source points include usable times, so later photo-to-track coordinate inference can interpolate along the route without reparsing GPX during normal page rendering.

#### Scenario: GPX trackpoints include usable timestamps

- **WHEN** an authenticated admin parses or refreshes a GPX track whose trackpoints include usable timestamp values
- **THEN** the stored track metadata MAY include a downsampled timeline of time, latitude, and longitude points sufficient for along-route interpolation
- **AND** the existing simplified map geometry used for drawing remains available

#### Scenario: GPX track lacks usable timed points

- **WHEN** an authenticated admin parses or refreshes a GPX track that has no usable per-point timestamps
- **THEN** the stored track metadata omits a timed timeline or stores an empty/unavailable timeline state
- **AND** track summary start/end times may still exist when only range-level timestamps are available
- **AND** readers treat along-route interpolation as unavailable for that track

#### Scenario: Existing tracks without timeline remain readable

- **WHEN** an older successful track metadata payload has summary and map geometry but no timeline field
- **THEN** track admin and public surfaces continue to read the existing summary and geometry
- **AND** photo inference treats along-route interpolation as unavailable until the track is reparsed into a timeline-capable payload

#### Scenario: Timeline storage stays bounded

- **WHEN** a long GPX file contains a large number of timed trackpoints
- **THEN** the stored timeline SHALL be downsampled or otherwise capped so metadata remains suitable for JSON storage and normal page reads
- **AND** the system does not require public hike pages to re-fetch or reparse the original GPX file to place approved inferred photo markers

### Requirement: Track time summaries support matching spikes before full timelines exist

The system SHALL allow an admin track-time matching spike to use stored track recording time ranges when available, while recognizing that simplified map geometry without per-point timestamps is insufficient for precise along-track interpolation.

#### Scenario: Track has a usable recording time range

- **WHEN** a linked track has successful parse metadata with `time.start` and `time.end`
- **THEN** an admin matching spike may use that range to classify whether a photo capture time falls inside the track window
- **AND** the spike SHALL NOT claim precise along-track interpolation unless timestamped route points are available

#### Scenario: Track has geometry but no usable timestamps

- **WHEN** a linked track has map-ready geometry but no usable recording time summary
- **THEN** the track can remain map-renderable
- **AND** it is not treated as usable for timestamp-based photo matching candidates in the spike

#### Scenario: Compact timed timeline enables along-route inference

- **WHEN** a linked track retains a compact timed timeline from parse/refresh
- **THEN** admin photo coordinate review MAY interpolate along that timeline for inside-window candidates
- **AND** public hike pages still MUST NOT reparse raw GPX during normal rendering

### Requirement: Track day filtering is based on accepted temporal track data

The system SHALL plan track day filtering around accepted track timestamp data and the hike date model.

#### Scenario: Track geometry can be assigned to a hike day

- **WHEN** a linked published track has stored timestamp data that can be interpreted for one day in the hike date range
- **THEN** a future day-filtered hike map can include the matching track geometry or segment for that selected day

#### Scenario: Track spans multiple hike days

- **WHEN** a linked published track has stored timestamp data spanning more than one hike day
- **THEN** a future day-filtered hike map can show only the segment or portion accepted for the selected day
- **AND** the all-days view can still show the full visible track geometry

#### Scenario: Track date is unavailable or ambiguous

- **WHEN** a linked published track lacks usable timestamps or has unresolved timezone ambiguity
- **THEN** the track is not shown as confidently belonging to a single day in future day-filtered map views
- **AND** the track may remain visible in all-days views when it otherwise has map-ready geometry

### Requirement: Track form modal protects unsaved edits and uploads

The system SHALL prevent accidental dismissal of the admin track create/edit modal when the modal contains unsaved form edits or an unsaved uploaded GPX file.

#### Scenario: Pristine track modal closes normally

- **WHEN** an authenticated admin opens the track create or edit modal and makes no changes
- **THEN** closing the modal through the close button, escape key, or outside interaction closes it without an extra confirmation

#### Scenario: Dirty track modal asks before discard

- **WHEN** an authenticated admin changes any editable track field and then attempts to close the modal without saving
- **THEN** the system SHALL keep the track modal open
- **AND** it SHALL ask the admin to confirm discarding the unsaved changes before closing

#### Scenario: Uploaded GPX file is called out before discard

- **WHEN** an authenticated admin uploads a GPX file in the track modal and then attempts to close the modal before saving the track
- **THEN** the discard confirmation SHALL state that an uploaded GPX file exists and will be removed if the admin discards the modal
- **AND** cancelling the confirmation SHALL keep the modal open with the uploaded file still selected

#### Scenario: Confirmed discard closes modal

- **WHEN** an authenticated admin confirms discarding a dirty track modal
- **THEN** the system SHALL close the modal
- **AND** it SHALL reset unsaved form state so reopening the modal does not show the discarded values

#### Scenario: Successful save bypasses discard guard

- **WHEN** an authenticated admin successfully creates or updates a track from the modal
- **THEN** the modal SHALL close without showing the discard confirmation
- **AND** the saved GPX file SHALL remain attached to the track

### Requirement: Track summaries display recording start and finish times

The system SHALL display parsed GPX recording start and finish date-times on admin and public track summary surfaces when stored parsed time metadata is available.

#### Scenario: Admin track list shows recording times

- **WHEN** an authenticated admin views `/admin/tracks` and a track has successful parsed GPX time metadata
- **THEN** the track row SHALL show recording start and finish date-times
- **AND** it SHALL omit those values without failing when parsed time metadata is unavailable

#### Scenario: Public track list shows recording times

- **WHEN** a visitor views `/tracks` and a published track has successful parsed GPX time metadata
- **THEN** the track card SHALL show recording start and finish date-times
- **AND** draft tracks remain hidden according to existing visibility rules

#### Scenario: Public track detail shows recording times

- **WHEN** a visitor views `/tracks/[slug]` for a published track with successful parsed GPX time metadata
- **THEN** the detail page SHALL show recording start and finish date-times near the existing parsed summary values

#### Scenario: Hike linked track cards show recording times

- **WHEN** a visitor views `/hikes/[slug]` and linked published tracks have successful parsed GPX time metadata
- **THEN** each linked-track summary card SHALL show recording start and finish date-times when available

### Requirement: Track time summaries expose timezone evidence

The system SHALL make track timestamp timezone evidence visible enough for admins and readers to notice whether recording times came from UTC/offset-bearing GPX timestamps or from ambiguous timezone-free timestamps.

#### Scenario: GPX timestamps include UTC or offset evidence

- **WHEN** a parsed GPX track has timestamp strings that include `Z` or an explicit numeric UTC offset
- **THEN** the stored parsed metadata SHALL record that timezone evidence was present
- **AND** admin and public track summary displays SHALL identify the recording time as having UTC/offset evidence

#### Scenario: GPX timestamps omit timezone evidence

- **WHEN** a parsed GPX track has timestamp strings that parse as dates but do not include `Z` or an explicit numeric UTC offset
- **THEN** the stored parsed metadata SHALL record that timezone evidence is missing or ambiguous
- **AND** admin and public track summary displays SHALL identify the recording time as timezone ambiguous

#### Scenario: GPX has no usable timestamps

- **WHEN** a parsed GPX track has coordinates but no usable timestamp values
- **THEN** the system SHALL keep the track map-renderable when geometry exists
- **AND** recording start/finish and timezone evidence displays SHALL be omitted or shown as unavailable without failing the page

#### Scenario: Timezone evidence does not infer photo coordinates

- **WHEN** timezone evidence is displayed for a track
- **THEN** the system SHALL NOT automatically persist inferred photo coordinates from that evidence alone
- **AND** photo matching workflows still require their own accepted confidence and approval rules

### Requirement: Tracks retain a confirmed recording timezone

The system SHALL retain a validated recording timezone for a track's recording-time presentation independently of the timezone of the administrator who later views it. The administration list SHALL show each track's confirmed timezone or clearly identify an unconfirmed legacy value, and SHALL provide an authenticated administrator with a focused action to set or correct the value. The browser's timezone SHALL be offered as an explicit suggestion the administrator may apply; the system SHALL NOT pre-fill the field with it, and SHALL NOT treat it as persisted data without server-side validation.

The focused action SHALL reject an empty, malformed, or unsupported value. The track edit dialog SHALL accept a cleared field as "no confirmed timezone" and SHALL store the track without one.

#### Scenario: Administrator confirms browser-proposed timezone

- **WHEN** an administrator opens the recording-timezone action in a browser that reports a supported IANA timezone
- **THEN** the action offers that timezone as a suggestion the administrator can apply
- **AND** the field starts empty when the track carries no timezone of its own
- **AND** the administrator can explicitly save it for the track

#### Scenario: Administrator selects a different recording timezone

- **WHEN** an administrator sets the timezone for a track whose recording location uses a timezone other than the browser-proposed value
- **THEN** the administrator can select a different supported recording timezone
- **AND** the system persists that selected timezone with the track

#### Scenario: Server rejects an invalid timezone

- **WHEN** a recording-timezone update request contains a malformed or unsupported value
- **THEN** the system rejects the request with a validation error
- **AND** it does not change the track's timezone setting

#### Scenario: Owner clears the recording timezone

- **WHEN** an owner clears the recording-timezone field in the track edit dialog and saves
- **THEN** the system stores no confirmed recording timezone for that track
- **AND** the surfaces fall back to the explicit UTC rendering with the unconfirmed marker

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

### Requirement: Users can manage their own independent tracks from the public site

The system SHALL provide an authenticated `/my/tracks` page where a signed-in user can view and manage only tracks they own. The page SHALL list each owned track with its title, GPX filename, publication status, updated time, parse state when available, its kind, and any current trip association. It SHALL clearly identify tracks that are not attached to a trip.

#### Scenario: Owner opens My tracks

- **WHEN** a signed-in user opens `/my/tracks`
- **THEN** the system displays only that user's tracks, including both draft and published records
- **AND** it does not disclose another user's draft track, private file information, or management controls

#### Scenario: User has no tracks

- **WHEN** a signed-in user with no owned tracks opens `/my/tracks`
- **THEN** the system presents an empty state and an action to upload their first GPX track

#### Scenario: Anonymous visitor requests My tracks

- **WHEN** an anonymous visitor requests `/my/tracks`
- **THEN** the system requires authentication
- **AND** it does not render personal track records or upload controls

#### Scenario: Owner sees the kind of each track

- **WHEN** a signed-in user views `/my/tracks`
- **THEN** each listed track shows whether it is a route or a workout
- **AND** a track whose kind was never changed reads as a route

### Requirement: Users can upload an independent GPX track

The My tracks page SHALL let an authenticated user upload one valid GPX file and create a track they own without attaching it to a trip. The created track SHALL use the existing GPX file validation and ownership rules, default to draft visibility unless the user explicitly chooses an allowed publication status, and preserve the existing parsing lifecycle.

#### Scenario: User creates an unlinked track

- **WHEN** a signed-in user uploads an eligible GPX file and submits valid track details from `/my/tracks`
- **THEN** the system creates a track owned by that user
- **AND** the new track has no trip association
- **AND** the track appears in that user's My tracks list

#### Scenario: Upload is invalid or ineligible

- **WHEN** a user submits a missing, invalid, inactive, non-GPX-purpose, or already-bound file asset
- **THEN** the system rejects the creation
- **AND** it does not create a track or bind the file asset to one

### Requirement: Users can perform existing owner-scoped track actions from My tracks

The My tracks page SHALL expose the existing permitted owner actions for an owned track: edit its metadata and activity type, replace its GPX file, select its recording timezone, parse or reparse the GPX file, and delete the track with confirmation. Each action SHALL enforce ownership server-side and SHALL preserve existing public visibility, file-lifecycle, and parse-state behavior.

#### Scenario: Owner manages own track

- **WHEN** a signed-in user performs a permitted track action on a track they own from `/my/tracks`
- **THEN** the system applies the action according to the existing track validation rules
- **AND** it refreshes the personal list and any affected existing public or trip views

#### Scenario: User targets another user's track

- **WHEN** a signed-in user attempts a My tracks mutation for a track owned by another user
- **THEN** the system denies the request
- **AND** the other user's track and linked file asset remain unchanged

#### Scenario: GPX parse runs after timezone selection

- **WHEN** an administrator parses or reparses a track with a confirmed recording timezone
- **THEN** the parser stores GPX timestamps as their original absolute instants
- **AND** subsequent presentation uses the track's confirmed timezone without applying a browser-derived offset

### Requirement: Photo capture-time provenance remains explicit

The system SHALL retain a versioned capture-time provenance record identifying `GPS_UTC`, `EXIF_OFFSET`, or `EXIF_WALL_CLOCK`, its source file, UTC instant when authoritative, local wall-clock value when applicable, and timezone evidence. Photo cards SHALL NOT use the viewer browser timezone as the primary capture-time display. They SHALL show the source local time with a confirmed linked-track timezone when available, or clearly identify an unconfirmed camera-local value.

#### Scenario: GPS time is shown in linked track timezone

- **WHEN** a photo has `GPS_UTC` provenance and is linked to a track with recording timezone `Europe/Sofia`
- **THEN** its primary capture display renders the GPS instant in `Europe/Sofia`
- **AND** the card retains the GPS UTC instant and provenance for authorized inspection

#### Scenario: Camera local time has no confirmed timezone

- **WHEN** a photo has `EXIF_WALL_CLOCK` provenance without a linked confirmed track timezone
- **THEN** its primary capture display identifies the value as unconfirmed camera-local time
- **AND** it does not derive a UTC instant from browser or server timezone

### Requirement: Trip creator can attach an existing owned unlinked track from the public trip detail page

The system SHALL expose, on the public trip detail page, an `Add track` affordance that lets the trip creator attach one of their own unlinked tracks to the trip in a single submission. The system SHALL list, as candidates, only tracks that the trip creator owns (`Track.userId === viewer.id`) and that are not currently linked to any other trip (no `HikesToTracks` row exists for the track). Each candidate row SHALL expose a focused `Attach` action that calls the existing track-to-trip attach mutation and produces the same `HikesToTracks` row the admin attach flow already creates. The system SHALL refresh the linked tracks list on success and SHALL surface a localized error when the mutation fails.

#### Scenario: Creator attaches a track they own

- **WHEN** the trip creator opens the `Add track` affordance on `/trips/[slug]`, picks a track they own from the attach-existing list, and submits
- **THEN** the system creates one new `HikesToTracks` row linking that track to the trip
- **AND** the linked tracks list on the trip page refreshes to show the newly attached track
- **AND** no new `Track` or `FileAsset` row is created

#### Scenario: Creator has no unlinked tracks

- **WHEN** the trip creator opens the `Add track` affordance and owns no tracks that are not currently linked to a trip
- **THEN** the attach-existing list shows an empty state that directs the creator to the upload section
- **AND** the dialog stays open with the upload section usable

#### Scenario: Attach mutation fails

- **WHEN** the trip creator submits the attach action and the server rejects it (e.g. trust, quota, slug conflict, race with another attach)
- **THEN** the dialog stays open
- **AND** the system surfaces a localized error message
- **AND** no `HikesToTracks` row is created
- **AND** the linked tracks list on the trip page is unchanged

#### Scenario: Track owned by another user is not listed

- **WHEN** the trip creator opens the `Add track` affordance
- **THEN** the system lists only tracks the creator themselves owns
- **AND** the system does not list tracks owned by other users, even if those tracks are unlinked

#### Scenario: Track already attached to another trip is not listed

- **WHEN** the trip creator owns a track that already has a `HikesToTracks` row pointing at a different trip
- **THEN** the system does not list that track in the attach-existing candidates
- **AND** the creator cannot attach the same track to two different trips

### Requirement: Trip creator can upload a new GPX track from the public trip detail page and attach it to the same trip

The system SHALL let the trip creator upload a valid GPX file from the public trip detail page and create a new track they own in one workflow, with that new track attached to the same trip on success. The system SHALL validate the GPX file through the existing track-upload validation, enforce the existing trust and quota gates, write a new `FileAsset` (`purpose = TRACK_GPX`) and `Track` row, and create the `HikesToTracks` join in the same submission. When the trip is published, the created track SHALL also be published; when the trip is draft, the created track SHALL default to draft. The system SHALL refresh both the linked tracks list and any existing GPX parse summary on success.

#### Scenario: Creator uploads and attaches a new GPX in one submission

- **WHEN** the trip creator submits a valid GPX file and the required new-track fields from the upload section of the trip-side dialog
- **THEN** the system creates one new `Track` owned by the creator
- **AND** the system creates one new `FileAsset` (`purpose = TRACK_GPX`) bound to that track
- **AND** the system creates one new `HikesToTracks` row linking that track to the current trip
- **AND** all three writes succeed or all three fail atomically

#### Scenario: New track publication status follows the trip status

- **WHEN** the trip creator submits a successful upload against a published trip
- **THEN** the resulting `Track` is published at creation time and immediately visible on the trip page
- **WHEN** the trip creator submits a successful upload against a draft trip
- **THEN** the resulting `Track` defaults to draft status

#### Scenario: Upload is ineligible

- **WHEN** the trip creator submits a missing, invalid, inactive, non-GPX-purpose, or already-bound file asset
- **THEN** the system rejects the submission
- **AND** no `Track`, `FileAsset`, or `HikesToTracks` row is created

#### Scenario: Slug conflict

- **WHEN** the trip creator submits a slug that is already used by another track they own or by any other track
- **THEN** the system rejects the submission with a slug conflict error
- **AND** no `Track`, `FileAsset`, or `HikesToTracks` row is created
- **AND** the existing track using that slug is unchanged

### Requirement: Trip-side Add track affordance is gated by trust, ownership, and quota with localized feedback

The system SHALL expose the `Add track` affordance only to viewers who can act as the trip creator (the user who owns the trip record, plus an administrator acting on their behalf). The system SHALL apply the existing `track-upload` trust gate to the underlying server actions. The system SHALL render an enabled affordance for an eligible creator who still has remaining live-track quota, a disabled affordance with localized feedback for an eligible creator who has reached the quota, a hidden affordance for accepted trip participants and other authenticated non-owner viewers, and a hidden affordance for anonymous viewers with an inline sign-in guidance pattern. Disabled and hidden affordances SHALL NOT expose the existing `attachTrackToHike` or the new `createTrackAndAttachToHike` server actions to the viewer.

#### Scenario: Eligible creator with quota remaining

- **WHEN** a verified or trusted trip creator (or an administrator) views `/trips/[slug]` and has remaining live-track quota
- **THEN** the system renders an enabled `Add track` affordance
- **AND** opening it shows both the attach-existing list and the upload section

#### Scenario: Eligible creator has reached quota

- **WHEN** a verified or trusted trip creator (or an administrator) views `/trips/[slug]` and has no remaining live-track quota
- **THEN** the system renders a disabled `Add track` affordance with a localized quota-reached message
- **AND** clicking the affordance does not open the dialog

#### Scenario: Trip participant or non-owner viewer

- **WHEN** an authenticated viewer who is not the trip creator (for example, an accepted trip participant or any other user) views `/trips/[slug]`
- **THEN** the system does not render the `Add track` affordance
- **AND** neither the attach-existing nor the upload server actions are reachable from this page for that viewer

#### Scenario: Anonymous viewer

- **WHEN** an anonymous viewer requests `/trips/[slug]`
- **THEN** the system does not render the `Add track` affordance
- **AND** any direct call to the underlying server action is rejected with a sign-in error

#### Scenario: Trust gate denies ineligible creator

- **WHEN** an authenticated `NEW` or `RESTRICTED` trip creator (who is otherwise the owner of the trip) opens the trip-side dialog and submits
- **THEN** the system rejects the submission with the existing `track-upload` denial reason
- **AND** no `Track`, `FileAsset`, or `HikesToTracks` row is created

### Requirement: Trip-side Add track dialog reuses the shared GPX upload piece

The system SHALL use the same GPX upload component for the trip-side upload section as for the existing `/admin/tracks` and `/my/tracks` create flows. The shared component SHALL render the GPX dropzone, the file validation messaging, the parse-GPX affordance, and the cached uploaded-file affordance exactly once and SHALL be parameterized only by the consuming context (owner workspace vs trip contribution). The existing dirty-close guard, UploadThing buffer handling, and parse lifecycle SHALL remain identical for both consumers, and no duplication of those behaviors SHALL be introduced.

#### Scenario: Both consumers render the same upload UX

- **WHEN** the owner opens the existing `Add track` dialog on `/my/tracks` and the creator opens the trip-side `Add track` dialog on `/trips/[slug]`
- **THEN** both dialogs render the same GPX dropzone, validation messaging, and parse-GPX affordance
- **AND** the same UploadThing route, file size limit, and `purpose = TRACK_GPX` validation apply to both

#### Scenario: Dirty-close guard is not duplicated

- **WHEN** a viewer with unsaved uploaded GPX files closes either dialog
- **THEN** the dialog asks for confirmation through the existing dirty-close flow
- **AND** unsaved files are handled by the existing `markDiscardedTrackGpxFileAssetsPendingDelete` helper
- **AND** no parallel discard helper or guard state is introduced for the trip-side dialog

### Requirement: Owner can create a track by placing points on a map from the existing track workspace

The system SHALL expose, on both `/admin/tracks` (administrator) and `/my/tracks` (owner), a track creation path that does not require uploading a GPX file. The path SHALL render inside the existing track create/edit modal as an additional tab parallel to the existing GPX-upload section, SHALL let a verified, trusted, or administrator viewer place at least two ordered points on a Leaflet map by clicking, SHALL show the resulting route as an ordered polyline with a running total distance preview derived from the placed points, SHALL let the viewer reorder and remove individual points before saving, and SHALL submit the placed points together with the track's required text fields (title; optional description; optional status defaulting to DRAFT) to the existing track create flow.

#### Scenario: Owner opens the Place on map tab on My tracks

- **WHEN** a verified, trusted, or administrator viewer opens the track create modal from `/my/tracks`
- **THEN** the modal renders a `Place on map` tab alongside the existing `Upload GPX` tab
- **AND** selecting the tab shows an empty Leaflet map and a point list panel
- **AND** no GPX file is required to use the tab

#### Scenario: Viewer clicks on the map to add a point

- **WHEN** the viewer clicks an empty area of the map in the `Place on map` tab
- **THEN** the system appends a new ordered point at the clicked coordinate
- **AND** the point list panel shows the new point with its latitude and longitude and an ordinal index
- **AND** the polyline preview updates to include the new point
- **AND** the running total distance preview updates to reflect the added segment

#### Scenario: Viewer removes a point

- **WHEN** the viewer selects a point in the point list panel and confirms removal
- **THEN** the system removes that point from the ordered list
- **AND** the polyline preview and distance preview update accordingly

#### Scenario: Viewer reorders a point

- **WHEN** the viewer moves a point up or down within the point list panel
- **THEN** the system updates the ordered list
- **AND** the polyline preview and distance preview update to reflect the new order

#### Scenario: Viewer submits fewer than two points

- **WHEN** the viewer attempts to submit the `Place on map` tab with fewer than two placed points
- **THEN** the system rejects the submission with a localized validation message
- **AND** it does not call the create-track server action

#### Scenario: Eligible owner saves a track from a map

- **WHEN** a verified, trusted, or administrator viewer submits the `Place on map` tab with two or more points and valid required text fields
- **THEN** the system creates one new `Track` row owned by the viewer
- **AND** the track appears in the viewer's My tracks list and the admin tracks list
- **AND** the modal closes without showing the discard confirmation

#### Scenario: Ineligible trust cannot save

- **WHEN** a `NEW` or `RESTRICTED` viewer attempts to submit the `Place on map` tab
- **THEN** the system rejects the submission with the existing `track-upload` denial reason
- **AND** no `Track` or `FileAsset` row is created

#### Scenario: Verified viewer has reached the track quota

- **WHEN** a verified viewer (without trusted or administrator status) whose live-track count has reached the verified quota attempts to submit the `Place on map` tab
- **THEN** the system rejects the submission with the existing quota-reached message
- **AND** no `Track` or `FileAsset` row is created

#### Scenario: Slug conflict

- **WHEN** a viewer submits a slug that is already used by another track
- **THEN** the system rejects the submission with a localized slug conflict message
- **AND** no `Track` or `FileAsset` row is created
- **AND** the existing track using that slug is unchanged

### Requirement: Place on map submission produces a regular Track populated through the existing GPX parsing pipeline

The system SHALL create the new `Track` row from a `Place on map` submission through the same storage shape and parsing pipeline used by uploaded GPX tracks. The system SHALL build a GPX byte string server-side from the placed points, SHALL persist that byte string as a new `FileAsset` with `purpose = TRACK_GPX`, `ownerUserId = creator.id`, `visibility = PRIVATE`, and `status = ACTIVE`, SHALL bind the new `FileAsset` to the new `Track` via `Track.fileAssetId`, and SHALL run the same parse pipeline used for uploaded GPX tracks so that `Track.metadata` is populated with the same `TrackGpxMetadata` shape (parse status, parser version, parsed timestamp, source file identity, distance, bounds, point counts, and map-ready geometry). The same `createTrack` validation path that rejects missing or ineligible file assets SHALL treat the synthetic file asset as eligible because it carries the required `TRACK_GPX` purpose, `ACTIVE` status, and correct ownership.

#### Scenario: Synthetic GPX file asset is written

- **WHEN** a viewer successfully submits the `Place on map` tab with N placed points
- **THEN** the server creates exactly one new `FileAsset` with `purpose = TRACK_GPX`, `ownerUserId = creator.id`, `visibility = PRIVATE`, and `status = ACTIVE`
- **AND** the synthetic GPX contains exactly N `<trkpt>` elements in the placed order
- **AND** the synthetic GPX is uploaded via the existing `UTApi.uploadFiles` server-side helper so its storage location matches uploaded GPX files

#### Scenario: Track metadata is populated by the existing pipeline

- **WHEN** the synthetic GPX file asset has been written and bound to the new `Track`
- **THEN** the server runs the same parse pipeline used for uploaded GPX tracks against the synthetic GPX bytes
- **AND** the resulting `Track.metadata` carries the standard `TrackGpxMetadata` shape including successful parse status, summary distance equal to the sum of Haversine distances between consecutive placed points, bounds derived from the placed points, simplified map-ready geometry, and a recorded source-file reference pointing at the new synthetic `FileAsset`

#### Scenario: No schema or enum migration is required

- **WHEN** the slice is implemented
- **THEN** the `Track.fileAssetId` column remains required and unique
- **AND** the `FileAssetPurpose` enum is unchanged
- **AND** the `Track.metadata` JSON shape is unchanged
- **AND** no Prisma migration is required beyond what GPX uploads already use

#### Scenario: Manual track renders like a GPX track downstream

- **WHEN** a manual track has populated `Track.metadata`
- **THEN** the public trip linked-track cards, public track listing, public track detail page, admin track list, admin track edit modal, and combined trip map all render the manual track through the same `TrackMapViewModel` consumers used by GPX tracks
- **AND** no manual-track-specific rendering branch is added to those consumers

### Requirement: Manual tracks do not expose a public GPX download

The system SHALL mark every synthetic GPX file asset backing a manual track with `FileAsset.visibility = PRIVATE`. As a result, the existing public track detail page download affordance SHALL NOT render a download link for a manual track because the existing visibility rule only shows the link for `PUBLIC` or `UNLISTED` file assets.

#### Scenario: Public track detail hides the download link for a manual track

- **WHEN** a visitor opens `/tracks/[slug]` for a published manual track
- **THEN** the page renders the track title, description when present, parsed summary, and interactive map from the stored geometry
- **AND** it does not render a GPX download link
- **AND** it does not expose a GPX provider URL or raw GPX bytes
- **AND** it indicates that the GPX download is unavailable for this track

#### Scenario: Owner can still manage the manual track from My tracks

- **WHEN** the track owner opens `/my/tracks` and selects a manual track they own
- **THEN** the edit modal opens with the existing owner-scoped actions available for that track
- **AND** the existing `Parse` action against the synthetic GPX file succeeds because the file is active and of the required `TRACK_GPX` purpose

### Requirement: Place on map editor exposes a reusable shell for future track editing slices

The system SHALL structure the new `Place on map` flow so its map editor, ordered point list, distance preview, and form-fields slot are implemented inside a single reusable editor component. The system SHALL keep the existing track modal dirty-close guard pattern intact for the new tab and SHALL NOT introduce a parallel dirty-close guard. The shell SHALL be designed so a future slice that edits an existing track to remove bad points or segments can reuse it without duplicating the map, point list, or guard plumbing.

#### Scenario: Editor shell is self-contained

- **WHEN** a future slice reuses the editor shell component on a different surface (for example, editing an existing track)
- **THEN** the shell exposes the same map, point-list editor, distance preview, and form-fields slot
- **AND** the consuming surface supplies only the points, the form values, and the save callback
- **AND** the map and point-list behavior do not need to be reimplemented

#### Scenario: Dirty-close guard is shared with the existing modal

- **WHEN** a viewer changes a field or places a point in the `Place on map` tab and then attempts to close the modal without saving
- **THEN** the system keeps the modal open
- **AND** it asks the viewer to confirm discarding the unsaved changes before closing
- **AND** the existing track-modal discard helper handles any uploaded files (none in this slice, but the helper remains available without duplication)
- **AND** no second dirty-close guard or parallel discard helper is introduced

### Requirement: Place on map tab lets the viewer move and remove individual points on the map

The system SHALL let a viewer move an already-placed point to a new coordinate by dragging it on the map, and SHALL let a viewer remove a placed point by clicking it to select it and then pressing `Delete` or `Backspace`. The system SHALL render every placed point as a draggable map marker (round dot, teal by default) using `react-leaflet`'s built-in `Marker` drag. On `dragend`, the system SHALL update the point's `lat` and `lng` to the new coordinate and SHALL leave the point's index in the `points` array unchanged (drag is a position correction, not a reorder). The system SHALL select a point when the viewer clicks it; only one point is selected at a time, and the selected point renders in a contrasting color (orange) and slightly larger size. The system SHALL remove the selected point and clear the selection when the viewer presses `Delete` or `Backspace` while the event target is not an `<input>`, `<textarea>`, or `[contenteditable]`. The system SHALL stop event propagation in the marker click handler so the existing `ClickToAdd` does not also fire (and shall not add a duplicate point at the same coordinate).

#### Scenario: Dragging a point updates its coordinate but not its order

- **WHEN** a viewer presses a placed point on the map, drags it to a new coordinate, and releases
- **THEN** the system updates the point's `lat` and `lng` to the new coordinate
- **AND** the point's index in the `points` array is unchanged
- **AND** the dashed polyline through all points redraws through the new coordinate
- **AND** the side-list row for that point still shows the same numeric index

#### Scenario: Clicking a point selects it and changes its visual

- **WHEN** a viewer clicks a placed point on the map
- **THEN** the system marks the point as selected (visual: orange color, slightly larger size, `aria-label` of the form "Selected point N. Press Delete to remove.")
- **AND** any previously selected point is deselected
- **AND** no duplicate point is added at the same coordinate (the `ClickToAdd` handler does not fire)

#### Scenario: Delete removes the selected point

- **WHEN** a viewer has a point selected and presses `Delete`
- **THEN** the system removes the point from the `points` array
- **AND** the system clears the selection
- **AND** the dashed polyline redraws through the remaining points
- **AND** the side list renumbers the remaining rows

#### Scenario: Backspace removes the selected point

- **WHEN** a viewer has a point selected and presses `Backspace`
- **THEN** the system removes the point and clears the selection (same behavior as `Delete`)

#### Scenario: Typing in any form input does not delete a selected point

- **WHEN** a viewer has a point selected and types any character (including the letters `d`, `e`, `l`, `t`) into a form input on the dialog (title, slug, description, activity type, recording start, recording timezone, duration, status)
- **THEN** the system does not delete the selected point
- **AND** the selection persists until the viewer explicitly clicks empty map or another point, or presses `Delete`/`Backspace` while focus is outside a form input

#### Scenario: Clicking empty map clears the selection and adds a new point

- **WHEN** a viewer has a point selected and clicks an empty area of the map (not on a placed point)
- **THEN** the system clears the selection
- **AND** the system appends a new point at the clicked coordinate (existing `ClickToAdd` behavior, unchanged)

#### Scenario: Side-list remove and reorder still work

- **WHEN** a viewer uses the existing side-list `Trash2` button or the up/down reorder buttons
- **THEN** the system removes or reorders the point (existing behavior, unchanged)
- **AND** if a removed point was the selected point, the system clears the selection

### Requirement: Marker render switches from `CircleMarker` to `Marker` with a `divIcon`

The system SHALL render every placed point on the `Place on map` editor map as a `react-leaflet` `<Marker>` (not `<CircleMarker>`) with a `L.divIcon` round-dot icon that visually matches the previous `CircleMarker` (same approximate size, same teal `#0f766e` color for the unselected state, orange `#ea580c` and slightly larger for the selected state). The system SHALL mirror the in-repo `createEndpointIcon` pattern from `components/track-pages/track-map-leaflet.tsx:20-31` for the `divIcon` HTML so the editor and the public track map share the same visual building block.

#### Scenario: Unselected and selected markers are visually distinct

- **WHEN** a viewer looks at the editor map with no point selected
- **THEN** every placed point renders as a teal round dot of the default size
- **WHEN** a viewer clicks a point
- **THEN** that point renders as an orange round dot, visibly larger than the unselected dots, and the other points stay teal
- **WHEN** the viewer clicks another point or empty map
- **THEN** the highlight moves or clears, and no point stays in the selected color after the click resolves

### Requirement: No schema, server-action, or display-surface change in this slice

The system SHALL NOT add new schema columns, new enums, or migrate existing data. The system SHALL NOT change the signature of `CreateManualTrackInput`, `createManualTrack`, `createTrack`, or `parseTrackGpx`. The system SHALL NOT change the public track map, public track list, public track detail, admin track list, or hike linked-track card render path. The new affordances are scoped to the editor map widget inside `TrackFormDialog` and are session-local mutations of the existing `points` state that already participates in the dirty-close guard and the existing `placedPoints` submit payload.

#### Scenario: Editor affordances leave public and admin surfaces unchanged

- **WHEN** a viewer drags or click-selects-and-deletes points in the `Place on map` editor
- **THEN** no `prisma migrate` step is required for the new affordances
- **AND** the signature of `createManualTrack`, `createTrack`, and `parseTrackGpx` is unchanged
- **AND** the public track detail page, public track list card, admin track list row, and hike linked-track card render the manual track through the same path they used before
- **AND** the dirty-close guard still fires when a placed point is dragged, removed via keyboard, or removed via the side-list `Trash2` button

### Requirement: Place on map does not introduce a public entry-point in this slice

The system SHALL expose the `Place on map` creation path only inside the existing track workspace surfaces (`/admin/tracks` and `/my/tracks`) and SHALL NOT add a public-facing `Add track` entry-point on `/tracks`, on `/trips/[slug]`, or anywhere else outside the owner/admin workspace. Any future public entry-point (for example, an `Add track` affordance on `/trips/[slug]` for verified/trusted creators that places points and attaches the new track to the current trip in one submission) is a separate slice.

#### Scenario: Public trip detail does not render a Place on map control

- **WHEN** a visitor (including the trip creator) opens `/trips/[slug]`
- **THEN** the page does not render a `Place on map` control
- **AND** the existing `Add track` affordance from feature-110 (attach existing or upload GPX) remains the only trip-side track-creation affordance
- **AND** no new server action for placing points on the trip detail page is exposed

### Requirement: Track records may store optional manual time metadata

The system SHALL let a `Track` row additionally store an optional `recordingStartAt` (DateTime?), an optional `recordingDurationSeconds` (Int? stored as whole seconds), and a `timeSource` enum value drawn from `{ GPX, MANUAL, NONE }`. The system SHALL set `timeSource = GPX` for any track whose file asset was created by an uploaded GPX — including the initial upload and any future re-parse through the existing `parseTrackGpx` pipeline. The system SHALL set `timeSource = MANUAL` when the row was created from the `Place on map` tab and the creator supplied at least one of `recordingStartAt` or `recordingDurationSeconds`. The system SHALL set `timeSource = NONE` when the row was created from the `Place on map` tab and the creator supplied neither.

#### Scenario: GPX-backed track gets timeSource GPX on parse

- **WHEN** an administrator parses or re-parses a track whose `Track.fileAssetId` was created through the `Upload GPX` tab
- **THEN** the system stores `timeSource = GPX` on the track row alongside the existing parsed metadata
- **AND** the resulting public and admin summary surfaces identify the row as `GPX`-sourced

#### Scenario: GPX-backed track with no timestamps still gets timeSource GPX

- **WHEN** a GPX-backed track has coordinates but no `<time>` elements
- **THEN** `timeSource` is still `GPX`
- **AND** the existing recording-time "unavailable" fallback remains in place for the start/finish display

#### Scenario: Manual track with start and duration gets timeSource MANUAL

- **WHEN** a verified, trusted, or administrator viewer submits the `Place on map` tab with both `recordingStartAt` and `recordingDurationSeconds` filled
- **THEN** the system stores both values on the new track row
- **AND** it sets `timeSource = MANUAL`
- **AND** the resulting summary surfaces identify the row as `MANUAL`-sourced

#### Scenario: Manual track with only recording start gets timeSource MANUAL

- **WHEN** a viewer submits the `Place on map` tab with `recordingStartAt` filled and `recordingDurationSeconds` empty
- **THEN** the system stores the start value
- **AND** it stores null for `recordingDurationSeconds`
- **AND** it sets `timeSource = MANUAL`

#### Scenario: Manual track with neither start nor duration gets timeSource NONE

- **WHEN** a viewer submits the `Place on map` tab with both fields empty
- **THEN** the system stores null for both columns
- **AND** it sets `timeSource = NONE`
- **AND** the resulting summary surfaces identify the row as `NONE`-sourced

#### Scenario: Existing activityTypeId and recordingTimezone columns remain independent

- **WHEN** a viewer fills activity type only on the `Place on map` tab
- **THEN** the system stores the activity type and leaves `recordingStartAt` and `recordingDurationSeconds` null
- **AND** it sets `timeSource = NONE` because no timeline source was supplied

### Requirement: Place on map tab accepts four optional metadata fields

The system SHALL let the viewer fill four optional metadata fields on the `Place on map` tab inside `TrackFormDialog`: an activity-type select, a recording-start datetime input paired with an IANA recording-timezone select, a recording-duration input with a default `HH:MM` precision and an explicit "include seconds" toggle that switches the input to `HH:MM:SS` precision, and a read-only display of the derived `timeSource`. The system SHALL reuse the existing `getActiveTrackActivityTypes` helper for the activity-type select, the existing `lib/track-recording-timezone` helpers for the timezone select, and the existing `formatTrackDuration` helper for any display formatting. The system SHALL store `recordingDurationSeconds` as a whole-second `Int` regardless of the visible precision. The four fields SHALL render inside the existing `TrackEditor` `renderFormFields` slot, alongside the existing title/slug/description/status fields, on both `/admin/tracks` and `/my/tracks`.

#### Scenario: Activity-type select lists only active types with an Unclassified option

- **WHEN** a viewer opens the activity-type select on the `Place on map` tab
- **THEN** the dropdown shows every `TrackActivityType` row with `isActive = true`
- **AND** it shows an explicit "Unclassified" option at the top of the list
- **AND** selecting a type stores its `id` on `Track.activityTypeId`
- **AND** selecting "Unclassified" stores `null` on `Track.activityTypeId`
- **AND** the localized label uses the existing `nameEn` / `nameRu` resolution from feature-101

#### Scenario: Recording-start input accepts a datetime and IANA timezone

- **WHEN** a viewer enters a wall-clock datetime and an IANA timezone in the recording-start fields
- **THEN** the system converts the wall-clock value to a UTC instant using the selected timezone
- **AND** it stores the UTC instant on `Track.recordingStartAt`
- **AND** it stores the validated timezone on the existing `Track.recordingTimezone` column through `normalizeTrackRecordingTimezone`

#### Scenario: Recording-start with unsupported timezone is rejected

- **WHEN** a viewer submits a recording-start pair with a timezone the `normalizeTrackRecordingTimezone` helper rejects
- **THEN** the system rejects the submission with a localized validation message
- **AND** no `Track` or `FileAsset` row is created

#### Scenario: Duration default precision is HH:MM

- **WHEN** the viewer opens the duration input for the first time on a fresh `Place on map` tab
- **THEN** the input renders two numeric fields (hours and minutes) and stores `recordingDurationSeconds` as `(hours * 3600) + (minutes * 60)` on submit

#### Scenario: Duration with "include seconds" toggled on becomes HH:MM:SS

- **WHEN** the viewer toggles the "include seconds" switch on
- **THEN** the input renders three numeric fields (hours, minutes, seconds)
- **AND** on submit the system stores `recordingDurationSeconds` as `(hours * 3600) + (minutes * 60) + seconds`

#### Scenario: Duration left empty stores null

- **WHEN** the viewer leaves the duration fields empty
- **THEN** the system stores `recordingDurationSeconds = null`
- **AND** the `timeSource` display shows `NONE` until the viewer also supplies a recording start

#### Scenario: timeSource is shown read-only on the tab

- **WHEN** the viewer changes any of activity type, recording start, recording timezone, or duration
- **THEN** the displayed `timeSource` updates to `NONE`, `MANUAL`, or `GPX` accordingly
- **AND** the display is a read-only badge (no separate selector)

#### Scenario: Existing Upload GPX tab is not extended in this slice

- **WHEN** a viewer opens the existing `Upload GPX` tab on `TrackFormDialog`
- **THEN** the four new fields are not rendered there
- **AND** the existing GPX upload form keeps its current shape

### Requirement: Display surfaces are deferred to feature-113

The system SHALL NOT render `timeSource`, `recordingStartAt`, or `recordingDurationSeconds` on the public track detail page, public track list card, admin track list row, or hike linked-track card in this slice (feature-112). The system SHALL continue to render the pre-feature-112 output for these fields (the existing recording-time-unavailable fallback and any pre-existing summary lines) on those four surfaces. The display requirements for `timeSource` (as a localized badge) and the optional `recordingStartAt` / `recordingDurationSeconds` lines on the four surfaces are owned by the feature-113 (`feature-113-outdoor-track-time-source-display`) OpenSpec change and SHALL be added there.

#### Scenario: No display change on the four surfaces in feature-112

- **WHEN** a viewer opens the public track detail page, public track list card, admin track list row, or hike linked-track card after feature-112 ships
- **THEN** the rendered output for `timeSource`, `recordingStartAt`, and `recordingDurationSeconds` is identical to the pre-feature-112 output (these fields are persisted on `Track` but not yet displayed)
- **AND** the feature-113 OpenSpec change owns the display requirements for these fields on these four surfaces

### Requirement: Existing tracks are backfilled to timeSource GPX on migration

The system SHALL set `timeSource = GPX` for every `Track` row that exists at the time the schema migration is applied. The system SHALL leave `recordingStartAt` and `recordingDurationSeconds` null for those rows. The system SHALL continue to set `timeSource = GPX` on every subsequent parse or re-parse of any GPX-backed track.

#### Scenario: Pre-migration tracks become timeSource GPX after backfill

- **WHEN** the schema migration runs
- **THEN** every pre-existing `Track` row has `timeSource = GPX`
- **AND** `recordingStartAt` and `recordingDurationSeconds` remain null unless the row already had non-null values before the migration

#### Scenario: A re-parse keeps timeSource GPX

- **WHEN** an administrator re-parses an existing GPX-backed track after the migration
- **THEN** the system writes `timeSource = GPX` again
- **AND** the row's existing parsed metadata is replaced with the new parse result

### Requirement: Place on map submission persists the new fields through the existing create flow

The system SHALL persist the four optional fields through the existing `createManualTrack` server action without introducing a second server action. The system SHALL validate the input through the existing `getTrackData` / `ensureSlugAvailable` helpers, SHALL persist the four fields alongside the synthetic GPX file asset and the new `Track` row inside the same `prisma.$transaction` that already creates those rows, and SHALL derive `timeSource` server-side as specified in the previous requirements.

#### Scenario: Eligible viewer saves a manual track with all four fields

- **WHEN** a verified, trusted, or administrator viewer submits the `Place on map` tab with at least two placed points, a unique slug, and a non-null value in any of the four new fields
- **THEN** the system creates the new `Track` row with all four fields stored on the row
- **AND** the new row's `timeSource` reflects the supplied combination

#### Scenario: Quota, trust, slug, and validation failures stay distinct

- **WHEN** the new server-action input fails any existing `TRUST | QUOTA | SLUG | VALIDATION | INTERNAL` check
- **THEN** the system surfaces the same `code` vocabulary feature-111 established
- **AND** no `Track` or `FileAsset` row is created
- **AND** the rejection mapping for the new fields uses `VALIDATION` for malformed inputs (unparsable datetime, out-of-range duration, unsupported timezone) and inherits the other codes from the existing gates

### Requirement: Track surfaces render timeSource badge

The system SHALL render a localized `timeSource` badge on the public track detail page, public track list card, `/admin/tracks` row, and published-trip linked-track card whenever a track has a non-null `Track.timeSource`. The badge SHALL render the localized label for `GPX`, `MANUAL`, or `NONE` from the `TrackTimeSource` enum and SHALL appear on the same surface as the existing recording-time summaries.

#### Scenario: Public track detail renders GPX timeSource badge

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `GPX`
- **THEN** the page renders a `timeSource` badge labeled with the localized `GPX` label
- **AND** the existing `parsed.summary.time` block (start, finish, duration, recording timezone, timezone evidence) continues to render as the source of truth for GPX-sourced tracks

#### Scenario: Public track detail renders MANUAL timeSource badge with both optional lines

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `MANUAL`, `Track.recordingStartAt` is non-null, and `Track.recordingDurationSeconds` is non-null
- **THEN** the page renders a `timeSource` badge labeled with the localized `MANUAL` label
- **AND** the page renders a `Recording start` line whose value is `formatTrackRecordingDateTime(recordingStartAt, recordingTimezone)`
- **AND** the page renders a `Recording duration` line whose value is `formatTrackDuration(recordingDurationSeconds)`

#### Scenario: Public track detail renders MANUAL timeSource badge with start only

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `MANUAL`, `Track.recordingStartAt` is non-null, and `Track.recordingDurationSeconds` is null
- **THEN** the page renders the `timeSource` badge
- **AND** the page renders the `Recording start` line
- **AND** the page does not render the `Recording duration` line

#### Scenario: Public track detail renders MANUAL timeSource badge with duration only

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `MANUAL`, `Track.recordingStartAt` is null, and `Track.recordingDurationSeconds` is non-null
- **THEN** the page renders the `timeSource` badge
- **AND** the page does not render the `Recording start` line
- **AND** the page renders the `Recording duration` line

#### Scenario: Public track detail renders NONE timeSource badge with no extra lines

- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose `Track.timeSource` is `NONE`
- **THEN** the page renders a `timeSource` badge labeled with the localized `NONE` label
- **AND** the page does not render the `Recording start` line
- **AND** the page does not render the `Recording duration` line

#### Scenario: Public track list card renders the same badge and conditional lines

- **WHEN** a visitor opens `/tracks` and a listed published track has any `Track.timeSource`
- **THEN** the card for that track renders the `timeSource` badge
- **AND** the card renders the `Recording start` line only when `timeSource` is `MANUAL` and `recordingStartAt` is non-null
- **AND** the card renders the `Recording duration` line only when `timeSource` is `MANUAL` and `recordingDurationSeconds` is non-null

#### Scenario: Admin track list row renders the same badge and conditional lines

- **WHEN** an authenticated administrator opens `/admin/tracks`
- **THEN** every track row renders the `timeSource` badge whenever `Track.timeSource` is non-null
- **AND** the row renders the `Recording start` line only when `timeSource` is `MANUAL` and `recordingStartAt` is non-null
- **AND** the row renders the `Recording duration` line only when `timeSource` is `MANUAL` and `recordingDurationSeconds` is non-null

#### Scenario: Trip linked-track card renders the same badge and conditional lines

- **WHEN** a visitor opens `/trips/[slug]` and a linked track has any `Track.timeSource`
- **THEN** the linked-track card for that track renders the `timeSource` badge alongside the existing recording-time summaries
- **AND** the card renders the `Recording start` line only when `timeSource` is `MANUAL` and `recordingStartAt` is non-null
- **AND** the card renders the `Recording duration` line only when `timeSource` is `MANUAL` and `recordingDurationSeconds` is non-null

#### Scenario: Track surfaces do not duplicate GPX times through the MANUAL lines

- **WHEN** any of the four surfaces renders a track whose `Track.timeSource` is `GPX`
- **THEN** the surface does not render the `Recording start` line or the `Recording duration` line for that track
- **AND** the existing `parsed.summary.time` block (where present) remains the single source of truth for that track's GPX-derived recording times

### Requirement: Track read projections expose timeSource and optional MANUAL metadata

The system SHALL include `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` in the read-side projections returned to the public track detail page, the public track list, the admin track list, and the public trip linked-track card surfaces. The projections SHALL continue to expose `recordingTimezone` so the existing `formatTrackRecordingDateTime` formatter can render the localized wall-clock value for a MANUAL `Recording start` line without an additional query.

#### Scenario: Public track detail projection includes the new fields

- **WHEN** the public track detail data layer selects a published track for `/tracks/[slug]`
- **THEN** the resulting projection contains `recordingStartAt: Date | null`, `recordingDurationSeconds: number | null`, and `timeSource: TrackTimeSource | null` alongside the existing `recordingTimezone`

#### Scenario: Public track list projection includes the new fields

- **WHEN** the public track list data layer selects published tracks for `/tracks`
- **THEN** each row projection contains `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` alongside the existing `recordingTimezone`

#### Scenario: Admin track list projection includes the new fields

- **WHEN** the admin track list data layer selects tracks for `/admin/tracks`
- **THEN** each row projection contains `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` alongside the existing `recordingTimezone`

#### Scenario: Trip linked-track card projection includes the new fields

- **WHEN** the public trip linked-track card data layer selects linked tracks for `/trips/[slug]`
- **THEN** each linked-track projection contains `recordingStartAt`, `recordingDurationSeconds`, and `timeSource` alongside the existing `recordingTimezone`

### Requirement: GPX tracks keep parsed times as the source of truth and mirror them into the new columns

The system SHALL persist `Track.recordingStartAt` and `Track.recordingDurationSeconds` for a track whose `Track.timeSource` is `GPX` whenever the parsed GPX has a usable `summary.time`. The system SHALL set `Track.recordingStartAt` to the absolute instant of `metadata.summary.time.start` and `Track.recordingDurationSeconds` to the integer `metadata.summary.time.durationSeconds` as part of the same `parseTrackGpx` write that already stores `Track.metadata`. When the parsed GPX has no usable `summary.time` (no `<time>` elements), the system SHALL set both columns to `null`. The system SHALL continue to populate `Track.metadata.summary.time` through the existing `parseTrackGpx` pipeline as the authoritative GPX source; the column values are a column-level mirror of that summary so the public and admin surfaces can read a single field.

`parseTrackGpx` SHALL preserve the existing `Track.timeSource` value on every write. The only transition handled by `parseTrackGpx` is `null → "GPX"` (so a fresh row that has never been classified becomes GPX-sourced on first parse); a row whose `Track.timeSource` is already `"MANUAL"` or `"NONE"` keeps that classification through every subsequent (re-)parse, and a misclassified legacy row does not get auto-corrected by `parseTrackGpx`. The only path that reclassifies a row from `"GPX"` to `"MANUAL"` is the explicit owner-driven `markTrackAsManual` server action.

#### Scenario: GPX upload populates the new columns from the parsed summary

- **WHEN** an administrator uploads or re-parses a GPX-backed track whose parsed `metadata.summary.time` is non-null with `start` and `durationSeconds`
- **THEN** the resulting `Track.recordingStartAt` is the absolute instant of `metadata.summary.time.start`
- **AND** `Track.recordingDurationSeconds` equals `metadata.summary.time.durationSeconds`
- **AND** `Track.metadata.summary.time` continues to carry the parsed start, finish, duration, and timezone evidence for that track

#### Scenario: GPX track with no usable parse times leaves the new columns null

- **WHEN** a track has `Track.timeSource = GPX` and the parsed `metadata.summary.time` was `null` (no `<time>` elements)
- **THEN** `Track.recordingStartAt` and `Track.recordingDurationSeconds` are `null`
- **AND** `Track.timeSource` remains `GPX`
- **AND** the public track detail page, public track list card, admin track list row, and trip linked-track card show the existing recording-time "unavailable" fallback for that track
- **AND** they do not render the `Recording start` or `Recording duration` lines for that track

#### Scenario: Re-parse of a MANUAL track keeps timeSource = MANUAL

- **WHEN** an owner or administrator triggers a `parseTrackGpx` re-parse for a track whose `Track.timeSource` is `MANUAL` (for example a legacy `Place on map` track whose synthetic GPX was re-parsed after this slice)
- **THEN** `Track.recordingStartAt` and `Track.recordingDurationSeconds` are overwritten with the freshly parsed values
- **AND** `Track.timeSource` remains `MANUAL`
- **AND** the next read of the four display surfaces keeps the `Source: Manual` badge

#### Scenario: First parse of a never-classified row sets timeSource = GPX

- **WHEN** `parseTrackGpx` runs for a row whose `Track.timeSource` is `null` (a fresh row that has never been classified)
- **THEN** the write sets `Track.timeSource` to `"GPX"` in the same update that stores `Track.metadata`

### Requirement: Owner or admin can edit recordingStartAt and recordingDurationSeconds on a MANUAL track

The system SHALL accept updates to `Track.recordingStartAt`, `Track.recordingDurationSeconds`, and the existing `Track.recordingTimezone` for a track whose `Track.timeSource === "MANUAL"` through a dedicated server action that enforces the same ownership and trust gate the other track mutations already enforce. The system SHALL require a non-empty IANA `recordingTimezone` whenever `recordingStartAt` is supplied and SHALL convert the supplied wall-clock value to a UTC instant through the existing `parseManualTrackStartAt` helper before persisting. The system SHALL accept `recordingDurationSeconds` as a non-negative whole number of seconds and SHALL reject any negative or non-integer value. The system SHALL keep `Track.timeSource` unchanged by this action; the row remains `MANUAL` after the edit. After the write, the system SHALL revalidate the track detail path and the trip detail path for every `HikesToTracks` association, matching the existing `updateTrackRecordingTimezone` action.

#### Scenario: MANUAL edit with both fields writes the columns

- **WHEN** an authenticated owner or administrator submits a valid `recordingStartAt` wall-clock + IANA timezone pair and a valid `recordingDurationSeconds` value for a `MANUAL` track they own through the edit dialog
- **THEN** the system stores the converted `recordingStartAt` UTC instant on the row
- **AND** it stores `recordingDurationSeconds` on the row
- **AND** the row's `timeSource` remains `MANUAL`
- **AND** subsequent reads of the row from the four display surfaces show the new start and duration

#### Scenario: MANUAL edit with start only clears duration

- **WHEN** the owner submits `recordingStartAt` and a timezone, and leaves `recordingDurationSeconds` empty, for a `MANUAL` track they own
- **THEN** the system stores the new `recordingStartAt`
- **AND** it stores `null` for `recordingDurationSeconds`
- **AND** the row's `timeSource` remains `MANUAL`

#### Scenario: MANUAL edit with duration only clears start

- **WHEN** the owner submits `recordingDurationSeconds` and leaves `recordingStartAt` empty, for a `MANUAL` track they own
- **THEN** the system stores the new `recordingDurationSeconds`
- **AND** it stores `null` for `recordingStartAt`
- **AND** the row's `timeSource` remains `MANUAL`

#### Scenario: MANUAL edit rejects unsupported timezone

- **WHEN** the owner submits a `recordingStartAt` wall-clock with a timezone the existing `parseManualTrackStartAt` / `normalizeTrackRecordingTimezone` helpers reject
- **THEN** the system rejects the submission with a localized validation error
- **AND** the row's `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` are unchanged

#### Scenario: MANUAL edit rejects negative or non-integer duration

- **WHEN** the owner submits a `recordingDurationSeconds` value that is negative, non-integer, or otherwise out of the accepted range
- **THEN** the system rejects the submission with a localized validation error
- **AND** no write to the row occurs

#### Scenario: Edit denied for a track the caller does not own

- **WHEN** an authenticated caller who is not the owner of a `MANUAL` track and is not an administrator attempts to call the new server action
- **THEN** the system rejects the request
- **AND** the row is unchanged

#### Scenario: Edit denied for a GPX or NONE track

- **WHEN** an owner or administrator attempts to call the new server action for a track whose `Track.timeSource` is `GPX` or `NONE`
- **THEN** the system rejects the request
- **AND** the row is unchanged
- **AND** the caller is expected to use the existing parse / create / replace-GPX paths for those rows

### Requirement: Track edit dialog reflects and accepts the saved MANUAL or GPX recording metadata

The system SHALL pre-fill the track edit dialog's `Recording start`, `Recording timezone`, and `Recording duration` inputs from the saved `Track` row when an owner or administrator opens the dialog. For a row whose `Track.timeSource === "MANUAL"`, the four inputs SHALL be editable and the submit handler SHALL dispatch the `updateTrackRecordingMetadata` server action so the values the owner types persist. For a row whose `Track.timeSource === "GPX"`, the recording start and the recording duration SHALL render read-only with a localized "from file" hint, while the `Recording timezone` input SHALL stay editable: a GPX file names a UTC offset rather than a zone, so the timezone is the one recording field the owner owns. For that row the submit handler SHALL NOT call `updateTrackRecordingMetadata` and SHALL call `updateTrackRecordingTimezone` with the timezone the owner typed. The system SHALL pre-fill from the saved values for any row regardless of `timeSource` so re-opening a previously edited `MANUAL` row shows the values the owner typed the last time.

#### Scenario: Edit dialog loads saved MANUAL values

- **WHEN** an owner or administrator opens the track edit dialog for a `MANUAL` track that already has `recordingStartAt`, `recordingTimezone`, and `recordingDurationSeconds` set
- **THEN** the `Recording start` input shows the saved wall-clock value in the saved timezone
- **AND** the `Recording timezone` input shows the saved timezone
- **AND** the `Recording duration` inputs show the saved hours, minutes, and (when applicable) seconds
- **AND** the four inputs are editable

#### Scenario: Edit dialog loads saved GPX values as read-only

- **WHEN** an owner or administrator opens the track edit dialog for a `GPX` track that already has `recordingStartAt`, `recordingTimezone`, and `recordingDurationSeconds` set from a previous parse
- **THEN** the recording start and the recording duration inputs show the parsed values read-only with a localized "from file" hint
- **AND** the `Recording timezone` input shows the saved timezone and stays editable
- **AND** submitting the dialog does not call the `updateTrackRecordingMetadata` action

#### Scenario: Submitting a MANUAL edit persists the typed values

- **WHEN** an owner or administrator types new values into the four editable inputs on a `MANUAL` track and submits the dialog
- **THEN** the system calls the existing `updateTrack` action for the base fields
- **AND** it calls the `updateTrackRecordingMetadata` action for the four recording-metadata fields
- **AND** re-opening the dialog on the same row shows the newly typed values

#### Scenario: Submitting a GPX edit persists the typed timezone

- **WHEN** an owner or administrator types a different recording timezone into a `GPX` track's edit dialog and submits the dialog
- **THEN** the system calls the `updateTrackRecordingTimezone` action with that timezone
- **AND** the recording start and the recording duration stay unchanged
- **AND** the surfaces show the recording time in the newly saved timezone

#### Scenario: Re-opening a MANUAL track after save no longer resets the fields

- **WHEN** an owner or administrator closes the edit dialog after a successful `MANUAL` save and re-opens it on the same row
- **THEN** the four inputs show the values that were just saved
- **AND** none of the four fields appear empty or zeroed

#### Scenario: GPX row with no usable parse times shows the unavailable fallback

- **WHEN** an owner or administrator opens the track edit dialog for a `GPX` track whose `recordingStartAt` and `recordingDurationSeconds` are both `null` because the parsed GPX had no `<time>` elements
- **THEN** the recording start and the recording duration are read-only
- **AND** the `Recording start` and `Recording duration` rows show the existing recording-time "unavailable" fallback instead of empty inputs

### Requirement: Owner or admin can reclassify a misclassified GPX track to MANUAL

The system SHALL expose a dedicated `markTrackAsManual` server action that an owner or administrator can call for a track whose `Track.timeSource` is currently `"GPX"`. The action SHALL set `Track.timeSource` to `"MANUAL"` and SHALL revalidate the track detail path and the trip detail path for every `HikesToTracks` association, matching the existing `updateTrackRecordingMetadata` revalidation. The action SHALL reject the call with a localized error when the row is already `MANUAL` and SHALL return `NOT_FOUND` for a row the caller does not own. The action SHALL be the only path that transitions a row from `GPX` to `MANUAL`; `parseTrackGpx` never does this automatically. The action SHALL accept the call regardless of whether `recordingStartAt`, `recordingDurationSeconds`, or `recordingTimezone` is populated — the absence of any timed timeline is itself evidence that the row was misclassified as `GPX`, and the owner can supply the missing columns through the edit form after the reclassification.

#### Scenario: Reclassify a legacy misclassified GPX track with metadata to MANUAL

- **WHEN** an owner or administrator calls `markTrackAsManual` for a track whose `Track.timeSource` is `"GPX"` and whose `recordingStartAt` is non-null
- **THEN** the system sets `Track.timeSource` to `"MANUAL"`
- **AND** the row's `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` columns are unchanged
- **AND** the next read of the four display surfaces shows the `Source: Manual` badge
- **AND** the `Recording start` and `Recording duration` lines render for that track

#### Scenario: Reclassify a no-timeline GPX track to MANUAL

- **WHEN** an owner or administrator calls `markTrackAsManual` for a track whose `Track.timeSource` is `"GPX"` and whose `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` are all `null` or empty (the "no timed timeline" case the system already surfaces through the `No timed timeline` badge)
- **THEN** the system sets `Track.timeSource` to `"MANUAL"`
- **AND** the row's `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` remain `null`
- **AND** the next read of the four display surfaces shows the `Source: Manual` badge and the recording-metadata inputs become editable
- **AND** the owner is expected to supply `recordingStartAt` / `recordingTimezone` / `recordingDurationSeconds` through the edit form afterwards

#### Scenario: Reclassify is a no-op when the track is already MANUAL

- **WHEN** an owner or administrator calls `markTrackAsManual` for a track whose `Track.timeSource` is already `"MANUAL"`
- **THEN** the system rejects the call with a localized error
- **AND** no write to the row occurs

#### Scenario: Reclassify denied for a track the caller does not own

- **WHEN** an authenticated caller who is not the owner of the `GPX` track and is not an administrator attempts to call `markTrackAsManual`
- **THEN** the system rejects the request
- **AND** the row is unchanged

### Requirement: Track edit dialog and table row surface a Mark as manual control for misclassified GPX rows

The system SHALL render a `Mark as manual` control in two places for a `GPX` row, gated on complementary predicates that cover the two distinct misclassification cases the system recognizes:

1. Inside the track edit dialog, as a button rendered below the read-only recording-metadata inputs. The button SHALL be visible when `Track.timeSource === "GPX"` AND at least one of `recordingStartAt`, `recordingDurationSeconds`, or `recordingTimezone` is non-null — the "owner supplied timing, but Source is wrong" case (legacy misclassification). The button is hidden for `GPX` rows whose three recording columns are all `null` and for `MANUAL` rows.
2. In the admin tracks table row, as a clickable variant of the existing `Source: …` badge. The badge SHALL be visible as the clickable, warning-styled variant when `Track.timeSource === "GPX"` AND `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` are all `null` or empty — the "no timed timeline" case, where the system already renders the `No timed timeline` fallback. The badge SHALL be the static `secondary` variant for `GPX` rows that have at least one recording column populated (so the table does not double up with the in-dialog button) and for `MANUAL` rows.

Clicking either control SHALL open a `ConfirmDialog` (the same shared dialog component the delete and timezone dialogs already use) with a localized title, description, and confirm button. On confirm, the system SHALL call the `markTrackAsManual` server action described in the previous requirement. On `{ ok: true }` the dialog SHALL close and the track list SHALL refresh with the `Source: Manual` badge. On `{ ok: false }` a localized error toast SHALL surface and the dialog SHALL stay open. The in-dialog button keeps its existing inline-error rendering; the row-level badge keeps its existing `markingAsManualId` pending indicator.

#### Scenario: In-dialog Mark as manual button appears for a misclassified GPX row with metadata

- **WHEN** an owner or administrator opens the track edit dialog for a `GPX` track that has at least one recording-metadata column populated
- **THEN** the `Mark as manual` button is visible below the read-only inputs
- **AND** the four inputs above it stay read-only with the localized "from file" hint

#### Scenario: In-dialog Mark as manual button is hidden for a true GPX row with no metadata

- **WHEN** an owner or administrator opens the track edit dialog for a `GPX` track whose `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` are all `null` or empty
- **THEN** the `Mark as manual` button is not rendered
- **AND** the owner is expected to use the row-level `Source: GPX` badge to reclassify the row, or to supply metadata through the form

#### Scenario: Clicking the in-dialog Mark as manual refreshes the row to MANUAL

- **WHEN** an owner or administrator clicks the in-dialog `Mark as manual` button on a misclassified `GPX` track that has at least one recording column populated
- **THEN** the system calls `markTrackAsManual` for that row
- **AND** on `{ ok: true }` the dialog closes and the track list refreshes with the `Source: Manual` badge
- **AND** on `{ ok: false }` the dialog stays open and a localized error message is rendered next to the button

#### Scenario: Row-level Source: GPX badge is clickable and visually distinct for a no-timeline row

- **WHEN** the admin tracks table renders a `GPX` row whose `recordingStartAt`, `recordingDurationSeconds`, and `recordingTimezone` are all `null` or empty
- **THEN** the `Source: GPX` badge in that row is rendered with the warning-style outline variant (visually distinct from the static `Source: …` badge)
- **AND** the badge is a focusable, keyboard-activatable button with a localized `aria-label`
- **AND** clicking or pressing Enter on the badge opens a `ConfirmDialog` with a localized title, description, and confirm button

#### Scenario: Row-level Source: GPX badge is not clickable for a true GPX row with metadata

- **WHEN** the admin tracks table renders a `GPX` row that has at least one recording-metadata column populated
- **THEN** the `Source: GPX` badge is rendered as the static `secondary` variant
- **AND** the badge has no click handler, no focus ring, and no warning style
- **AND** the owner is expected to reclassify the row through the in-dialog `Mark as manual` button instead

#### Scenario: Row-level Source: GPX badge is not clickable for a MANUAL row

- **WHEN** the admin tracks table renders a `MANUAL` row
- **THEN** the `Source: Manual` badge is rendered as the static `secondary` variant
- **AND** the badge has no click handler, no focus ring, and no warning style

#### Scenario: Confirming the row-level dialog reclassifies the row

- **WHEN** an owner or administrator confirms the `ConfirmDialog` opened by the row-level `Source: GPX` badge
- **THEN** the system calls `markTrackAsManual` for that row
- **AND** on `{ ok: true }` the dialog closes, a localized success toast surfaces, and the track list refreshes with the `Source: Manual` badge
- **AND** on `{ ok: false }` the dialog stays open and a localized error toast surfaces

### Requirement: Owner marks a track as a personal workout

The system SHALL store a kind on every track, either a route or a workout. A track's kind SHALL default to a route, SHALL be settable by the track's owner from the shared track form, and SHALL remain editable afterwards. Both track creation paths — GPX upload and Place on map — SHALL store the kind the owner selected. The kind SHALL be a private classification: it SHALL be visible to the owner and to administrators in the track lists and the track form, and SHALL NOT be rendered on public track pages, public track lists, or trip cards. The kind SHALL NOT by itself restrict which tracks may be attached to a trip.

#### Scenario: Owner marks a track as a workout

- **WHEN** a signed-in user selects the workout kind for a track they own and saves
- **THEN** the system stores the workout kind on that track
- **AND** the track's list row shows it as a workout

#### Scenario: New track defaults to a route

- **WHEN** a track is created without an explicitly selected kind
- **THEN** the system stores the route kind on it

#### Scenario: Both creation paths store the selected kind

- **WHEN** a signed-in user creates a track with the workout kind selected through the GPX upload path or through the Place on map path
- **THEN** the created track carries the workout kind in both cases

#### Scenario: The kind stays private

- **WHEN** a track marked as a workout is published
- **THEN** the public track page and the public track list show no kind badge and no kind wording
- **AND** a trip card that links the track shows no kind wording

#### Scenario: The kind does not restrict trip attachment

- **WHEN** a track marked as a workout is attached to a trip by its owner
- **THEN** the system attaches it under the existing trip track rules
- **AND** it does not reject the attachment because of the kind

### Requirement: My workouts lists only the owner's workouts

The system SHALL provide an authenticated `/my/workouts` page where a signed-in user can view and manage only the tracks they own whose kind is a workout. The page SHALL use the same track management surface as `/my/tracks` and SHALL exclude the owner's routes from the list. The page SHALL render a short owner-side table rather than the full admin column set: each listed workout SHALL show its badges, title, start date, the recording timezone, distance, the recording duration, and its activity type, and the row SHALL keep the edit and delete actions. A value the track does not carry SHALL read as empty rather than as a zero. A track created from `/my/workouts` SHALL default to the workout kind, and the owner SHALL be able to change it before saving. The page SHALL be reachable from the user menu.

#### Scenario: Owner opens My workouts

- **WHEN** a signed-in user opens `/my/workouts`
- **THEN** the system displays only that user's tracks whose kind is a workout
- **AND** it does not display that user's routes

#### Scenario: Owner reads the workout list

- **WHEN** a signed-in user views the workouts list
- **THEN** each listed workout shows its badges, title, start date, the recording timezone, distance, the recording duration, and its activity type
- **AND** the row offers the edit and delete actions
- **AND** a workout without a recorded start or without a parsed distance shows an empty value in that column

#### Scenario: Owner reads the recording timezone of a workout

- **WHEN** a signed-in user views the workouts list
- **THEN** each listed workout shows the timezone its recording was made in
- **AND** the start date in the same row is rendered in that timezone
- **AND** a workout without a confirmed timezone shows the explicit UTC fallback with the unconfirmed marker

#### Scenario: Owner reads the recording duration of a workout

- **WHEN** a signed-in user views the workouts list
- **THEN** each listed workout shows how long its recording lasted
- **AND** a workout without a recorded duration shows an empty value in that column

#### Scenario: Owner creates a track from My workouts

- **WHEN** a signed-in user creates a track from `/my/workouts` without changing the kind
- **THEN** the system stores the workout kind on the new track
- **AND** the new track appears in the owner's workouts list and in the owner's full track list

#### Scenario: Owner has no workouts

- **WHEN** a signed-in user whose tracks are all routes opens `/my/workouts`
- **THEN** the system presents the empty list state
- **AND** the add-track control remains available for creating a workout

#### Scenario: Anonymous visitor requests My workouts

- **WHEN** an anonymous visitor requests `/my/workouts`
- **THEN** the system requires authentication
- **AND** it does not render personal track records

### Requirement: An owner can assign one owned gear record to a track

The system SHALL let a signed-in owner attach at most one of their own gear records to a track they own, SHALL let the owner clear that attachment, and SHALL refuse an attachment whose gear does not belong to that owner or whose gear activity types contradict the track's activity type.

#### Scenario: Owner attaches their own gear to a track

- **WHEN** a signed-in owner selects one of their own gear records in the track form and saves
- **THEN** the system stores the attachment on that track
- **AND** the track keeps exactly one gear record attached

#### Scenario: Owner clears the attachment

- **WHEN** a signed-in owner saves the track form with no gear selected
- **THEN** the system removes the gear attachment from that track
- **AND** it leaves the track itself unchanged

#### Scenario: A track is saved without a gear selection

- **WHEN** a signed-in owner saves a track that carries no gear
- **THEN** the system stores the track with no gear attached
- **AND** it does not create a placeholder gear record

#### Scenario: Owner submits gear belonging to another owner

- **WHEN** a signed-in owner submits a gear record that belongs to a different owner for attachment
- **THEN** the system refuses the save
- **AND** it leaves the track's existing attachment unchanged

#### Scenario: Owner submits gear that does not fit the track's activity type

- **WHEN** a signed-in owner submits a gear record whose activity types do not include the track's activity type
- **THEN** the system refuses the save
- **AND** it leaves the track's existing attachment unchanged

#### Scenario: Owner attaches unclassified gear

- **WHEN** a signed-in owner submits a gear record that carries no activity type for attachment
- **THEN** the system stores the attachment on that track
- **AND** it accepts the pair regardless of the track's activity type

#### Scenario: Owner attaches gear to a track that has no activity type

- **WHEN** a signed-in owner submits one of their own gear records for a track that carries no activity type
- **THEN** the system stores the attachment on that track

#### Scenario: Owner changes the track's activity type to one the attached gear does not fit

- **WHEN** a signed-in owner changes the activity type of a track that already carries a gear record, to a type the gear does not support
- **THEN** the system refuses the save
- **AND** it keeps the track's activity type and its gear attachment unchanged

#### Scenario: The administrative track surface carries no gear

- **WHEN** an administrator opens the administrative track workspace
- **THEN** the system offers no gear control there
- **AND** it delivers no gear record to that surface

### Requirement: A parsed GPX file's own UTC offset becomes the track's recording timezone

The system SHALL read the UTC offset that a parsed GPX file's own timestamps carry and SHALL store it as the track's recording timezone when the track has no confirmed timezone of its own. The offset is the recording's own wall-clock — a file written in Moscow carries `+03:00` in every `<time>` — and the normalized GPX instants keep no offset, so the file is the only place it survives. The system SHALL NOT overwrite a timezone the owner has already confirmed, and SHALL NOT give a manually-sourced track a timezone it never had.

#### Scenario: Parsing a Moscow recording stores the offset

- **WHEN** the system parses a GPX file whose `<time>` values carry `+03:00` for a track that has no confirmed recording timezone
- **THEN** the track's recording timezone becomes `+03:00`
- **AND** the surfaces render the recording start in that offset

#### Scenario: A confirmed timezone survives a re-parse

- **WHEN** the system re-parses the file of a track whose recording timezone the owner has already confirmed
- **THEN** the confirmed timezone stays as it is
- **AND** the file's offset does not replace it

#### Scenario: A file with no offset leaves the timezone unset

- **WHEN** the system re-parses a GPX file from the track form whose `<time>` values name no offset
- **THEN** the track keeps no confirmed recording timezone
- **AND** the surfaces show the explicit UTC fallback with the unconfirmed marker

#### Scenario: A manual track is not given a timezone by a parse

- **WHEN** the system parses the file of a track whose `timeSource` is `MANUAL`
- **THEN** the track's recording timezone is not changed by that parse

### Requirement: A fixed UTC offset is a valid recording timezone

The system SHALL accept a fixed UTC offset as a recording timezone. The canonical form SHALL be `+HH:MM` or `-HH:MM`, and the system SHALL accept the equivalent `UTC+HH:MM` and `+HHMM` spellings and canonicalise them to that form. A track whose recording timezone is a fixed offset SHALL render its recording times in that offset and SHALL identify the offset in the surfaces that show the timezone. The system SHALL continue to accept every IANA timezone name it accepted before, and SHALL keep the explicit UTC fallback for a track with no confirmed timezone.

#### Scenario: Fixed offset is accepted and canonicalised

- **WHEN** a recording-timezone update carries `UTC+03:00`
- **THEN** the system accepts the value
- **AND** it stores the canonical form `+03:00`

#### Scenario: Fixed offset renders the recording's own time

- **WHEN** a track has recording timezone `+03:00` and a recording start instant of `2026-10-26T05:30:00Z`
- **THEN** the surfaces render the recording start as 08:30 on 26 October 2026
- **AND** the timezone is shown as `UTC+03:00`
- **AND** the rendered value does not change when the track is viewed from a browser or server in another timezone

#### Scenario: An IANA timezone keeps working

- **WHEN** a recording-timezone update carries `Europe/Sofia`
- **THEN** the system stores `Europe/Sofia`
- **AND** the surfaces render the recording time in that zone

#### Scenario: An unsupported value is rejected

- **WHEN** a recording-timezone update carries `Not/A-Timezone`
- **THEN** the system rejects the request with a validation error
- **AND** it does not change the track's timezone setting
