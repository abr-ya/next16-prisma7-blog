# Public Navigation Specification

## Purpose

Defines the shared public navigation behavior for content layouts so visitors and signed-in users can move through public pages without client hydration errors or invalid navigation markup.

## Requirements

### Requirement: Public navbar renders hydration-safe navigation markup

The system SHALL render the shared public navbar using valid navigation menu structure that does not produce React hydration warnings caused by invalid list children.

#### Scenario: Public content page renders navbar without hydration warning

- **WHEN** a visitor or signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar renders without a hydration warning caused by the navigation menu list structure

### Requirement: Public navbar preserves existing navigation controls

The system SHALL preserve the existing shared public navbar controls for back navigation, search placeholder access, and authentication-aware user access while also exposing links to all primary public content sections: Home, Blog, Docs, Videos, Tracks, and Comments.

#### Scenario: Visitor sees public navigation controls

- **WHEN** a visitor opens a public content page that includes the shared public navbar
- **THEN** the navbar shows links to Home, Blog, Docs, Videos, Tracks, and Comments
- **AND** each section link points to its matching public route
- **AND** the navbar shows a login entry point

#### Scenario: Signed-in user sees account menu

- **WHEN** a signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar shows links to Home, Blog, Docs, Videos, Tracks, and Comments
- **AND** the navbar shows the authenticated account menu

#### Scenario: Existing utility controls remain available

- **WHEN** a visitor or signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar preserves the existing back navigation control
- **AND** the navbar preserves the existing search placeholder access where it is currently displayed

### Requirement: Public navbar supports language switching

The system SHALL provide a language switcher in the shared public navbar for the supported public locales.

#### Scenario: Visitor changes public navbar language

- **WHEN** a visitor opens a public content page that includes the shared public navbar
- **THEN** the navbar exposes controls for English and Russian
- **AND** selecting a supported locale updates the active public locale
- **AND** the visitor remains within the matching public navigation context

#### Scenario: Signed-in user changes public navbar language

- **WHEN** a signed-in user opens a public content page that includes the shared public navbar
- **THEN** the navbar exposes controls for English and Russian
- **AND** selecting a supported locale updates the active public locale
- **AND** the navbar continues to show the authenticated account menu

### Requirement: Public navbar renders localized navigation labels

The system SHALL render shared public navbar labels using the active public locale for supported translations while preserving the existing navigation targets and utility controls.

#### Scenario: English public navbar labels render

- **WHEN** the active public locale is English
- **THEN** the shared public navbar labels render in English
- **AND** the Home, Blog, Docs, Videos, Tracks, and Comments links continue to point to their matching public sections
- **AND** the back navigation, search placeholder access, and auth-aware login or account access remain available

#### Scenario: Russian public navbar labels render

- **WHEN** the active public locale is Russian
- **THEN** the shared public navbar labels render in Russian
- **AND** the Home, Blog, Docs, Videos, Tracks, and Comments links continue to point to their matching public sections
- **AND** the back navigation, search placeholder access, and auth-aware login or account access remain available

#### Scenario: Unsupported locale falls back safely

- **WHEN** the public navbar is requested with no supported active locale
- **THEN** the system falls back to the default public locale
- **AND** the shared public navbar remains usable

### Requirement: Public navbar route coverage is inventoried before rollout

The system SHALL document public navbar route coverage before completing the broad rollout, including current coverage, intended coverage, and excluded route families.

#### Scenario: Maintainer reviews public navbar coverage

- **WHEN** a maintainer opens the route coverage inventory document
- **THEN** it lists the primary public route families considered for shared navbar coverage
- **AND** it identifies routes excluded from public navbar coverage, including admin, auth, API, UploadThing, file delivery, and framework/static internals
- **AND** it distinguishes routes covered in this slice from routes deferred to follow-up rollout

### Requirement: Shared public navbar shell is reusable

The system SHALL provide a reusable server-side public navbar shell that renders the existing shared navbar with the same auth-aware user props used by currently covered public routes.

#### Scenario: Visitor opens a route using the shared shell

- **WHEN** a visitor opens a public route wrapped by the shared shell
- **THEN** the page renders the shared public navbar
- **AND** the navbar exposes the visitor login entry point
- **AND** the wrapped route content remains available on the same route

#### Scenario: Signed-in user opens a route using the shared shell

- **WHEN** a signed-in user opens a public route wrapped by the shared shell
- **THEN** the page renders the shared public navbar
- **AND** the navbar exposes authenticated account access instead of the visitor login entry point
- **AND** server-side authorization boundaries remain unchanged

### Requirement: Docs routes pilot the shared public navbar shell

The system SHALL render the shared public navbar on the Docs route family as the first rollout slice while preserving existing Docs content behavior and public URLs.

#### Scenario: Visitor opens docs listing or detail routes

- **WHEN** a visitor opens `/docs` or a visible `/docs/[slug]` detail route
- **THEN** the page renders the shared public navbar
- **AND** the docs listing or detail content remains available on the same route

#### Scenario: Signed-in user opens docs listing or detail routes

- **WHEN** a signed-in user opens `/docs` or a visible `/docs/[slug]` detail route
- **THEN** the page renders the shared public navbar
- **AND** the navbar exposes authenticated account access instead of the visitor login entry point

#### Scenario: Existing Blog and Videos routes remain stable during the pilot

- **WHEN** a visitor opens `/blog`, `/blog/[slug]`, `/videos`, or `/videos/[id]`
- **THEN** the page continues to render the shared public navbar
- **AND** the existing page content, account behavior, and public route URL remain unchanged
