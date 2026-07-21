## ADDED Requirements

### Requirement: Video provider metadata

Videos SHALL support optional provider metadata extracted from supported external video URLs.

#### Scenario: System extracts supported provider metadata

- **WHEN** an authenticated admin saves a video with a supported provider URL
- **THEN** the system SHALL persist the provider name and provider video ID when they can be derived
- **AND** the system SHALL persist a canonical embed URL when it can be derived
- **AND** the system SHALL persist a provider thumbnail URL when no manual thumbnail URL is saved
- **AND** the system SHALL leave video duration empty when the extractor has no credential-free duration source

#### Scenario: System leaves unavailable metadata empty

- **WHEN** an authenticated admin saves a video whose provider metadata is unsupported, unavailable, or cannot be derived
- **THEN** the system SHALL save the video without provider metadata
- **AND** the missing metadata SHALL NOT block video creation or editing

#### Scenario: System clears stale provider metadata

- **WHEN** an authenticated admin changes a video's URL to an unsupported or unparseable provider URL
- **THEN** the system SHALL clear provider metadata that belonged to the previous URL
- **AND** the system SHALL preserve the saved video record

#### Scenario: Admin and public views use saved metadata

- **WHEN** admin or public video views render a video with saved provider metadata
- **THEN** the views SHALL use the saved metadata only when present
- **AND** the views SHALL preserve their existing fallback behavior when metadata is absent

## MODIFIED Requirements

### Requirement: Admin video creation and editing

Admins SHALL be able to create and edit video records with title, external URL, thumbnail URL, channel, visibility, video date, and optional provider metadata fields.

#### Scenario: Admin creates a video

- **WHEN** an authenticated admin submits a valid new video
- **THEN** the system SHALL create a video owned by the current authenticated user
- **AND** the system SHALL default visibility to `PRIVATE` when no visibility is provided
- **AND** the system SHALL normalize empty thumbnail and channel values to `null`
- **AND** the system SHALL attempt provider metadata extraction for the saved URL
- **AND** provider metadata extraction failure SHALL NOT prevent the video from being created
- **AND** the system SHALL revalidate affected admin and public video paths

#### Scenario: Admin edits an owned video

- **WHEN** an authenticated admin submits valid changes for an owned video
- **THEN** the system SHALL update the title, URL, thumbnail URL, channel, video date, visibility, and derived provider metadata values
- **AND** the system SHALL preserve owner scoping before updating
- **AND** provider metadata extraction failure SHALL NOT prevent the video from being updated
- **AND** the system SHALL revalidate affected admin and public video paths

#### Scenario: Admin submits invalid video form values

- **WHEN** an admin enters an invalid URL, invalid thumbnail URL, missing title, or invalid video date
- **THEN** the form SHALL prevent submission and show validation feedback

#### Scenario: Admin saves a generic video without a thumbnail

- **WHEN** an authenticated admin submits a valid non-YouTube video URL
- **AND** no thumbnail URL is provided
- **THEN** the system SHALL save the video without requiring provider metadata

#### Scenario: Admin changes the video URL

- **WHEN** an admin changes a video's external URL in the form
- **THEN** the form SHALL NOT silently overwrite an existing custom thumbnail URL

#### Scenario: Admin clears a thumbnail

- **WHEN** an admin clears the thumbnail URL and saves the form
- **THEN** the system SHALL persist the video with no thumbnail URL
