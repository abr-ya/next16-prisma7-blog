# Public Home Page Specification

## Purpose

Defines the public home page as a visitor-facing content hub that presents the site's main open content sections in priority order with clear English labels and descriptions.

## Requirements

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

### Requirement: Home page arranges supporting sections compactly

The system SHALL arrange the About Me and Recent Documents supporting sections side by side on desktop-sized viewports, with About Me taking roughly one quarter of the row and Recent Documents taking roughly three quarters, and keep them readable on narrow viewports.

#### Scenario: Desktop visitor sees supporting sections on one row

- **WHEN** a visitor opens `/` on a desktop-sized viewport
- **THEN** the About Me section and Recent Documents section are presented at the same visual level in a two-column layout
- **AND** the Recent Documents section is wider than the About Me section

#### Scenario: Mobile visitor sees readable supporting sections

- **WHEN** a visitor opens `/` on a narrow viewport
- **THEN** the About Me section and Recent Documents section remain readable
- **AND** their text and controls do not overlap
