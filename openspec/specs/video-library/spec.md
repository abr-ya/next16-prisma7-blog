# Video Library Specification

## Purpose

The video library lets authenticated admins save and organize external video links, then optionally publish selected videos to public read-only pages.

## Requirements

### Requirement: Admin video ownership

Admin video records SHALL be scoped to the authenticated owner.

#### Scenario: Admin lists own videos

- **WHEN** an authenticated admin opens `/admin/videos`
- **THEN** the system SHALL query videos for the current authenticated user
- **AND** the system SHALL include both private and public videos
- **AND** the system SHALL include each video's channel data when present
- **AND** the system SHALL order videos by newest `createdAt` first

#### Scenario: Admin opens an owned video for editing

- **WHEN** an authenticated admin opens `/admin/videos/{id}`
- **AND** `{id}` belongs to the current authenticated user
- **THEN** the system SHALL render the video edit form for that video

#### Scenario: Admin opens a missing or unauthorized video

- **WHEN** an authenticated admin opens `/admin/videos/{id}`
- **AND** no video exists for the current authenticated user with that id
- **THEN** the system SHALL render the route not-found state

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

### Requirement: Video dates

Videos SHALL distinguish the original video date from the library added date.

#### Scenario: System displays video dates

- **WHEN** the system displays `videoDate`
- **THEN** it SHALL treat it as the date of the external video itself
- **AND** when the system displays `createdAt`
- **THEN** it SHALL treat it as the date the video was added to this library

### Requirement: Admin video table actions

The admin video table SHALL provide row actions for common video operations.

#### Scenario: Admin opens the external video

- **WHEN** an admin activates the open-video action for a row
- **THEN** the system SHALL open the saved external video URL in a new browser tab

#### Scenario: Admin copies a provider video id

- **WHEN** an admin activates the copy-video-id action for a supported provider URL
- **THEN** the system SHALL copy the provider video id to the clipboard
- **AND** the system SHALL show success feedback

#### Scenario: Admin fetches a YouTube thumbnail

- **WHEN** an admin activates the thumbnail fetch action for a supported YouTube URL
- **THEN** the system SHALL derive and save the YouTube thumbnail URL
- **AND** the system SHALL refresh the admin table data

#### Scenario: Admin thumbnail fetch fails

- **WHEN** an admin activates a thumbnail fetch action for an unsupported or invalid URL
- **THEN** the system SHALL show failure feedback
- **AND** the system SHALL preserve the existing thumbnail value
- **AND** the failure SHALL NOT block later video create or edit saves

#### Scenario: Admin deletes an owned video

- **WHEN** an authenticated admin confirms deletion of an owned video
- **THEN** the system SHALL delete that video
- **AND** the system SHALL revalidate affected admin and public video paths

### Requirement: Admin video table pagination

The admin video table SHALL provide client-side pagination for loaded owned videos.

#### Scenario: Admin opens a paginated video table

- **WHEN** an authenticated admin opens `/admin/videos`
- **AND** the owned video list contains more rows than the default admin table page size
- **THEN** the system SHALL render only the current page of rows in the table body
- **AND** the system SHALL show pagination controls with current page state
- **AND** the system SHALL allow the admin to navigate to the next and previous pages

#### Scenario: Admin sorts a paginated video table

- **WHEN** an admin changes sorting in the paginated video table
- **THEN** the system SHALL sort the loaded owned video list client-side
- **AND** the paginated rows SHALL reflect the active sort order

#### Scenario: Admin uses row actions on a paginated row

- **WHEN** an admin activates an existing row action on any visible paginated row
- **THEN** the system SHALL keep the current open, copy-video-id, thumbnail fetch, edit, and delete behavior for that video

### Requirement: Video visibility

Video visibility SHALL control whether a video is public.

#### Scenario: Private video is hidden publicly

- **WHEN** a video has `PRIVATE` visibility
- **THEN** public video queries SHALL NOT return that video
- **AND** public detail routes SHALL render the route not-found state for that video

#### Scenario: Public video is visible publicly

- **WHEN** a video has `PUBLIC` visibility
- **THEN** public video queries MAY return that video
- **AND** the public detail route MAY render that video

