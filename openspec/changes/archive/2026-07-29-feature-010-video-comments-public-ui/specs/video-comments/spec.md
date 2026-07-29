## ADDED Requirements

### Requirement: Public video comment count UI

The system SHALL show a comment count on public video detail pages.

#### Scenario: Visitor views comment count

- **WHEN** a visitor opens a public video detail page with comments
- **THEN** the system SHALL show the number of comments attached to that public video
- **AND** the system SHALL indicate that comment list display is planned

#### Scenario: Visitor views zero comments

- **WHEN** a visitor opens a public video detail page with no comments
- **THEN** the system SHALL show a zero-comment state

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
