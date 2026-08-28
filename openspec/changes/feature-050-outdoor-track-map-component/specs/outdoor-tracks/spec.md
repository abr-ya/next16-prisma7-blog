## ADDED Requirements

### Requirement: Public track detail renders a stored geometry map
The system SHALL render an interactive map on published track detail pages when the track has successful parsed map-ready geometry.

#### Scenario: Visitor opens parsed track detail
- **WHEN** a visitor opens `/tracks/[slug]` for a published track with successful parsed map-ready geometry
- **THEN** the page displays an interactive map for that track
- **AND** the map renders the stored route geometry as an ordered polyline
- **AND** the map viewport frames the route bounds

#### Scenario: Map identifies route endpoints
- **WHEN** the rendered track geometry contains at least two coordinate points
- **THEN** the map visually distinguishes the route start and end points
- **AND** the start and end points use the stored geometry order

#### Scenario: Public map uses stored metadata
- **WHEN** a visitor opens a track detail page with a rendered map
- **THEN** the system uses stored parsed metadata and map-ready geometry
- **AND** it does not parse or fetch the raw GPX file as part of rendering the map

### Requirement: Public track detail handles missing map geometry gracefully
The system SHALL preserve the published track detail page when map-ready geometry is unavailable.

#### Scenario: Visitor opens unparsed track detail
- **WHEN** a visitor opens `/tracks/[slug]` for a published track without successful map-ready geometry
- **THEN** the page displays the existing track metadata, GPX summary when available, and GPX download availability
- **AND** it shows a non-failing fallback instead of an interactive map

#### Scenario: Visitor opens stale or failed parsed track detail
- **WHEN** a visitor opens `/tracks/[slug]` for a published track whose parsed metadata is stale or failed
- **THEN** the page remains usable
- **AND** it does not expose stale or failed map geometry as a current route map

### Requirement: Public track map preserves visibility boundaries
The system SHALL render public track maps only through published track detail pages and visibility-safe stored metadata.

#### Scenario: Draft track has map geometry
- **WHEN** a visitor requests a draft track that has parsed map-ready geometry
- **THEN** the system responds as not found
- **AND** it does not expose the route map or geometry

#### Scenario: Map rendering avoids private file URLs
- **WHEN** the public track map renders for a published track
- **THEN** the page SHALL NOT expose UploadThing provider URLs or raw GPX file URLs for map rendering
- **AND** GPX download links continue to follow existing file visibility rules
