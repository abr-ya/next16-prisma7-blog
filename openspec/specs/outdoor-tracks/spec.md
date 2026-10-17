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
- **THEN** the page displays stored tracks with title, linked GPX file name, status, and updated timestamp

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

### Requirement: Users can manage their own independent tracks from the public site

The system SHALL provide an authenticated `/my/tracks` page where a signed-in user can view and manage only tracks they own. The page SHALL list each owned track with its title, GPX filename, publication status, updated time, parse state when available, and any current trip association. It SHALL clearly identify tracks that are not attached to a trip.

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

### Requirement: GPX tracks keep parsed times as the source of truth and do not write the new columns

The system SHALL NOT persist `Track.recordingStartAt` or `Track.recordingDurationSeconds` for a track whose `Track.timeSource` is `GPX`. The system SHALL continue to populate `Track.metadata.summary.time` through the existing `parseTrackGpx` pipeline and SHALL NOT mirror those parsed values into the new columns for a GPX-sourced track.

#### Scenario: GPX upload leaves the new columns null

- **WHEN** an administrator uploads or re-parses a GPX-backed track
- **THEN** the resulting `Track.recordingStartAt` and `Track.recordingDurationSeconds` remain null
- **AND** `Track.timeSource` remains `GPX`
- **AND** `Track.metadata.summary.time` continues to carry the parsed start, finish, duration, and timezone evidence for that track

#### Scenario: GPX track surfaces read parsed times, not the new columns

- **WHEN** a track has `Track.timeSource = GPX`
- **THEN** the public track detail page, public track list card, admin track list row, and trip linked-track card continue to render recording times from `Track.metadata.summary.time` through the existing parsed block
- **AND** none of those surfaces render the new `Recording start` or `Recording duration` lines for that track
