## ADDED Requirements

### Requirement: Public navbar covers primary public route families

The system SHALL render the shared public navbar on every primary public content route while preserving route-specific page content and existing public route URLs.

#### Scenario: Visitor opens the home page

- **WHEN** a visitor opens `/`
- **THEN** the page renders the shared public navbar
- **AND** the page keeps the existing home page content hub content visible below the navbar

#### Scenario: Visitor opens docs routes

- **WHEN** a visitor opens `/docs` or a visible `/docs/[slug]` detail route
- **THEN** the page renders the shared public navbar
- **AND** the docs listing or detail content remains available on the same route

#### Scenario: Visitor opens comments route

- **WHEN** a visitor opens `/comments`
- **THEN** the page renders the shared public navbar
- **AND** the current comments page content remains available on the same route

#### Scenario: Existing navbar-covered routes remain covered

- **WHEN** a visitor opens `/blog`, `/blog/[slug]`, `/videos`, or `/videos/[id]`
- **THEN** the page continues to render the shared public navbar
- **AND** the existing page content and public route URL remain unchanged

#### Scenario: Signed-in user opens any primary public content route

- **WHEN** a signed-in user opens `/`, `/blog`, `/blog/[slug]`, `/docs`, `/docs/[slug]`, `/videos`, `/videos/[id]`, or `/comments`
- **THEN** the page renders the shared public navbar
- **AND** the navbar exposes authenticated account access instead of the visitor login entry point
