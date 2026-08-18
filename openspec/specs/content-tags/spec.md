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

#### Scenario: Tag review status does not change public behavior

- **WHEN** a shared content tag is marked as needing review
- **THEN** the tag SHALL remain assigned to its content
- **AND** public surfaces SHALL display and link the tag the same way they display reviewed shared tags
- **AND** admin surfaces SHALL make the review status visible for cleanup decisions

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
- **AND** the system SHALL preserve the ability to identify posts by their previous tag values until a controlled import completes or the post is re-saved

#### Scenario: Post reads prefer shared tags then legacy strings

- **WHEN** post surfaces resolve tags for display or admin edit seeding
- **THEN** they SHALL prefer display names from content-tag assignments when present
- **AND** they SHALL fall back to `Post.tags` when the post has no content-tag assignments

#### Scenario: Legacy post tag migration is planned separately

- **WHEN** the architecture identifies legacy post string tags without shared assignments
- **THEN** the project SHALL transfer them only through a controlled admin import workflow
- **AND** the migration SHALL create or mark imported legacy tag values as needing review instead of requiring them to become immediately canonical
- **AND** ambiguous, duplicate, unwanted, or renamed tags SHALL be eligible for manual approve, merge, drop, or replace decisions through the review workflow

#### Scenario: Shared admin tag management is planned separately

- **WHEN** shared tag records and content assignments exist
- **THEN** the project SHALL plan broader content-wide admin tag management as a separate candidate
- **AND** that candidate SHALL cover shared tag rename, merge, delete or detach boundaries, and usage visibility by content type beyond the review workflow
- **AND** it SHALL NOT be limited to video-only tags

### Requirement: Admin Legacy Post Tag Import

The system SHALL provide an admin-only import path that turns legacy post string tags into shared content-tag assignments without changing public visibility.

#### Scenario: Admin inspects legacy-only post tags

- **WHEN** an admin opens the content-tag admin migration surface
- **THEN** the system SHALL show legacy `Post.tags` values from posts that have no shared content-tag assignments
- **AND** the inventory SHALL include enough post usage context to understand which legacy values will be imported

#### Scenario: Admin dry-runs legacy post tag import

- **WHEN** an admin runs a dry-run for the legacy post-tag import
- **THEN** the system SHALL report how many eligible posts, planned assignments, reusable tags, new tags, and skipped values are involved
- **AND** the dry-run SHALL NOT create content tags, post/tag assignments, or post updates

#### Scenario: Admin imports legacy post tags for review

- **WHEN** an admin applies the legacy post-tag import
- **THEN** eligible posts SHALL receive shared content-tag assignments based on normalized legacy `Post.tags` values
- **AND** imported tag records SHALL be marked `NEEDS_REVIEW`
- **AND** public tag display SHALL remain unchanged except that imported posts may now resolve tags through shared assignments instead of legacy fallback

#### Scenario: Import remains idempotent

- **WHEN** the legacy post-tag import is applied more than once
- **THEN** posts that already have shared content-tag assignments SHALL NOT receive duplicate assignments
- **AND** reusable tag records SHALL remain unique by slug

#### Scenario: Imported tags enter existing review workflow

- **WHEN** legacy tags are imported as `NEEDS_REVIEW`
- **THEN** admins SHALL be able to approve, replace, remove, or merge those imported tags through the existing content-tag review workflow
- **AND** the import workflow SHALL NOT need separate canonicalization controls for those cleanup actions

### Requirement: Admin Content Tag Review Workflow

The system SHALL provide an admin-only workflow for reviewing shared content tags without treating review state as public visibility.

#### Scenario: Admin marks a tag as needing review

- **WHEN** an admin marks an existing shared content tag as needing review
- **THEN** the tag SHALL keep its existing assignments
- **AND** public tag display SHALL remain unchanged
- **AND** admin tag views SHALL show that the tag requires review

#### Scenario: Admin approves a reviewed tag candidate

- **WHEN** an admin approves a tag that needs review
- **THEN** the system SHALL mark the tag as reviewed or active
- **AND** the tag SHALL keep its existing assignments

#### Scenario: Admin reviews linked post usage

- **WHEN** an admin opens the review view for a tag that needs review
- **THEN** the system SHALL show linked post usage for shared post/tag assignments
- **AND** the view SHALL provide enough post identity to decide whether each assignment should remain, be removed, or be replaced

#### Scenario: Admin removes selected tag assignments

- **WHEN** an admin removes a needs-review tag from selected posts
- **THEN** the system SHALL delete only those selected post/tag assignments
- **AND** it SHALL NOT delete the posts
- **AND** it SHALL NOT hide unrelated assignments of the same tag

#### Scenario: Admin replaces selected tag assignments

- **WHEN** an admin replaces a needs-review tag with another tag for selected posts
- **THEN** the selected posts SHALL receive the replacement tag assignment
- **AND** the original selected assignments SHALL be removed
- **AND** duplicate replacement assignments SHALL be deduplicated safely

#### Scenario: Admin merges one tag into another

- **WHEN** an admin merges a source tag into a target tag
- **THEN** all source post assignments SHALL move to the target tag
- **AND** posts that already have the target tag SHALL NOT receive duplicate assignments
- **AND** the source tag SHALL no longer appear as an active cleanup item after the merge

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
