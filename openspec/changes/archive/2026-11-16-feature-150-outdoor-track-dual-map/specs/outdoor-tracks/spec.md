# Spec Delta

## MODIFIED Requirements

### Requirement: Public track detail renders a stored geometry map

The system SHALL render an interactive map on published track detail pages when at least one stored geometry is parseable. It SHALL render the primary geometry and every parsed secondary recording geometry as separate lines, and SHALL fit the viewport to all rendered lines.

#### Scenario: Visitor opens parsed track detail

- **WHEN** a visitor opens `/tracks/[slug]` for a published track with successful parsed map-ready geometry
- **THEN** the page displays an interactive map for that track
- **AND** the map renders the stored primary geometry as an ordered polyline
- **AND** the map viewport frames the rendered geometry

#### Scenario: Route-primary track shows the recorded trace

- **WHEN** a published track's primary geometry is a route and it has a parsed secondary recording
- **THEN** the map draws the route as the primary solid line and the recording as a dashed secondary line
- **AND** a legend names both lines
- **AND** the viewport frames both lines

#### Scenario: Map identifies route endpoints

- **WHEN** the primary geometry contains at least two coordinate points
- **THEN** the map visually distinguishes the primary route start and end points
- **AND** the start and end points use the stored geometry order
- **AND** a secondary recording line has no start or end markers in this slice

#### Scenario: Public map uses stored metadata

- **WHEN** a visitor opens a track detail page with a rendered map
- **THEN** the system uses stored parsed metadata and map-ready geometry for every rendered line
- **AND** it does not parse or fetch a raw GPX file as part of rendering the map

#### Scenario: Secondary recording has no parsed geometry

- **WHEN** a track has a secondary file without successful map-ready geometry
- **THEN** the map renders only the primary geometry
- **AND** the page remains usable

### Requirement: Public track map preserves visibility boundaries

The system SHALL render public track maps only through published track detail pages and visibility-safe stored metadata. The shape of a secondary recording SHALL be public with the track, while downloading its GPX file SHALL continue to follow the file's visibility.

#### Scenario: Draft track has map geometry

- **WHEN** a visitor requests a draft track that has parsed map-ready geometry
- **THEN** the system responds as not found
- **AND** it does not expose the route map or geometry

#### Scenario: Map rendering avoids private file URLs

- **WHEN** the public track map renders for a published track
- **THEN** the page SHALL NOT expose UploadThing provider URLs or raw GPX file URLs for map rendering
- **AND** GPX download links continue to follow existing file visibility rules

#### Scenario: Recorded trace is public, file is not

- **WHEN** a published route-primary track has a secondary recording with parsed geometry
- **THEN** every viewer can see its stored shape on the map
- **AND** the GPX download link still follows the file's visibility and ownership rules
