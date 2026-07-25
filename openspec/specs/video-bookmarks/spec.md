# Video Bookmarks Specification

## Purpose

Video bookmarks let authenticated visitors save personal timestamp notes for public videos so they can return to useful moments later.

## Requirements

### Requirement: User-owned video bookmarks

The system SHALL let authenticated users persist timestamp bookmarks for public videos.

#### Scenario: Authenticated user creates a bookmark

- **WHEN** an authenticated user submits a bookmark for a public video
- **AND** the bookmark has a non-negative integer timestamp in seconds
- **THEN** the system SHALL create a bookmark owned by that user and linked to that video
- **AND** the system SHALL persist any provided short label or note
- **AND** the system SHALL revalidate the affected public video detail page

#### Scenario: Authenticated user lists own bookmarks for a public video

- **WHEN** an authenticated user opens `/videos/{id}` for a public video
- **THEN** the system SHALL query bookmarks for that video owned by the current user
- **AND** the system SHALL order those bookmarks by `timestampSeconds` ascending and then `createdAt` ascending

#### Scenario: Anonymous visitor cannot create bookmarks

- **WHEN** an anonymous visitor attempts to create a video bookmark
- **THEN** the system SHALL reject the mutation as unauthorized
- **AND** no bookmark SHALL be created

### Requirement: Bookmark ownership and visibility

The system SHALL enforce bookmark ownership and public-video visibility for all bookmark reads and mutations.

#### Scenario: User edits own bookmark

- **WHEN** an authenticated user submits valid changes for a bookmark they own
- **AND** the linked video is public
- **THEN** the system SHALL update the timestamp and text fields for that bookmark
- **AND** the system SHALL revalidate the affected public video detail page

#### Scenario: User deletes own bookmark

- **WHEN** an authenticated user deletes a bookmark they own
- **AND** the linked video is public
- **THEN** the system SHALL delete that bookmark
- **AND** the system SHALL revalidate the affected public video detail page

#### Scenario: User cannot mutate another user's bookmark

- **WHEN** an authenticated user attempts to update or delete a bookmark owned by another user
- **THEN** the system SHALL reject the mutation
- **AND** the other user's bookmark SHALL remain unchanged

#### Scenario: Private video bookmarks are unavailable through public workflows

- **WHEN** a user attempts to list, create, update, or delete bookmarks through the public video workflow
- **AND** the target video is private or missing
- **THEN** the system SHALL reject the operation or return no bookmark surface for that video

### Requirement: Public video bookmark UI

The public video detail page SHALL expose bookmark controls only to signed-in users.

#### Scenario: Signed-in user sees bookmark controls

- **WHEN** an authenticated user opens `/videos/{id}` for a public video
- **THEN** the page SHALL show a bookmark form for entering a timestamp and optional text
- **AND** the page SHALL show the user's existing bookmarks for that video when any exist
- **AND** each listed bookmark SHALL include a timestamp link to the external video at that moment when the provider URL supports timestamp query parameters

#### Scenario: Signed-in user manages existing bookmarks

- **WHEN** an authenticated user sees their bookmark list on `/videos/{id}`
- **THEN** each bookmark SHALL provide controls to edit and delete that bookmark
- **AND** those controls SHALL apply only to the current user's bookmarks

#### Scenario: Anonymous visitor sees read-only video detail

- **WHEN** an anonymous visitor opens `/videos/{id}` for a public video
- **THEN** the page SHALL keep the video detail readable
- **AND** the page SHALL NOT show bookmark creation, edit, or delete controls
