## ADDED Requirements

### Requirement: Trip photo contribution is presented in the Photos section header

The system SHALL show the existing authorized `Add photo` action in the Photos section header of a published trip detail page, alongside the Photos heading. It SHALL not render a separate trip photo-contribution panel at the bottom of that page. The Photos section header SHALL remain visible when the trip has no linked photos if the current user is eligible to contribute.

#### Scenario: Eligible contributor views a trip with photos

- **WHEN** a trip creator, accepted participant, or administrator who remains below any applicable contribution quota opens a published trip with linked photos
- **THEN** the Photos heading presents an enabled `Add photo` action
- **AND** no duplicate page-bottom contribution panel is shown

#### Scenario: Eligible contributor views a trip without photos

- **WHEN** a current user eligible to contribute opens a published trip with no linked photos
- **THEN** the page renders the Photos section header with the `Add photo` action
- **AND** selecting it uses the existing trip photo upload workflow

#### Scenario: Contributor has reached the photo quota

- **WHEN** a non-administrator contributor who has reached the trip photo quota opens the published trip
- **THEN** the Photos section header presents the existing disabled contribution state and quota feedback
- **AND** the page does not show a separate page-bottom contribution panel

#### Scenario: User is not eligible to contribute

- **WHEN** an anonymous user or a signed-in user without contribution authority opens a published trip
- **THEN** the page does not expose the `Add photo` action
- **AND** existing photo-gallery visibility behavior remains unchanged
