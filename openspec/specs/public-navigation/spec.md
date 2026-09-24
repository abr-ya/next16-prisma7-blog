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

### Requirement: Public navbar route coverage is inventoried before rollout

The system SHALL document public navbar route coverage in a maintained inventory document. The inventory SHALL list the primary public route families, identify routes excluded from public navbar coverage (admin, auth, API, UploadThing, file delivery, framework/static internals), and reflect the current delivered coverage state. The inventory is consulted as primary public route families are added, migrated, or removed, and is updated in lockstep with the change that touches each route family.

#### Scenario: Maintainer reviews public navbar coverage

- **WHEN** a maintainer opens the route coverage inventory document
- **THEN** it lists the primary public route families with their current navbar coverage state
- **AND** it identifies routes excluded from public navbar coverage, including admin, auth, API, UploadThing, file delivery, and framework/static internals
- **AND** each primary public route family reads as either `Covered by shared public shell` or `Excluded` with the reason

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

### Requirement: Primary public routes are covered by the shared public navbar shell

The system SHALL render the shared public navbar on all primary public route families via the reusable server-side public navbar shell, with `/admin/*`, `/(auth)/sign-in`, `/(auth)/sign-up`, `/files/*`, `/api/*`, and framework/static routes remaining outside the shell. Public route families that are listed as `Covered by shared public shell` in the route coverage inventory MUST render the same shared navbar with the same auth-aware user props that currently covered routes use. Public URLs and content behavior on those routes are preserved.

#### Scenario: Visitor opens a primary public route listed in the coverage inventory

- **WHEN** a visitor opens `/`, `/blog`, `/blog/[slug]`, `/videos`, `/videos/[id]`, `/comments`, `/docs`, `/docs/[slug]`, `/hikes`, `/hikes/[slug]`, `/tracks`, `/tracks/[slug]`, `/profile`, or `/trips/invitations`
- **THEN** the page renders the shared public navbar
- **AND** the page content remains available on the same public URL
- **AND** the navbar exposes the visitor login entry point

#### Scenario: Signed-in user opens a primary public route listed in the coverage inventory

- **WHEN** a signed-in user opens `/`, `/blog`, `/blog/[slug]`, `/videos`, `/videos/[id]`, `/comments`, `/docs`, `/docs/[slug]`, `/hikes`, `/hikes/[slug]`, `/tracks`, `/tracks/[slug]`, `/profile`, or `/trips/invitations`
- **THEN** the page renders the shared public navbar
- **AND** the navbar exposes authenticated account access instead of the visitor login entry point
- **AND** server-side authorization boundaries remain unchanged

#### Scenario: Visitor opens a route family explicitly excluded from shared public navbar coverage

- **WHEN** a visitor or signed-in user opens `/admin/*`, `/(auth)/sign-in`, `/(auth)/sign-up`, `/files/*`, or framework/static routes
- **THEN** the page does not render the shared public navbar
- **AND** the route uses its domain-appropriate chrome (admin shell, auth shell, raw delivery, or no chrome) without leaking shared public navbar controls

#### Scenario: Primary public route rendering uses the renamed public route group

- **WHEN** a primary public route in the coverage inventory renders
- **THEN** the route's parent layout chain includes the renamed `app/(public)/layout.tsx` shell
- **AND** no primary public route under coverage relies on its own top-level `app/<segment>/layout.tsx` only to mount the shared navbar

### Requirement: Legacy page-level back-link affordance is removed from public PageLayout

The system SHALL NOT render a page-level `← Back to Home` affordance from `PageLayout` on any route. The shared public navbar provides site-wide navigation; per-page back links on public content pages are no longer rendered. Public Pages rendered through `PageLayout` continue to expose the `<main>` content shell, the heading, and the optional header action slot.

#### Scenario: Public page rendered through PageLayout omits page-level back link

- **WHEN** a visitor or signed-in user opens any public page whose body uses `PageLayout`
- **THEN** the page does not render a `← Back to Home` link at the top of the content area
- **AND** the `<main>` shell, heading, and `PageLayout` content area remain available as before
