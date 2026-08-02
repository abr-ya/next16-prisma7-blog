## Purpose

Provide the server-side foundation for comments attached to public videos.
## Requirements
### Requirement: Public video comment reads

The system SHALL provide server-side reads for comments attached to public videos.

#### Scenario: System lists comments for a public video

- **WHEN** server code requests comments for a public video
- **THEN** the system SHALL query comments attached to that video
- **AND** the system SHALL order comments by `createdAt` ascending

#### Scenario: System does not list comments for private video

- **WHEN** server code requests comments for a private or missing video
- **THEN** the system SHALL NOT expose comments for that video through the public video comment helper

### Requirement: Authenticated video comment mutations

The system SHALL let authenticated users create, update, and delete their own comments on public videos.

#### Scenario: Authenticated user creates a video comment

- **WHEN** an authenticated user submits a plain-text comment for a public video
- **AND** the comment content is non-empty after trimming
- **THEN** the system SHALL create a comment owned by that user and linked to that video
- **AND** the system SHALL revalidate the affected public video detail page

#### Scenario: Anonymous visitor cannot create a video comment

- **WHEN** an anonymous visitor attempts to create a video comment
- **THEN** the system SHALL reject the mutation as unauthorized
- **AND** no comment SHALL be created

#### Scenario: User edits own video comment

- **WHEN** an authenticated user submits valid changes for a comment they own
- **AND** the linked video is public
- **THEN** the system SHALL update that comment's content
- **AND** the system SHALL revalidate the affected public video detail page

#### Scenario: User deletes own video comment

- **WHEN** an authenticated user deletes a comment they own
- **AND** the linked video is public
- **THEN** the system SHALL delete that comment
- **AND** the system SHALL revalidate the affected public video detail page

#### Scenario: User cannot mutate another user's video comment

- **WHEN** an authenticated user attempts to update or delete a comment owned by another user
- **THEN** the system SHALL reject the mutation or return a failed result
- **AND** the other user's comment SHALL remain unchanged

#### Scenario: Private video comments are unavailable through public workflows

- **WHEN** a user attempts to create, update, or delete a comment through the public video workflow
- **AND** the target video is private or missing
- **THEN** the system SHALL reject the operation

### Requirement: Public video comment count UI

The system SHALL show a comment count on public video detail pages.

#### Scenario: Visitor views comment count

- **WHEN** a visitor opens a public video detail page with comments
- **THEN** the system SHALL show the number of comments attached to that public video
- **AND** the system SHALL render the matching comment list on the same page

#### Scenario: Visitor views zero comments

- **WHEN** a visitor opens a public video detail page with no comments
- **THEN** the system SHALL show a zero-comment state

### Requirement: Public video comment list UI

The system SHALL render comments attached to public videos on public video detail pages.

#### Scenario: Visitor views comments for a public video

- **WHEN** a visitor opens a public video detail page with comments
- **THEN** the system SHALL show each comment's plain-text content
- **AND** the system SHALL show each comment's creation date
- **AND** the system SHALL show each comment author's display name
- **AND** the system SHALL show each comment author's avatar or a fallback avatar state

#### Scenario: Visitor views a public video without comments

- **WHEN** a visitor opens a public video detail page with no comments
- **THEN** the system SHALL show an empty comment-list state
- **AND** the system SHALL keep the existing comment creation prompt behavior

#### Scenario: Visitor cannot see private video comments

- **WHEN** a visitor opens a private or missing video through the public video route
- **THEN** the system SHALL NOT expose comments for that private or missing video

#### Scenario: Visitor sees supported comment URLs as links

- **WHEN** a public video comment contains a supported plain URL beginning with `https://`, `http://`, or `www.`
- **THEN** the comment text SHALL render that URL as an inline clickable link
- **AND** ordinary non-link text SHALL remain visible in its original order

#### Scenario: Visitor sees unsupported comment URL candidates as text

- **WHEN** a public video comment contains an unsupported or invalid URL candidate
- **THEN** the comment text SHALL render that candidate as plain text
- **AND** the comment list SHALL remain usable

#### Scenario: Visitor sees safe generated comment links

- **WHEN** a supported URL renders as a link in public video comment text
- **THEN** the generated anchor SHALL use `target="_blank"`
- **AND** the generated anchor SHALL use `rel="nofollow ugc noopener noreferrer"`

### Requirement: Authenticated video comment creation UI

The system SHALL let authenticated users create a plain-text comment from public video detail pages.

#### Scenario: Authenticated user adds a comment

- **WHEN** an authenticated user submits a non-empty comment from a public video detail page
- **THEN** the system SHALL create the comment through the public video comment workflow
- **AND** the visible comment count SHALL update without requiring manual navigation

#### Scenario: Authenticated user submits an empty comment

- **WHEN** an authenticated user attempts to submit an empty comment from a public video detail page
- **THEN** the system SHALL NOT submit the comment creation request
- **AND** the visible comment count SHALL remain unchanged

### Requirement: Anonymous video comment creation access

The system SHALL keep anonymous public video visitors in a read-only comment creation state.

#### Scenario: Anonymous visitor views comment prompt

- **WHEN** an anonymous visitor opens a public video detail page
- **THEN** the system SHALL show the public video comment count
- **AND** the system SHALL indicate that comment list display is planned
- **AND** the system SHALL NOT show a comment creation form
- **AND** the system SHALL show a sign-in prompt for commenting

### Requirement: Video comments participate in shared comment domain

The system SHALL treat existing video comments as the first supported target in the future project-wide comment domain.

#### Scenario: Video comments keep current behavior

- **WHEN** the shared comment domain is planned
- **THEN** existing public video comment reads, creation, list rendering, and ownership behavior SHALL remain unchanged in this planning slice

#### Scenario: Video comments can normalize to shared list item

- **WHEN** future shared comment helpers are implemented
- **THEN** video comments SHALL be adaptable to the shared comment list item contract
- **AND** each video comment item SHALL link back to its public video target page
