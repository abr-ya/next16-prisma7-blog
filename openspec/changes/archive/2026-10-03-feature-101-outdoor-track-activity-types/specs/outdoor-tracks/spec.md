# Spec Delta

## MODIFIED Requirements

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
