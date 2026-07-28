## ADDED Requirements

### Requirement: Public docs page metadata
The system SHALL provide consistent share metadata for public docs pages through the reusable metadata foundation.

#### Scenario: Docs listing page has collection metadata
- **WHEN** the `/docs` listing page is shared
- **THEN** the page SHALL expose a title suitable for the public docs collection
- **AND** the page SHALL expose a description suitable for the public docs collection
- **AND** the page SHALL expose Open Graph metadata
- **AND** the page SHALL expose Twitter card metadata
- **AND** the page SHALL use the stable site fallback preview image

#### Scenario: Docs listing page has canonical URL
- **WHEN** metadata is generated for the `/docs` listing page
- **THEN** the metadata SHALL include an absolute canonical URL for `/docs`

### Requirement: Dynamic public doc detail metadata
The system SHALL derive share metadata from public markdown doc detail records.

#### Scenario: Public doc detail has metadata
- **WHEN** a public `/docs/[slug]` page is shared for an existing doc
- **THEN** the page SHALL use the doc title as the share title
- **AND** the page SHALL expose a description derived from doc content when possible
- **AND** the page SHALL expose Open Graph metadata
- **AND** the page SHALL expose Twitter card metadata
- **AND** the page SHALL use the stable site fallback preview image

#### Scenario: Public doc detail has canonical URL
- **WHEN** metadata is generated for an existing public doc detail page
- **THEN** the metadata SHALL include an absolute canonical URL for that doc slug

#### Scenario: Missing doc detail does not expose specific metadata
- **WHEN** metadata is generated for a missing or unavailable doc slug
- **THEN** the page SHALL NOT expose content-specific doc title or description metadata
