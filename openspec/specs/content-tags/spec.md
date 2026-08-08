## Purpose

Define the project-wide tag domain structure and post runtime adoption of shared content tags while other content types follow later slices.

## Requirements

### Requirement: Shared Content Tag Architecture

The system SHALL define and use shared content tags as a project-wide domain for reusable content metadata across posts, videos, docs, files, and future content types, with posts as the first runtime adopter of shared tag records and typed assignments.

#### Scenario: System defines shared tag identity

- **WHEN** a content feature needs reusable tags
- **THEN** it SHALL use normalized tag identity based on a display name and stable slug
- **AND** duplicate whitespace or casing SHALL NOT create separate tag identities
- **AND** empty or slugless tag inputs SHALL NOT create tag records

#### Scenario: System keeps tag records separate from assignments

- **WHEN** content is assigned tags
- **THEN** the architecture SHALL distinguish reusable tag records from content-specific tag assignments
- **AND** assignments SHALL record which content item owns the relationship
- **AND** content without tags SHALL remain valid

#### Scenario: Posts use shared tag records at runtime

- **WHEN** an authenticated user creates or updates a post with tags after post adoption ships
- **THEN** the system SHALL store those tags as shared content tags and post-specific assignments
- **AND** other content types MAY continue using their existing tag storage until their own adoption slices

### Requirement: Content Type Boundaries

The system SHALL keep tag assignments compatible with each content type's ownership, visibility, and lifecycle rules.

#### Scenario: Admin manages tags through content forms

- **WHEN** an authenticated admin edits tagged content
- **THEN** the tag workflow SHALL preserve that content type's existing admin authorization rules
- **AND** assigning tags SHALL NOT grant access to content outside those rules

#### Scenario: Public tag display respects content visibility

- **WHEN** the system displays tags on a public surface
- **THEN** it SHALL only display tag assignments attached to content that is already public for that surface
- **AND** tag display SHALL NOT expose private, draft, hidden, detached, or otherwise restricted content

#### Scenario: Content deletion preserves data integrity

- **WHEN** tagged content is deleted
- **THEN** its tag assignments SHALL be removed or detached according to that content type's lifecycle rules
- **AND** reusable tag records SHALL NOT by themselves expose deleted content

### Requirement: Legacy Tag Compatibility

The system SHALL keep compatibility boundaries for existing tag implementations while posts adopt shared content tags.

#### Scenario: Existing video tags remain compatible

- **WHEN** shared content tags are used for posts
- **THEN** existing `VideoTag` and `VideosToVideoTags` behavior SHALL remain valid until a dedicated video migration slice changes it
- **AND** public video tag badges SHALL keep their current passive display behavior

#### Scenario: Existing post string tags remain readable during adoption

- **WHEN** posts adopt shared content tags
- **THEN** existing `Post.tags` string-array values SHALL remain readable as legacy data for posts without assignments
- **AND** new shared post/tag assignments SHALL NOT require immediate bulk transfer of old string tags on deploy
- **AND** the system SHALL preserve the ability to identify posts by their previous tag values until a later migration completes

#### Scenario: Post reads prefer shared tags then legacy strings

- **WHEN** post surfaces resolve tags for display or admin edit seeding
- **THEN** they SHALL prefer display names from content-tag assignments when present
- **AND** they SHALL fall back to `Post.tags` when the post has no content-tag assignments

#### Scenario: Legacy post tag migration is planned separately

- **WHEN** the architecture identifies legacy post string tags without shared assignments
- **THEN** the project SHALL plan their review and transfer as a separate controlled migration feature (`feature-030`)
- **AND** the migration feature SHALL allow old tag values to be inspected before they become canonical shared tags
- **AND** ambiguous, duplicate, unwanted, or renamed tags SHALL be eligible for manual merge, drop, or rename decisions during that process

#### Scenario: Shared admin tag management is planned separately

- **WHEN** shared tag records and content assignments exist
- **THEN** the project SHALL plan content-wide admin tag management as a separate feature (`feature-031`)
- **AND** that feature SHALL cover shared tag rename, merge, delete or detach boundaries, and usage visibility by content type
- **AND** it SHALL NOT be limited to video-only tags

### Requirement: Implementation Slice Boundaries

The system SHALL keep later shared-tag work outside the post-adoption slice after architecture acceptance.

#### Scenario: Architecture remains the contract for non-post content

- **WHEN** this post-adoption feature is implemented
- **THEN** videos, docs, and files SHALL NOT be required to migrate onto shared content tags in the same slice
- **AND** schema adoption for posts, legacy migration, public filtering, and admin management work SHALL remain separate follow-up slices where not already delivered

#### Scenario: Future tag features declare their content scope

- **WHEN** a later feature adds or changes tag behavior
- **THEN** its OpenSpec change SHALL identify the affected content type or shared helper layer
- **AND** it SHALL state whether the change affects admin forms, public display, public filtering, data migration, or tag management
