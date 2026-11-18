# Spec Delta

## ADDED Requirements

### Requirement: A route title is bounded

The system SHALL refuse a route title that is empty or longer than 150 characters, both when a route is created and when it is renamed, and SHALL leave the stored route unchanged when it refuses. The form and the server SHALL use the same limit.

#### Scenario: A title that is too long is refused

- **WHEN** the owner stores a route title longer than 150 characters
- **THEN** the system refuses the change with a validation message that names the limit
- **AND** the route keeps its stored title

#### Scenario: A title that is missing is refused

- **WHEN** the owner stores a route without a title
- **THEN** the system refuses the change with a validation message
- **AND** the route keeps its stored title
