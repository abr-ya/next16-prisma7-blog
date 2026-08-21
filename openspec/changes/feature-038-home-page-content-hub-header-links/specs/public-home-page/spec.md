## Purpose

Defines the public home page as a visitor-facing content hub that presents the site's main open content sections in priority order with clear English labels and descriptions.

## ADDED Requirements

### Requirement: Home page presents primary public content sections
The system SHALL present the public home page as a content hub with primary links to Blog, Video Links, Markdown Documents, and Comments in that priority order.

#### Scenario: Visitor sees prioritized content links
- **WHEN** a visitor opens `/`
- **THEN** the home page shows primary links to Blog, Video Links, Markdown Documents, and Comments
- **AND** the links appear in that priority order
- **AND** each link points to its matching public route

#### Scenario: Visitor sees section descriptions
- **WHEN** a visitor opens `/`
- **THEN** each primary content section includes a short English description of the section
- **AND** the home page does not describe sections as old or new site versions

### Requirement: Home page marks unfinished comments section
The system SHALL communicate that the standalone Comments section is still in progress while keeping it discoverable from the home page.

#### Scenario: Visitor sees comments work-in-progress state
- **WHEN** a visitor opens `/`
- **THEN** the Comments section link remains visible
- **AND** the Comments section description or status label indicates that the section is still in progress

### Requirement: Home page keeps secondary admin access
The system SHALL keep a home page entry point to the admin dashboard while making it visually secondary to public content links.

#### Scenario: Visitor sees secondary admin link
- **WHEN** a visitor opens `/`
- **THEN** the home page includes a link to `/admin`
- **AND** the admin link is visually less prominent than the primary public content section links
