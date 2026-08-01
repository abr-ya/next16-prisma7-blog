## ADDED Requirements

### Requirement: Video comments participate in shared comment domain

The system SHALL treat existing video comments as the first supported target in the future project-wide comment domain.

#### Scenario: Video comments keep current behavior

- **WHEN** the shared comment domain is planned
- **THEN** existing public video comment reads, creation, list rendering, and ownership behavior SHALL remain unchanged in this planning slice

#### Scenario: Video comments can normalize to shared list item

- **WHEN** future shared comment helpers are implemented
- **THEN** video comments SHALL be adaptable to the shared comment list item contract
- **AND** each video comment item SHALL link back to its public video target page
