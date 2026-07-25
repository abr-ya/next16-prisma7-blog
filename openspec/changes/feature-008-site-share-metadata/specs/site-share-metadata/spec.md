## ADDED Requirements

### Requirement: Shared public page metadata

The system SHALL provide consistent share metadata for public pages.

#### Scenario: Public page has share metadata

- **WHEN** a crawler or browser requests a public page
- **THEN** the page SHALL expose a title suitable for link previews
- **AND** the page SHALL expose a description when one is available or derivable
- **AND** the page SHALL expose Open Graph metadata
- **AND** the page SHALL expose Twitter card metadata

#### Scenario: Public page has no content-specific image

- **WHEN** a public page has no content-specific preview image
- **THEN** the page SHALL use a stable site fallback preview image

#### Scenario: Public listing page uses collection metadata

- **WHEN** a public listing page such as `/blog`, `/docs`, or `/videos` is shared
- **THEN** the page SHALL expose metadata describing that collection
- **AND** the page SHALL use the stable site fallback preview image unless a collection-specific image exists

### Requirement: Dynamic content detail metadata

The system SHALL derive share metadata from public content detail records.

#### Scenario: Blog post detail has metadata

- **WHEN** a published blog post detail page is shared
- **THEN** the page SHALL use the post title as the share title
- **AND** the page SHALL use the post image as the preview image
- **AND** the page SHALL use a short plain-text description from post content when no explicit description exists

#### Scenario: Docs detail has metadata

- **WHEN** a docs detail page is shared
- **THEN** the page SHALL use the doc title as the share title
- **AND** the page SHALL use the doc description when present
- **AND** the page SHALL use the stable site fallback preview image when no content-specific image exists

#### Scenario: Public video detail has metadata

- **WHEN** a public video detail page is shared
- **THEN** the page SHALL use the video title as the share title
- **AND** the page SHALL use the video thumbnail as the preview image when present
- **AND** the page SHALL use fallback description text when no video-specific description exists

#### Scenario: Missing or private content does not expose specific metadata

- **WHEN** requested content is missing or unavailable through public routes
- **THEN** the page SHALL NOT expose private or misleading content-specific share metadata

### Requirement: Metadata URL behavior

The system SHALL produce reliable absolute metadata URLs for public pages and preview images.

#### Scenario: Metadata includes canonical URL

- **WHEN** public page metadata is generated
- **THEN** the metadata SHALL include an absolute canonical URL for that page

#### Scenario: Preview image URL is absolute

- **WHEN** public page metadata includes a preview image
- **THEN** the preview image URL SHALL be absolute or resolvable by the framework as an absolute public asset URL
