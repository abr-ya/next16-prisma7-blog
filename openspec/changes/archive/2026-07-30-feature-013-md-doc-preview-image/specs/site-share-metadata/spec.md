## ADDED Requirements

### Requirement: Markdown doc preview image metadata
The system SHALL use markdown doc preview images for doc detail share metadata when a preview image is present.

#### Scenario: Doc detail metadata uses stored preview image
- **WHEN** metadata is generated for an existing `/docs/[slug]` page whose doc has a preview image URL
- **THEN** the metadata SHALL use that preview image for Open Graph metadata
- **AND** the metadata SHALL use that preview image for Twitter card metadata

#### Scenario: Doc detail metadata falls back without stored preview image
- **WHEN** metadata is generated for an existing `/docs/[slug]` page whose doc has no preview image URL
- **THEN** the metadata SHALL use the stable site fallback preview image

#### Scenario: Missing doc does not expose preview image metadata
- **WHEN** metadata is generated for a missing or unavailable doc slug
- **THEN** the metadata SHALL NOT expose a doc-specific preview image
