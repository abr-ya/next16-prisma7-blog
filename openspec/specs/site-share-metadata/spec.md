## Purpose

Provide consistent share-preview metadata for public content pages through a reusable metadata foundation.

## Requirements

### Requirement: Shared public video page metadata

The system SHALL provide consistent share metadata for public video pages through a reusable metadata foundation.

#### Scenario: Public video page has share metadata

- **WHEN** a crawler or browser requests a public video page
- **THEN** the page SHALL expose a title suitable for link previews
- **AND** the page SHALL expose a description when one is available or derivable
- **AND** the page SHALL expose Open Graph metadata
- **AND** the page SHALL expose Twitter card metadata

#### Scenario: Public video page has no content-specific image

- **WHEN** a public video page has no content-specific preview image
- **THEN** the page SHALL use a stable site fallback preview image

#### Scenario: Videos listing page uses collection metadata

- **WHEN** the `/videos` listing page is shared
- **THEN** the page SHALL expose metadata describing the public video collection
- **AND** the page SHALL use the stable site fallback preview image

### Requirement: Dynamic video detail metadata

The system SHALL derive share metadata from public video detail records.

#### Scenario: Public video detail has metadata

- **WHEN** a public video detail page is shared
- **THEN** the page SHALL use the video title as the share title
- **AND** the page SHALL use the video thumbnail as the preview image when present
- **AND** the page SHALL use fallback description text because videos do not yet have a dedicated description field

#### Scenario: Missing or private content does not expose specific metadata

- **WHEN** requested content is missing or unavailable through public routes
- **THEN** the page SHALL NOT expose private or misleading content-specific share metadata

### Requirement: Metadata URL behavior

The system SHALL produce reliable absolute metadata URLs for public content pages and preview images.

#### Scenario: Metadata includes canonical URL

- **WHEN** public video page metadata is generated
- **THEN** the metadata SHALL include an absolute canonical URL for that page

#### Scenario: Preview image URL is absolute

- **WHEN** public video page metadata includes a preview image
- **THEN** the preview image URL SHALL be absolute or resolvable by the framework as an absolute public asset URL

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
- **AND** the page SHALL use the doc preview image when present or the stable site fallback preview image otherwise

#### Scenario: Public doc detail has canonical URL

- **WHEN** metadata is generated for an existing public doc detail page
- **THEN** the metadata SHALL include an absolute canonical URL for that doc slug

#### Scenario: Missing doc detail does not expose specific metadata

- **WHEN** metadata is generated for a missing or unavailable doc slug
- **THEN** the page SHALL NOT expose content-specific doc title or description metadata

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
