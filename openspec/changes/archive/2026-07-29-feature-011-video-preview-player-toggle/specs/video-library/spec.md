## MODIFIED Requirements

### Requirement: Public video detail

The public video detail page SHALL show read-only details for a public video, a preview-first media area with player controls, and an authenticated user's bookmark surface when the visitor is signed in.

#### Scenario: Visitor opens a public video detail

- **WHEN** a visitor opens `/videos/{id}` for a public video
- **THEN** the system SHALL render the video title, video date, added date, preview media area, channel badge when present, external URL, and open-video action
- **AND** the preview media area SHALL be visible before any player mode is selected
- **AND** the external URL and open-video action SHALL appear in one responsive row when space allows

#### Scenario: Visitor switches to player mode

- **WHEN** a visitor opens `/videos/{id}` for a public video with an embeddable URL
- **AND** the visitor selects player mode
- **THEN** the system SHALL show the embedded player in the media area
- **AND** the visitor SHALL be able to switch back to preview mode

#### Scenario: Visitor opens a public video without embed playback

- **WHEN** a visitor opens `/videos/{id}` for a public video without an embeddable URL
- **THEN** the system SHALL show preview mode
- **AND** the system SHALL show player mode as unavailable
- **AND** the system SHALL give a short reason that embed playback is unavailable

#### Scenario: Authenticated visitor opens a public video detail

- **WHEN** an authenticated visitor opens `/videos/{id}` for a public video
- **THEN** the system SHALL render the existing public video detail content
- **AND** the system SHALL render the bookmark surface directly below the external URL and open-video action row

#### Scenario: Anonymous visitor opens a public video detail

- **WHEN** an anonymous visitor opens `/videos/{id}` for a public video
- **THEN** the system SHALL render the existing public video detail content
- **AND** the system SHALL NOT render bookmark creation, edit, delete, or all-bookmark controls

#### Scenario: Visitor opens a missing or private video detail

- **WHEN** a visitor opens `/videos/{id}`
- **AND** no public video exists with that id
- **THEN** the system SHALL render the route not-found state
