## MODIFIED Requirements

### Requirement: Legacy Tag Compatibility

The system SHALL keep compatibility boundaries for existing tag implementations while posts use shared content tags, including an admin-controlled path to migrate remaining legacy-only `Post.tags` values.

#### Scenario: Existing video tags remain compatible

- **WHEN** shared content tags are used for posts
- **THEN** existing `VideoTag` and `VideosToVideoTags` behavior SHALL remain valid until a dedicated video migration slice changes it
- **AND** public video tag badges SHALL keep their current passive display behavior

#### Scenario: Existing post string tags remain readable during adoption

- **WHEN** posts adopt shared content tags
- **THEN** existing `Post.tags` string-array values SHALL remain readable as legacy data for posts without assignments
- **AND** new shared post/tag assignments SHALL NOT require immediate bulk transfer of old string tags on deploy
- **AND** the system SHALL preserve the ability to identify posts by their previous tag values until a controlled migration completes or the post is re-saved

#### Scenario: Post reads prefer shared tags then legacy strings

- **WHEN** post surfaces resolve tags for display or admin edit seeding
- **THEN** they SHALL prefer display names from content-tag assignments when present
- **AND** they SHALL fall back to `Post.tags` when the post has no content-tag assignments

#### Scenario: Legacy-only post tags can be migrated under admin control

- **WHEN** an admin runs the legacy post-tag migration apply action
- **THEN** eligible posts with legacy-only `Post.tags` values SHALL receive planned shared content-tag assignments according to the migration policy
- **AND** the operator SHALL be able to inspect an inventory and dry-run results before apply
- **AND** unwanted or ambiguous tags SHALL be eligible for drop or rename decisions via the migration policy

#### Scenario: Shared admin tag management is planned separately

- **WHEN** shared tag records and content assignments exist
- **THEN** the project SHALL plan content-wide admin tag management as a separate feature (`feature-031`)
- **AND** that feature SHALL cover shared tag rename, merge, delete or detach boundaries, and usage visibility by content type
- **AND** it SHALL NOT be limited to video-only tags

### Requirement: Implementation Slice Boundaries

The system SHALL keep later shared-tag work outside completed post-adoption and legacy-migration slices.

#### Scenario: Architecture remains the contract for non-post content

- **WHEN** post adoption and legacy migration features are implemented
- **THEN** videos, docs, and files SHALL NOT be required to migrate onto shared content tags in those slices
- **AND** public filtering and content-wide admin management work SHALL remain separate follow-up slices where not already delivered

#### Scenario: Future tag features declare their content scope

- **WHEN** a later feature adds or changes tag behavior
- **THEN** its OpenSpec change SHALL identify the affected content type or shared helper layer
- **AND** it SHALL state whether the change affects admin forms, public display, public filtering, data migration, or tag management
