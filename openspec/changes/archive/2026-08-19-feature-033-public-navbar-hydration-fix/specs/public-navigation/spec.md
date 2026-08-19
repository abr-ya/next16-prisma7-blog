## Purpose

Defines the shared public navigation behavior for content layouts so visitors and signed-in users can move through public pages without client hydration errors or invalid navigation markup.

## ADDED Requirements

### Requirement: Public navbar renders hydration-safe navigation markup
The system SHALL render the shared public navbar using valid navigation menu structure that does not produce React hydration warnings caused by invalid list children.

#### Scenario: Public content page renders navbar without hydration warning
- **WHEN** a visitor or signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar renders without a hydration warning caused by the navigation menu list structure

### Requirement: Public navbar preserves existing navigation controls
The system SHALL preserve the existing shared public navbar controls for home navigation, video navigation, back navigation, search placeholder access, and authentication-aware user access.

#### Scenario: Visitor sees public navigation controls
- **WHEN** a visitor opens a public content page that includes the shared public navbar
- **THEN** the navbar shows the public navigation controls and a login entry point

#### Scenario: Signed-in user sees account menu
- **WHEN** a signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar shows the public navigation controls and the authenticated account menu
