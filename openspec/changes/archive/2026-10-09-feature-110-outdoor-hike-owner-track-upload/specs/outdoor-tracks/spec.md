# Spec Delta

## ADDED Requirements

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