# Spec Delta

## MODIFIED Requirements

### Requirement: Public navbar route coverage is inventoried before rollout

The system SHALL document public navbar route coverage in a maintained inventory document. The inventory SHALL list the primary public route families, identify routes excluded from public navbar coverage (admin, auth, API, UploadThing, file delivery, framework/static internals), and reflect the current delivered coverage state. The inventory is consulted as primary public route families are added, migrated, or removed, and is updated in lockstep with the change that touches each route family.

#### Scenario: Maintainer reviews public navbar coverage

- **WHEN** a maintainer opens the route coverage inventory document
- **THEN** it lists the primary public route families with their current navbar coverage state
- **AND** it identifies routes excluded from public navbar coverage, including admin, auth, API, UploadThing, file delivery, and framework/static internals
- **AND** each primary public route family reads as either `Covered by shared public shell` or `Excluded` with the reason

## ADDED Requirements

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

