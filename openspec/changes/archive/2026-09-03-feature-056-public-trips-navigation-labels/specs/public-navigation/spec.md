## MODIFIED Requirements

### Requirement: Public navbar preserves existing navigation controls

The system SHALL preserve the existing shared public navbar controls for back navigation, search placeholder access, and authentication-aware user access while also exposing links to all primary public content sections: Home, Blog, Docs, Videos, Trips, Tracks, and Comments.

#### Scenario: Visitor sees public navigation controls

- **WHEN** a visitor opens a public content page that includes the shared public navbar
- **THEN** the navbar shows links to Home, Blog, Docs, Videos, Trips, Tracks, and Comments
- **AND** each section link points to its matching current public route
- **AND** the navbar shows a login entry point

#### Scenario: Signed-in user sees account menu

- **WHEN** a signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar shows links to Home, Blog, Docs, Videos, Trips, Tracks, and Comments
- **AND** the navbar shows the authenticated account menu

#### Scenario: Existing utility controls remain available

- **WHEN** a visitor or signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar preserves the existing back navigation control
- **AND** the navbar preserves the existing search placeholder access where it is currently displayed

#### Scenario: Visitor opens Trips from public navigation

- **WHEN** a visitor activates the Trips link from the shared public navbar
- **THEN** the system navigates to the existing published hike listing route at `/hikes`
- **AND** the link remains labeled as Trips until the dedicated trip domain rename replaces the underlying route terminology

### Requirement: Public navbar renders localized navigation labels

The system SHALL render shared public navbar labels using the active public locale for supported translations while preserving the existing navigation targets and utility controls.

#### Scenario: English public navbar labels render

- **WHEN** the active public locale is English
- **THEN** the shared public navbar labels render in English
- **AND** the Home, Blog, Docs, Videos, Trips, Tracks, and Comments links continue to point to their matching current public sections
- **AND** the back navigation, search placeholder access, and auth-aware login or account access remain available

#### Scenario: Russian public navbar labels render

- **WHEN** the active public locale is Russian
- **THEN** the shared public navbar labels render in Russian
- **AND** the Home, Blog, Docs, Videos, Trips, Tracks, and Comments links continue to point to their matching current public sections
- **AND** the back navigation, search placeholder access, and auth-aware login or account access remain available

#### Scenario: Unsupported locale falls back safely

- **WHEN** the public navbar is requested with no supported active locale
- **THEN** the system falls back to the default public locale
- **AND** the shared public navbar remains usable
