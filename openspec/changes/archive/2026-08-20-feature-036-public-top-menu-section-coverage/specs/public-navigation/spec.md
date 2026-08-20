## MODIFIED Requirements

### Requirement: Public navbar preserves existing navigation controls

The system SHALL preserve the existing shared public navbar controls for back navigation, search placeholder access, and authentication-aware user access while also exposing links to all primary public content sections: Home, Blog, Docs, Videos, and Comments.

#### Scenario: Visitor sees public navigation controls

- **WHEN** a visitor opens a public content page that includes the shared public navbar
- **THEN** the navbar shows links to Home, Blog, Docs, Videos, and Comments
- **AND** each section link points to its matching public route
- **AND** the navbar shows a login entry point

#### Scenario: Signed-in user sees account menu

- **WHEN** a signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar shows links to Home, Blog, Docs, Videos, and Comments
- **AND** the navbar shows the authenticated account menu

#### Scenario: Existing utility controls remain available

- **WHEN** a visitor or signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar preserves the existing back navigation control
- **AND** the navbar preserves the existing search placeholder access where it is currently displayed