### Requirement: Public video list

The public video list SHALL provide read-only browsing for public videos.

#### Scenario: Visitor opens the public video list

- **WHEN** a visitor opens `/videos`
- **THEN** the system SHALL query only videos with `PUBLIC` visibility
- **AND** the system SHALL include each video's channel data when present
- **AND** the system SHALL default sorting to `videoDate` descending
- **AND** the system SHALL use URL query parameters for supported browse state

#### Scenario: Visitor changes public sort

- **WHEN** a visitor opens `/videos?sort=createdAt-desc`
- **THEN** the system SHALL sort public videos by newest `createdAt` first

- **WHEN** a visitor opens `/videos?sort=title-asc`
- **THEN** the system SHALL sort public videos by title ascending

#### Scenario: Visitor requests an invalid public sort

- **WHEN** a visitor opens `/videos` with an unsupported `sort` query value
- **THEN** the system SHALL use the default public video sort

#### Scenario: Visitor pages through public videos

- **WHEN** a visitor opens `/videos?page={page}`
- **THEN** the system SHALL return a bounded page of public videos
- **AND** the default page size SHALL be 12 videos
- **AND** the system SHALL expose pagination metadata including current page, page count, page size, and total count
- **AND** pagination links SHALL preserve active supported sort state

#### Scenario: Visitor shares a public browse URL

- **WHEN** a visitor opens a public video browse URL with supported `page` and `sort` query parameters
- **THEN** the system SHALL render the corresponding shareable browse state

### Requirement: Public video detail

The public video detail page SHALL show read-only details for a public video.

#### Scenario: Visitor opens a public video detail

- **WHEN** a visitor opens `/videos/{id}` for a public video
- **THEN** the system SHALL render the video title, video date, added date, external URL, open-video action, thumbnail area, and channel badge when present

#### Scenario: Visitor opens a missing or private video detail

- **WHEN** a visitor opens `/videos/{id}`
- **AND** no public video exists with that id
- **THEN** the system SHALL render the route not-found state

### Requirement: Video thumbnails

Videos SHALL support optional thumbnail URLs from approved image hosts.

#### Scenario: System accepts approved thumbnail hosts

- **WHEN** a thumbnail URL is saved
- **THEN** the system SHALL require an HTTPS URL
- **AND** the system SHALL allow approved image hosts including `i.ytimg.com`, `utfs.io`, and `lh3.googleusercontent.com`

#### Scenario: Admin fetches a thumbnail in the form

- **WHEN** an admin enters a supported YouTube video URL and activates the form fetch action
- **THEN** the form SHALL derive a YouTube thumbnail URL
- **AND** the form SHALL preview the thumbnail before save

#### Scenario: Admin fetches supported YouTube URL formats

- **WHEN** an admin enters a YouTube `watch`, `youtu.be`, `shorts`, or `embed` URL with a valid video id
- **THEN** the system SHALL derive `https://i.ytimg.com/vi/{videoId}/hqdefault.jpg`

#### Scenario: Admin fetches an invalid YouTube thumbnail

- **WHEN** an admin enters an unsupported YouTube URL shape, unsupported hostname, or invalid video id
- **THEN** the form SHALL show an error
- **AND** the form SHALL preserve the current thumbnail value
- **AND** the failure SHALL NOT submit or save the video

#### Scenario: Video has no thumbnail

- **WHEN** a public video detail has no saved thumbnail URL
- **THEN** the public detail page SHALL preserve layout and show the no-thumbnail fallback

#### Scenario: Public detail thumbnail fails to load

- **WHEN** a public video detail thumbnail image fails at render time
- **THEN** the public detail page SHALL preserve layout and show the no-thumbnail fallback

### Requirement: Video channels

Videos SHALL support an optional reference to a global external video channel.

#### Scenario: Video has a channel

- **WHEN** a video has a channel
- **THEN** admin and public video views SHALL show the channel name with the video
- **AND** views that expose the channel URL SHALL open it as an external link

#### Scenario: Channel is removed

- **WHEN** a referenced video channel is deleted
- **THEN** related videos SHALL remain available
- **AND** those videos SHALL have no channel
