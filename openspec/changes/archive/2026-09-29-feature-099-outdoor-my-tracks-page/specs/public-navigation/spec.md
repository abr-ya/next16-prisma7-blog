# Spec Delta

## ADDED Requirements

### Requirement: Signed-in user menu exposes My tracks

The signed-in public navigation user menu SHALL include a My tracks destination at `/my/tracks` alongside the existing Profile, dashboard, and sign-out controls. The destination SHALL be shown only in the authenticated account menu and SHALL not alter the visitor navigation controls.

#### Scenario: Signed-in user opens account menu

- **WHEN** a signed-in user opens the public navigation account menu
- **THEN** the menu includes a My tracks link that points to `/my/tracks`
- **AND** the existing Profile, dashboard, and sign-out controls remain available

#### Scenario: Visitor opens public navigation

- **WHEN** an anonymous visitor opens a public page with shared navigation
- **THEN** the navigation continues to show the login entry point
- **AND** it does not show a My tracks destination
