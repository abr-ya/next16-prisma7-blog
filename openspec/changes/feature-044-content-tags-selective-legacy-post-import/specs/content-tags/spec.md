## MODIFIED Requirements

### Requirement: Admin Legacy Post Tag Import

The system SHALL provide an admin-only import path that turns selected legacy post string tags into shared content-tag assignments without changing public visibility.

#### Scenario: Admin inspects legacy-only post tags

- **WHEN** an admin opens the content-tag admin migration surface
- **THEN** the system SHALL show legacy `Post.tags` values from posts that have no shared content-tag assignments
- **AND** the inventory SHALL include enough post usage context to understand which legacy values will be imported

#### Scenario: Admin inspects eligible legacy-only posts

- **WHEN** an admin opens the content-tag admin migration surface
- **THEN** the system SHALL show posts that have legacy `Post.tags` values and no shared content-tag assignments
- **AND** each eligible post row SHALL include enough post identity to choose whether that post should be migrated
- **AND** each eligible post row SHALL show the legacy values and planned normalized shared tags for that post
- **AND** invalid or skipped legacy values SHALL be visible before import

#### Scenario: Admin selects posts for legacy import

- **WHEN** an admin selects eligible posts for migration
- **THEN** the migration selection SHALL be based on post identity
- **AND** selecting a post SHALL plan all valid legacy tag values for that post together
- **AND** the workflow SHALL NOT support importing only some raw tag values for a selected post in this slice

#### Scenario: Admin dry-runs legacy post tag import

- **WHEN** an admin runs a dry-run for selected legacy posts
- **THEN** the system SHALL report how many selected posts, planned assignments, reusable tags, new tags, and skipped values are involved
- **AND** the dry-run SHALL NOT create content tags, post/tag assignments, or post updates
- **AND** posts outside the selected set SHALL NOT be included in the dry-run summary

#### Scenario: Admin imports legacy post tags for review

- **WHEN** an admin applies the legacy post-tag import for selected eligible posts
- **THEN** selected eligible posts SHALL receive shared content-tag assignments based on all valid normalized legacy `Post.tags` values on each selected post
- **AND** imported tag records SHALL be marked `NEEDS_REVIEW`
- **AND** public tag display SHALL remain unchanged except that imported posts may now resolve tags through shared assignments instead of legacy fallback
- **AND** posts outside the selected set SHALL NOT be imported

#### Scenario: Import rejects empty selected post set

- **WHEN** an admin runs dry-run or import without selecting any eligible posts
- **THEN** the system SHALL reject the action
- **AND** the admin SHALL be told to select at least one post

#### Scenario: Import remains idempotent

- **WHEN** the selected legacy post-tag import is applied more than once
- **THEN** posts that already have shared content-tag assignments SHALL NOT receive duplicate assignments
- **AND** reusable tag records SHALL remain unique by slug
- **AND** posts that are no longer eligible SHALL be skipped safely

#### Scenario: Imported tags enter existing review workflow

- **WHEN** legacy tags are imported as `NEEDS_REVIEW`
- **THEN** admins SHALL be able to approve, replace, remove, or merge those imported tags through the existing content-tag review workflow
- **AND** the import workflow SHALL NOT need separate canonicalization controls for those cleanup actions

#### Scenario: Existing broad legacy inventory remains available

- **WHEN** the selective import workflow is delivered
- **THEN** the existing raw-value legacy tag inventory summary SHALL remain available for migration planning context
- **AND** it SHALL NOT replace the selected-post import decision surface
