## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Public video comment count UI

The system SHALL show a comment count on public video detail pages.

#### Scenario: Visitor views comment count

- **WHEN** a visitor opens a public video detail page with comments
- **THEN** the system SHALL show the number of comments attached to that public video
- **AND** the system SHALL render the matching comment list on the same page

#### Scenario: Visitor views zero comments

- **WHEN** a visitor opens a public video detail page with no comments
- **THEN** the system SHALL show a zero-comment state
