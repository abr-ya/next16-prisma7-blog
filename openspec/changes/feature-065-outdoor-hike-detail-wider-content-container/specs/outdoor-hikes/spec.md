## ADDED Requirements

### Requirement: Public hike detail uses a wide content container

The system SHALL render published hike detail pages in a wide content container so the route map, linked-track list, and photo gallery can use more horizontal space than the default public prose column, while keeping the hike title, type, date range, and description on a narrower readable measure.

#### Scenario: Visitor opens hike detail with map and photos

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that shows a route map or a photo gallery
- **THEN** the map and photo gallery occupy the wide hike-detail content container
- **AND** that container is wider than the default public prose column used for title and description
- **AND** the hike title, type, date range, and description remain on the narrower readable measure

#### Scenario: Visitor opens hike detail without map or photos

- **WHEN** a visitor opens `/hikes/[slug]` for a published hike that has no route map and no photo gallery
- **THEN** the page remains usable with title, type, date range, and description on the narrower readable measure
- **AND** it does not show an empty wide media shell

#### Scenario: Other public pages keep the default prose column

- **WHEN** a visitor opens a public page that is not `/hikes/[slug]`
- **THEN** this slice SHALL NOT change that page's content-container width
