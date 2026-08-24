## ADDED Requirements

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
