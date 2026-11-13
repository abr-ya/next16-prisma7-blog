# Spec Delta

## ADDED Requirements

### Requirement: The owner starts a manual route from a saved place

The system SHALL let a signed-in owner pick one of their saved places in the manual route form, and SHALL place the chosen place as the route's first point of geometry. The route SHALL store no start-point field of its own: the picked place only decides where the first point goes.

#### Scenario: Owner starts a route from a saved place

- **WHEN** a signed-in owner picks a saved place in the manual route form
- **THEN** the route's first point is that place's coordinate
- **AND** the owner goes on placing the rest of the route after that point

#### Scenario: Owner picks a place after placing points

- **WHEN** a signed-in owner picks a saved place while the form already holds points
- **THEN** the chosen place becomes the first point of the form's geometry
- **AND** the points the owner already placed keep their order after it

#### Scenario: The picker offers only the owner's saved places

- **WHEN** a signed-in owner opens the saved-place picker in the manual route form
- **THEN** it lists only that owner's saved places
- **AND** it offers no saved place belonging to another owner

#### Scenario: The owner has no saved places

- **WHEN** a signed-in owner with no saved places opens the manual route form
- **THEN** the form offers no saved place to pick
- **AND** it points the owner at the saved places page

#### Scenario: The picked place is not stored on the route

- **WHEN** the owner saves a route that started from a saved place
- **THEN** the route stores its geometry only, with no saved place reference and no start-point field of its own
- **AND** the route's start is the first point of that geometry

#### Scenario: Picking a place leaves the saved place alone

- **WHEN** the owner picks a saved place in the manual route form
- **THEN** that saved place is unchanged
- **AND** it stays available for the owner's next route
