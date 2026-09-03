## MODIFIED Requirements

### Requirement: Home page presents primary public content sections

The system SHALL present the public home page as a content hub with primary links to Blog, Video Links, Markdown Documents, Trips, and Comments in that priority order.

#### Scenario: Visitor sees prioritized content links

- **WHEN** a visitor opens `/`
- **THEN** the home page shows primary links to Blog, Video Links, Markdown Documents, Trips, and Comments
- **AND** the links appear in that priority order
- **AND** each link points to its matching current public route

#### Scenario: Visitor sees section descriptions

- **WHEN** a visitor opens `/`
- **THEN** each primary content section includes a short English description of the section
- **AND** the home page does not describe sections as old or new site versions

#### Scenario: Visitor opens Trips from the home page

- **WHEN** a visitor activates the Trips link from the home page
- **THEN** the system navigates to the existing published hike listing route at `/hikes`
- **AND** the link remains labeled as Trips until the dedicated trip domain rename replaces the underlying route terminology
