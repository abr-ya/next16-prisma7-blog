# Spec Delta

## ADDED Requirements

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

### Requirement: Place on map does not introduce a public entry-point in this slice

The system SHALL expose the `Place on map` creation path only inside the existing track workspace surfaces (`/admin/tracks` and `/my/tracks`) and SHALL NOT add a public-facing `Add track` entry-point on `/tracks`, on `/trips/[slug]`, or anywhere else outside the owner/admin workspace. Any future public entry-point (for example, an `Add track` affordance on `/trips/[slug]` for verified/trusted creators that places points and attaches the new track to the current trip in one submission) is a separate slice.

#### Scenario: Public trip detail does not render a Place on map control

- **WHEN** a visitor (including the trip creator) opens `/trips/[slug]`
- **THEN** the page does not render a `Place on map` control
- **AND** the existing `Add track` affordance from feature-110 (attach existing or upload GPX) remains the only trip-side track-creation affordance
- **AND** no new server action for placing points on the trip detail page is exposed