## MODIFIED Requirements

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
