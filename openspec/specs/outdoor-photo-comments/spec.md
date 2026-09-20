# outdoor-photo-comments Specification

## Purpose
Adds signed-in text comments to photos linked to a published trip, presented through the existing shared comment UI foundation. Visibility is gated server-side through the published trip association and the existing photo privacy boundary (full-size photos require authentication), so anonymous visitors see no photo comments while authenticated viewers can list, create, and manage their own comments on a photo whose trip is published.

## Requirements

### Requirement: Authenticated photo comment reads through published trips

The system SHALL provide server-side reads of comments attached to a photo when the photo is linked to a trip whose status is `PUBLISHED`, and SHALL order those comments by `createdAt` ascending.

#### Scenario: Signed-in viewer lists comments on a published-trip photo

- **WHEN** an authenticated viewer requests comments for a photo
- **AND** that photo is linked to at least one trip with status `PUBLISHED`
- **THEN** the system SHALL return that photo's comments
- **AND** the system SHALL order them by `createdAt` ascending

#### Scenario: Signed-in viewer cannot list comments on a draft-trip photo

- **WHEN** an authenticated viewer requests comments for a photo
- **AND** the photo's only linked trips have status `DRAFT`
- **THEN** the system SHALL return no comments for that photo through the public photo-comment helper

#### Scenario: Signed-in viewer cannot list comments on an unlinked photo

- **WHEN** an authenticated viewer requests comments for a photo
- **AND** that photo has no `HikesToPhotos` association
- **THEN** the system SHALL return no comments for that photo through the public photo-comment helper

#### Scenario: Photo comments are not exposed to anonymous viewers

- **WHEN** an anonymous visitor views a published trip photo surface
- **THEN** the system SHALL NOT render any photo-comment list, count badge, or composer for that visitor

### Requirement: Authenticated photo comment creation

The system SHALL let an authenticated viewer create a single plain-text comment on a photo when the photo is linked to a trip whose status is `PUBLISHED`, and SHALL treat the created comment's target as that photo's first published linked trip.

#### Scenario: Signed-in viewer creates a photo comment

- **WHEN** an authenticated viewer submits a non-empty trimmed comment for a photo
- **AND** the photo is linked to a trip with status `PUBLISHED`
- **THEN** the system SHALL create a comment owned by that viewer and linked to that photo
- **AND** the system SHALL revalidate the affected public trip detail page

#### Scenario: Anonymous visitor cannot create a photo comment

- **WHEN** an anonymous visitor attempts to create a photo comment
- **THEN** the system SHALL reject the mutation as unauthorized
- **AND** no comment SHALL be created

#### Scenario: Authenticated viewer cannot create a comment on a draft-trip photo

- **WHEN** an authenticated viewer attempts to create a photo comment
- **AND** the photo's only linked trips have status `DRAFT`
- **THEN** the system SHALL reject the mutation
- **AND** no comment SHALL be created

### Requirement: Owner-scoped photo comment edit and delete

The system SHALL let the original author of a photo comment update or delete their own comment while the photo remains linked to a trip whose status is `PUBLISHED`, and SHALL reject any other actor's edit or delete attempt.

#### Scenario: Author edits own photo comment

- **WHEN** the original author submits a valid trimmed content change for a comment they own
- **AND** the linked photo is associated with a published trip
- **THEN** the system SHALL update that comment's content
- **AND** the system SHALL revalidate the affected public trip detail page

#### Scenario: Author deletes own photo comment

- **WHEN** the original author deletes a comment they own
- **AND** the linked photo is associated with a published trip
- **THEN** the system SHALL delete that comment
- **AND** the system SHALL revalidate the affected public trip detail page

#### Scenario: Non-author cannot edit or delete another user's photo comment

- **WHEN** an authenticated viewer attempts to update or delete a photo comment owned by a different user
- **THEN** the system SHALL reject the mutation or return a failed result
- **AND** the other user's comment SHALL remain unchanged

### Requirement: Shared comment list and composer for photos

The system SHALL render photo comments through the shared public comment UI building blocks so the public-facing comment list, empty state, authenticated composer, and own-comment mutation controls match the behavior of comments on other shared targets.

#### Scenario: Shared comment UI presents photo comments on the published-trip lightbox

- **WHEN** an authenticated viewer opens a photo in the published-trip photo lightbox
- **THEN** the system SHALL render that photo's comments using the shared public comment list component
- **AND** the system SHALL render the shared authenticated comment composer below the photo

#### Scenario: Comment count badge appears on each published-trip photo card

- **WHEN** an authenticated viewer views a published trip photo gallery
- **THEN** each linked published photo card SHALL display the current comment count for that photo
- **AND** the count SHALL reflect the same comments returned by the public photo-comment helper

### Requirement: Photo comment target mapping

The system SHALL map every photo comment to a normalized shared comment target whose `type` is `"photo"`, whose title is the photo title, whose `href` is the linked published trip's `/trips/[slug]` URL, and whose preview image is the photo's first image when one exists.

#### Scenario: Comment list item exposes a photo target

- **WHEN** the shared comment list renders a photo comment
- **THEN** the comment's normalized target SHALL identify its `type` as `"photo"`
- **AND** the target title SHALL equal the photo's title
- **AND** the target href SHALL point to that photo's first linked published trip
- **AND** the target preview image SHALL equal that photo's first image when available, otherwise `null`

### Requirement: Single shared target per comment row

The system SHALL store each comment row with exactly one of `videoId` or `photoId` set and SHALL reject any read or write path that would return or persist a comment associated with no target or with both targets.

#### Scenario: Read helper returns no comments for a target-less row

- **WHEN** server code reads comments through the shared comment helper
- **AND** a stored comment has neither `videoId` nor `photoId`
- **THEN** the system SHALL NOT expose that comment to any target's comment list

#### Scenario: Schema rejects a comment with both targets

- **WHEN** the database receives an insert or update that would set both `videoId` and `photoId` on a `Comment` row
- **THEN** the database SHALL reject the write

### Requirement: Safe text rendering for photo comments

The system SHALL render photo comment content through the same safe comment-text rendering used for video comments, so plain URLs become safe clickable links and any unsafe markup is preserved as plain text.

#### Scenario: Plain URL in a photo comment becomes a safe link

- **WHEN** a photo comment contains a plain URL
- **THEN** the rendered comment SHALL display that URL as a safe clickable link
- **AND** the URL SHALL be sanitized through the same rules used for video comments
