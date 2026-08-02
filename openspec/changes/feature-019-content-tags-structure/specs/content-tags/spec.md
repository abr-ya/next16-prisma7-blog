## ADDED Requirements

### Requirement: Shared Content Tag Architecture

The system SHALL define shared content tags as a project-wide domain for reusable content metadata across posts, videos, docs, files, and future content types.

#### Scenario: System defines shared tag identity

- **WHEN** a future content feature needs reusable tags
- **THEN** it SHALL use normalized tag identity based on a display name and stable slug
- **AND** duplicate whitespace or casing SHALL NOT create separate tag identities
- **AND** empty or slugless tag inputs SHALL NOT create tag records

#### Scenario: System keeps tag records separate from assignments

- **WHEN** content is assigned tags
- **THEN** the architecture SHALL distinguish reusable tag records from content-specific tag assignments
- **AND** assignments SHALL record which content item owns the relationship
- **AND** content without tags SHALL remain valid

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

The system SHALL define compatibility boundaries for existing tag implementations before migrating them to shared content tags.

#### Scenario: Existing video tags remain compatible

- **WHEN** shared content tags are introduced
- **THEN** existing `VideoTag` and `VideosToVideoTags` behavior SHALL remain valid until a dedicated video migration slice changes it
- **AND** public video tag badges SHALL keep their current passive display behavior

#### Scenario: Existing post string tags remain readable

- **WHEN** post tags are normalized in a future implementation slice
- **THEN** existing `Post.tags` string-array values SHALL be treated as migration input
- **AND** existing post tag data SHALL remain readable until normalized records and assignments are verified
- **AND** the migration SHALL preserve the ability to identify posts by their previous tag values

#### Scenario: Post tag migration is planned separately

- **WHEN** the architecture identifies legacy post string tags
- **THEN** the project SHALL plan their automatic migration as a separate feature
- **AND** routine tag transfer SHALL NOT require manual editing of each post
- **AND** manual review SHALL be reserved for ambiguous normalized tag conflicts

### Requirement: Implementation Slice Boundaries

The system SHALL split shared tag adoption into small follow-up features after the architecture is accepted.

#### Scenario: Shared architecture is accepted before runtime changes

- **WHEN** this feature is implemented
- **THEN** it SHALL update OpenSpec planning artifacts without changing runtime route behavior
- **AND** schema, migration, helper extraction, public filtering, and admin management work SHALL remain separate follow-up slices

#### Scenario: Future tag features declare their content scope

- **WHEN** a later feature adds or changes tag behavior
- **THEN** its OpenSpec change SHALL identify the affected content type or shared helper layer
- **AND** it SHALL state whether the change affects admin forms, public display, public filtering, data migration, or tag management
