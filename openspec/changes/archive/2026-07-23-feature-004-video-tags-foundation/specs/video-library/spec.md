## ADDED Requirements

### Requirement: Video tag records

The video library SHALL support reusable video tag records that can be assigned to videos.

#### Scenario: System stores reusable video tags

- **WHEN** an authenticated admin saves a video with one or more tag names
- **THEN** the system SHALL persist reusable video tag records for those names
- **AND** the system SHALL normalize tag names so duplicate whitespace or casing does not create duplicate tags
- **AND** the system SHALL assign the saved tags to the video

#### Scenario: Admin confirms new video tags

- **WHEN** an authenticated admin saves a video with selected or typed tag names that do not match existing tag options
- **THEN** the form SHALL ask the admin to confirm creating the new tag records
- **AND** cancelling the confirmation SHALL stop the video save
- **AND** selecting only existing tag options SHALL NOT require confirmation

#### Scenario: System preserves videos without tags

- **WHEN** an authenticated admin saves a video without tag names
- **THEN** the system SHALL persist the video without tag assignments
- **AND** existing video create and edit behavior SHALL continue to work

### Requirement: Video tag badges

Video views SHALL display assigned video tags as passive badges.

#### Scenario: Admin sees video tag badges

- **WHEN** an authenticated admin opens `/admin/videos`
- **AND** a listed owned video has assigned tags
- **THEN** the system SHALL show those tags with the video row

#### Scenario: Visitor sees public video tag badges

- **WHEN** a visitor opens `/videos` or `/videos/{id}`
- **AND** a public video has assigned tags
- **THEN** the system SHALL show those tags with the video
- **AND** tag display SHALL NOT expose private videos or private video assignments

#### Scenario: Tags are not public filters yet

- **WHEN** a visitor sees tag badges on a public video surface
- **THEN** the system SHALL treat the badges as non-filtering display metadata for this feature

## MODIFIED Requirements

### Requirement: Admin video creation and editing

Admins SHALL be able to create and edit video records with title, external URL, thumbnail URL, channel, visibility, video date, optional provider metadata fields, and tag assignments.

#### Scenario: Admin creates a video

- **WHEN** an authenticated admin submits a valid new video
- **THEN** the system SHALL create a video owned by the current authenticated user
- **AND** the system SHALL default visibility to `PRIVATE` when no visibility is provided
- **AND** the system SHALL normalize empty thumbnail and channel values to `null`
- **AND** the system SHALL persist normalized tag assignments when tags are provided
- **AND** the system SHALL attempt provider metadata extraction for the saved URL
- **AND** provider metadata extraction failure SHALL NOT prevent the video from being created
- **AND** the system SHALL revalidate affected admin and public video paths

#### Scenario: Admin edits an owned video

- **WHEN** an authenticated admin submits valid changes for an owned video
- **THEN** the system SHALL update the title, URL, thumbnail URL, channel, video date, visibility, derived provider metadata values, and tag assignments
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
