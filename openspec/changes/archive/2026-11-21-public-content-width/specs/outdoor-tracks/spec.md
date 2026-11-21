# Spec Delta

## ADDED Requirements

### Requirement: Public track pages share a content width

The public `/tracks` list and `/tracks/[slug]` detail SHALL use one shared content width from the site width scale, and the detail SHALL NOT be pinned to the narrow reading width. Readable prose on the detail page — the description and the private note — SHALL stay inside the narrow reading width, while the map, file list, badges, and summaries SHALL use the shared width. Narrow viewports SHALL keep a single column without horizontal overflow.

#### Scenario: The detail page is wider than the reading width

- **WHEN** a viewer opens `/tracks/[slug]`
- **THEN** the page container uses the shared content width
- **AND** the map and file sections use that width

#### Scenario: Long prose stays readable

- **WHEN** a track has a long description or a private note
- **THEN** that text stays inside the narrow reading width
- **AND** it does not stretch across the whole content container

#### Scenario: The list and the detail agree

- **WHEN** a viewer compares `/tracks` and `/tracks/[slug]`
- **THEN** both use the same content width token
- **AND** the list grid reflows without horizontal overflow

#### Scenario: A narrow viewport keeps one column

- **WHEN** a viewer opens either page on a narrow viewport
- **THEN** the content stays in one column
- **AND** no horizontal scroll appears
