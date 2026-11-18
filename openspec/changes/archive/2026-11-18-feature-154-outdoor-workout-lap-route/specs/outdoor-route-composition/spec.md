# Spec Delta

## ADDED Requirements

### Requirement: A workout creation can build or reuse a lap variant inline

Every route-based workout creation flow SHALL offer a **Laps** field next to the route selector, with a whole number of at least one and a default of one. A value of one SHALL use the chosen route unchanged. A value above one SHALL create or reuse a lap variant — a composite route with one `MAIN` segment, the chosen route, and that lap count — and the workout SHALL point at the variant. An identical variant owned by the caller SHALL be reused instead of duplicated. The variant's default title SHALL be `<route title> × <laps>`, within the route title limit.

#### Scenario: A track form creates a three-lap workout

- **WHEN** the owner picks a loop route on the **From route** tab, sets **Laps** to three, and saves
- **THEN** the system creates or reuses a three-lap variant
- **AND** the track points at that variant
- **AND** its map and distance come from three generated loops

#### Scenario: The quick route dialog creates a lap workout

- **WHEN** the owner sets **Laps** to three in the quick walk or run route mode and saves
- **THEN** the created workout points at a three-lap variant of the chosen route
- **AND** the title and slug still follow the quick workout conventions

#### Scenario: A draft is completed with laps

- **WHEN** the owner completes a pending draft with a route and **Laps** set above one
- **THEN** the draft's track points at the lap variant
- **AND** its stored start, duration, and timezone are kept

#### Scenario: One lap uses the route unchanged

- **WHEN** the owner leaves **Laps** at one
- **THEN** the workout points at the chosen route itself
- **AND** no variant is created

#### Scenario: An identical variant is reused

- **WHEN** the owner creates a second workout with the same route and the same lap count
- **THEN** the existing variant is reused
- **AND** no second identical route is created
- **AND** both workouts point at the same route

#### Scenario: Different lap counts produce different variants

- **WHEN** the same loop is saved once with two laps and once with three
- **THEN** each workout points at its own variant
- **AND** both variants stay available in the route library

#### Scenario: An open route cannot become a lap variant

- **WHEN** the chosen route does not close and **Laps** is above one
- **THEN** the system refuses the save with a message that a repeated segment must be a closed loop
- **AND** the dialog stays open with the entered values
- **AND** no workout and no variant are created

#### Scenario: A lap count below one is refused

- **WHEN** a lap count that is not a whole number of at least one reaches the server
- **THEN** the system refuses the save with a validation message
- **AND** no workout is created
