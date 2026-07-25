## MODIFIED Requirements

### Requirement: Public video detail

The public video detail page SHALL show read-only details for a public video, an authenticated user's bookmark surface when the visitor is signed in, and a video discussion surface.

#### Scenario: Visitor opens a public video detail

- **WHEN** a visitor opens `/videos/{id}` for a public video
- **THEN** the system SHALL render the video title, video date, added date, external URL, open-video action, thumbnail area, and channel badge when present

#### Scenario: Authenticated visitor opens a public video detail

- **WHEN** an authenticated visitor opens `/videos/{id}` for a public video
- **THEN** the system SHALL render the existing public video detail content
- **AND** the system SHALL render bookmark controls and that visitor's bookmarks for the video
- **AND** the system SHALL render comment creation controls and existing video comments

#### Scenario: Anonymous visitor opens a public video detail

- **WHEN** an anonymous visitor opens `/videos/{id}` for a public video
- **THEN** the system SHALL render the existing public video detail content
- **AND** the system SHALL NOT render bookmark creation, edit, or delete controls
- **AND** the system SHALL render existing video comments without comment mutation controls

#### Scenario: Visitor opens a missing or private video detail

- **WHEN** a visitor opens `/videos/{id}`
- **AND** no public video exists with that id
- **THEN** the system SHALL render the route not-found state
