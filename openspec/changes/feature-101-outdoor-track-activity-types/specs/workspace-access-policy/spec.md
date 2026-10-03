# Spec Delta

## ADDED Requirements

### Requirement: Track activity-type catalog is administrator-controlled

The system SHALL restrict creation, rename, activation, deactivation, reassignment, and deletion of global track activity types to administrators, while allowing ordinary users to read only the active options needed to classify their own tracks.

#### Scenario: Administrator opens activity-type management

- **WHEN** an administrator opens the administrator control surface for track activity types
- **THEN** the system displays activity-type lifecycle controls
- **AND** it permits only the administrator-managed mutations defined for that catalog

#### Scenario: Ordinary user requests catalog management

- **WHEN** a signed-in ordinary user requests the activity-type management route or directly invokes an activity-type lifecycle mutation
- **THEN** the system denies the request before exposing global management controls or changing catalog data
- **AND** the user retains access only to active options for their own track-editing workflow

#### Scenario: Anonymous visitor requests catalog data

- **WHEN** an anonymous visitor requests an authenticated track-classification option list or catalog management route
- **THEN** the system requires authentication or denies the request according to route convention
- **AND** it does not expose management controls
