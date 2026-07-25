## ADDED Requirements

### Requirement: Public video comments

The system SHALL let visitors read comments attached to public videos.

#### Scenario: Visitor lists comments for a public video

- **WHEN** a visitor opens `/videos/{id}` for a public video
- **THEN** the system SHALL query comments attached to that video
- **AND** the system SHALL order comments by `createdAt` ascending
- **AND** the page SHALL render the comments in a discussion section

#### Scenario: Visitor cannot list comments for private video

- **WHEN** a visitor opens `/videos/{id}`
- **AND** no public video exists with that id
- **THEN** the system SHALL render the route not-found state
- **AND** the system SHALL NOT expose comments for that video

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

### Requirement: Public video comment UI

The public video detail page SHALL show a video discussion surface with mutation controls only for signed-in users.

#### Scenario: Signed-in user sees comment controls

- **WHEN** an authenticated user opens `/videos/{id}` for a public video
- **THEN** the page SHALL show a comment form
- **AND** the page SHALL show edit and delete controls for comments owned by that user
- **AND** the page SHALL NOT show mutation controls for comments owned by other users

#### Scenario: Anonymous visitor sees read-only comments

- **WHEN** an anonymous visitor opens `/videos/{id}` for a public video
- **THEN** the page SHALL show existing comments when any exist
- **AND** the page SHALL NOT show comment creation, edit, or delete controls

#### Scenario: Public video has no comments

- **WHEN** a visitor opens `/videos/{id}` for a public video with no comments
- **THEN** the page SHALL render a stable empty discussion state
