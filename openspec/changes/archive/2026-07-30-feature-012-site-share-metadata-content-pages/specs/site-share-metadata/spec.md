## ADDED Requirements

### Requirement: Public blog listing metadata
The system SHALL provide consistent share metadata for the public blog listing page through the reusable metadata foundation.

#### Scenario: Blog listing page has collection metadata
- **WHEN** the `/blog` listing page is shared
- **THEN** the page SHALL expose a title suitable for the public blog collection
- **AND** the page SHALL expose a description suitable for the public blog collection
- **AND** the page SHALL expose Open Graph metadata
- **AND** the page SHALL expose Twitter card metadata
- **AND** the page SHALL use the stable site fallback preview image

#### Scenario: Blog listing page has canonical URL
- **WHEN** metadata is generated for the `/blog` listing page
- **THEN** the metadata SHALL include an absolute canonical URL for `/blog`

### Requirement: Dynamic public blog post metadata
The system SHALL derive share metadata from public blog post detail records.

#### Scenario: Public blog post detail has metadata
- **WHEN** a public `/blog/[slug]` page is shared for an existing post
- **THEN** the page SHALL use the post title as the share title
- **AND** the page SHALL expose a description derived from post content when possible
- **AND** the page SHALL use the post image as the preview image when present
- **AND** the page SHALL expose Open Graph metadata
- **AND** the page SHALL expose Twitter card metadata

#### Scenario: Public blog post detail has canonical URL
- **WHEN** metadata is generated for an existing public blog post detail page
- **THEN** the metadata SHALL include an absolute canonical URL for that post slug

#### Scenario: Missing blog post detail does not expose specific metadata
- **WHEN** metadata is generated for a missing or unavailable blog post slug
- **THEN** the page SHALL NOT expose content-specific blog post title, description, or preview image metadata

### Requirement: Remaining public content page metadata
The system SHALL provide stable share metadata for remaining public content pages that are not already covered by videos, docs, or blog detail behavior.

#### Scenario: Home page has site metadata
- **WHEN** the `/` home page is shared
- **THEN** the page SHALL expose a title suitable for the site home page
- **AND** the page SHALL expose a description suitable for the site home page
- **AND** the page SHALL expose Open Graph metadata
- **AND** the page SHALL expose Twitter card metadata
- **AND** the page SHALL use the stable site fallback preview image

#### Scenario: Comments page has collection metadata
- **WHEN** the `/comments` page is shared
- **THEN** the page SHALL expose a title suitable for the public comments page
- **AND** the page SHALL expose a description suitable for the public comments page
- **AND** the page SHALL expose Open Graph metadata
- **AND** the page SHALL expose Twitter card metadata
- **AND** the page SHALL use the stable site fallback preview image

#### Scenario: Remaining public content pages have canonical URLs
- **WHEN** metadata is generated for `/` or `/comments`
- **THEN** the metadata SHALL include an absolute canonical URL for the requested public page
