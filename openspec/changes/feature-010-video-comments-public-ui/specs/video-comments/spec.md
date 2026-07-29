## ADDED Requirements

### Requirement: Public video comment UI

The system SHALL show public video comments on public video detail pages.

#### Scenario: Visitor views existing comments

- **WHEN** a visitor opens a public video detail page with comments
- **THEN** the system SHALL show those comments in chronological order
- **AND** each comment SHALL show its author and creation date

#### Scenario: Visitor views a video with no comments

- **WHEN** a visitor opens a public video detail page with no comments
- **THEN** the system SHALL show an empty comments state

### Requirement: Authenticated video comment UI management

The system SHALL let authenticated users manage their own comments from public video detail pages.

#### Scenario: Authenticated user adds a comment

- **WHEN** an authenticated user submits a non-empty comment from a public video detail page
- **THEN** the system SHALL create the comment through the public video comment workflow
- **AND** the new comment SHALL appear in the comments list without requiring manual navigation

#### Scenario: Authenticated user edits own comment

- **WHEN** an authenticated user edits one of their own comments from a public video detail page
- **THEN** the system SHALL update the comment through the public video comment workflow
- **AND** the updated content SHALL appear in the comments list without requiring manual navigation

#### Scenario: Authenticated user deletes own comment

- **WHEN** an authenticated user deletes one of their own comments from a public video detail page
- **THEN** the system SHALL remove the comment through the public video comment workflow
- **AND** the deleted comment SHALL disappear from the comments list without requiring manual navigation

#### Scenario: Authenticated user views another user's comment

- **WHEN** an authenticated user views a comment owned by another user
- **THEN** the system SHALL NOT show edit or delete controls for that comment

### Requirement: Anonymous video comment UI access

The system SHALL keep anonymous public video visitors in a read-only comment state.

#### Scenario: Anonymous visitor views comments

- **WHEN** an anonymous visitor opens a public video detail page
- **THEN** the system SHALL show existing comments and empty states
- **AND** the system SHALL NOT show comment create, edit, or delete controls
- **AND** the system SHALL show a sign-in prompt for commenting
