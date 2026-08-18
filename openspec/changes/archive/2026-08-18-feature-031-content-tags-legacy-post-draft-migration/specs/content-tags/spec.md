## ADDED Requirements

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
 
