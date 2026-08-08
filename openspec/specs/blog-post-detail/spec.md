## Purpose

Define public blog post detail page metadata display and connected-link visibility behavior.

## Requirements

### Requirement: Public Post Detail Tags

Public blog post detail pages SHALL display a post's tags using shared content-tag assignments when present and legacy `Post.tags` otherwise.

#### Scenario: Visitor sees shared tags on a tagged post

- **WHEN** a visitor opens `/blog/{slug}` for a post with one or more content-tag assignments
- **THEN** the page SHALL render those shared tag display names on the post detail page
- **AND** the tag display SHALL NOT require that the post has already been bulk-migrated from legacy-only data

#### Scenario: Visitor sees legacy tags when assignments are absent

- **WHEN** a visitor opens `/blog/{slug}` for a post with no content-tag assignments and one or more `Post.tags` values
- **THEN** the page SHALL render those legacy tag values on the post detail page

#### Scenario: Visitor opens a post without tags

- **WHEN** a visitor opens `/blog/{slug}` for a post without content-tag assignments and without legacy tag values
- **THEN** the page SHALL omit the tag section
- **AND** the page SHALL preserve the rest of the post detail layout

### Requirement: Public Post Detail Connected Links

Public blog post detail pages SHALL only show connected-link UI when a post has connected links.

#### Scenario: Authenticated user opens a post with connected links

- **WHEN** an authenticated user opens `/blog/{slug}` for a post with connected links
- **THEN** the page SHALL show the connected links section
- **AND** each connected link SHALL keep the existing open-link and link-detail actions

#### Scenario: Anonymous visitor opens a post with connected links

- **WHEN** an anonymous visitor opens `/blog/{slug}` for a post with connected links
- **THEN** the page SHALL show the existing sign-in prompt for links
- **AND** the page SHALL NOT expose connected link actions to the anonymous visitor

#### Scenario: Visitor opens a post without connected links

- **WHEN** any visitor opens `/blog/{slug}` for a post without connected links
- **THEN** the page SHALL omit the connected links section
- **AND** the page SHALL omit the link sign-in prompt
