# Spec Delta

## ADDED Requirements

### Requirement: The owner marks a route as an ingredient

The system SHALL let the owner set and clear an ingredient flag on their own route. Setting the flag SHALL be refused while the route is attached to a track or while it is a composite parent. Clearing the flag SHALL always be allowed. A foreign or missing route SHALL be refused.

#### Scenario: An unused route becomes a part

- **WHEN** the owner marks a standalone route that no track uses and that has no composition
- **THEN** the system stores the ingredient flag
- **AND** the route stops being offered wherever a standalone route is picked

#### Scenario: An attached route cannot become a part

- **WHEN** the owner marks a route that one or more tracks use
- **THEN** the system refuses the change with a message that names the track count
- **AND** the flag stays as it was

#### Scenario: A composite route cannot become a part

- **WHEN** the owner marks a route that has a composition
- **THEN** the system refuses the change with a message that a composite route is not an ingredient
- **AND** the flag stays as it was

#### Scenario: A part becomes standalone again

- **WHEN** the owner clears the flag on a part
- **THEN** the route is offered again as a standalone route
- **AND** its existing role as a segment of a composition is unchanged

#### Scenario: Another owner's route is refused

- **WHEN** the owner tries to change the flag on a route they do not own
- **THEN** the system refuses the change
- **AND** the flag stays as it was

### Requirement: Ingredients stay out of pickers and the default library

The route library SHALL hide ingredient routes by default and SHALL offer a filter that reveals them with a part badge. Every standalone-route picker SHALL exclude ingredient routes. The composition builder SHALL still offer an ingredient route as a segment.

#### Scenario: The library hides parts by default

- **WHEN** the owner opens `/my/routes`
- **THEN** ingredient routes are not listed
- **AND** a control reports how many are hidden

#### Scenario: The filter reveals a part

- **WHEN** the owner enables the parts filter
- **THEN** ingredient routes are listed with a part badge
- **AND** they can be previewed and edited like any other route

#### Scenario: A picker excludes parts

- **WHEN** the owner creates or changes a workout and opens a route picker
- **THEN** ingredient routes are not offered
- **AND** every standalone route is offered as before

#### Scenario: The builder still offers a part

- **WHEN** the owner opens the composition builder
- **THEN** an ingredient route is offered as a segment
- **AND** a route with a composition is not
