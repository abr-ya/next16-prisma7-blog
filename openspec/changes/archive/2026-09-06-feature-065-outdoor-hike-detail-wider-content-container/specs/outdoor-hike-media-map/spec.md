## ADDED Requirements

### Requirement: Hike map and gallery use the wide content column

The system SHALL render the public hike route map and hike photo gallery in the wide hike-detail content column rather than constraining them to the narrower title/description measure.

#### Scenario: Route map spans the wide column

- **WHEN** a published hike detail page renders a route map
- **THEN** the map occupies the wide hike-detail content column
- **AND** it is not limited to the narrower title/description measure

#### Scenario: Photo gallery spans the wide column

- **WHEN** a published hike detail page renders a linked photo gallery
- **THEN** the gallery occupies the wide hike-detail content column
- **AND** it is not limited to the narrower title/description measure

#### Scenario: Photo gallery uses three columns on a wide viewport

- **WHEN** a published hike detail page renders a linked photo gallery on a medium-or-wider viewport
- **THEN** the gallery shows up to three photos per row
- **AND** a narrow viewport still stacks photos in a single column

#### Scenario: Linked-track cards use three columns on a wide viewport

- **WHEN** a published hike detail page renders linked tracks on a medium-or-wider viewport
- **THEN** the linked-track cards show up to three cards per row
- **AND** a narrow viewport still stacks those cards in a single column

#### Scenario: Map and gallery behavior otherwise unchanged

- **WHEN** a visitor opens a published hike whose map or gallery uses the wide content column
- **THEN** existing map layers, photo visibility, thumbnail vs full-image access, and marker rules remain unchanged
