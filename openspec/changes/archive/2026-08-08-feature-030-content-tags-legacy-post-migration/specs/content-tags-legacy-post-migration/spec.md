## ADDED Requirements

### Requirement: Legacy-Only Post Tag Inventory

The system SHALL provide an admin Tags page with a legacy post-tag migration section that inventories posts still relying solely on legacy `Post.tags` without content-tag assignments.

#### Scenario: Tags page hosts migration inventory

- **WHEN** an admin opens `/admin/tags`
- **THEN** the page SHALL include a legacy post-tag migration section
- **AND** that section SHALL identify posts with at least one non-empty legacy tag value and zero content-tag assignments
- **AND** it SHALL present aggregate counts of eligible posts and unique raw legacy values
- **AND** it SHALL show each unique raw value with occurrence count and the suggested normalized slug

#### Scenario: Tags page reserves shared-tag management for later

- **WHEN** an admin opens `/admin/tags` in this feature
- **THEN** the page SHALL show a placeholder for future shared-tag management
- **AND** that placeholder SHALL state that list, rename, merge, detach, and usage tools are not available yet
- **AND** the page SHALL NOT require full shared-tag management UI to use the migration section

#### Scenario: Non-admin cannot run inventory

- **WHEN** a non-admin authenticated user attempts to access the Tags page inventory or migration actions
- **THEN** the system SHALL deny the operation

### Requirement: Review Policies For Drop And Rename

The system SHALL allow an admin to supply an optional migration policy that drops unwanted legacy values and renames or merges values by normalized slug before apply.

#### Scenario: Dropped values are excluded from migration

- **WHEN** a dry-run or apply uses a policy that drops a legacy value or its slug
- **THEN** that value SHALL NOT create a content-tag assignment on migrated posts
- **AND** that value SHALL NOT remain in the dual-written `Post.tags` list for those migrated posts

#### Scenario: Rename map redirects a slug to a target tag

- **WHEN** a dry-run or apply uses a rename map from a source slug to a target name (and optional target slug)
- **THEN** migrated posts that had the source legacy value SHALL receive the target content tag instead
- **AND** empty or slugless inputs SHALL still be skipped

### Requirement: Dry-Run And Apply Migration

The system SHALL support a dry-run that previews migration results without writing content-tag data, and an apply that persists shared tags and assignments for eligible posts.

#### Scenario: Dry-run reports planned work without content writes

- **WHEN** an admin runs a dry-run with an optional policy
- **THEN** the system SHALL report planned posts to migrate, content tags to create or reuse, assignments to create, and dropped values
- **AND** the system SHALL NOT create or update `ContentTag` or `PostsToContentTags` rows during dry-run

#### Scenario: Apply migrates eligible posts idempotently

- **WHEN** an admin applies migration with an optional policy
- **THEN** for each eligible legacy-only post the system SHALL upsert the planned `ContentTag` records and create the planned assignments
- **AND** it SHALL dual-write that post's `Post.tags` to the sorted planned display names
- **AND** posts that already have content-tag assignments SHALL be skipped
- **AND** re-running apply SHALL only process remaining eligible posts

#### Scenario: Empty policy migrates all normalized legacy values

- **WHEN** an admin applies migration with an empty policy
- **THEN** each eligible post's non-empty, slugable legacy tags SHALL be normalized and migrated
- **AND** raw values that collapse to the same slug SHALL map to a single shared tag

### Requirement: Auditable Migration Summary

The system SHALL record an auditable summary when an admin runs a dry-run or apply.

#### Scenario: Log captures migration mode and counts

- **WHEN** a dry-run or apply completes
- **THEN** the system SHALL write an admin log entry describing the mode and key counts (posts processed, tags upserted or planned, assignments created or planned, drops, skips)
- **AND** the log entry SHALL NOT require storing full post bodies

### Requirement: Legacy Migration Scope Boundaries

Legacy post tag migration SHALL remain limited to one-time cleanup of post string tags.

#### Scenario: Video tags are not migrated

- **WHEN** this feature is implemented
- **THEN** `VideoTag` and `VideosToVideoTags` SHALL remain the video runtime path
- **AND** this feature SHALL NOT migrate video tags into `ContentTag`

#### Scenario: Ongoing tag management stays separate

- **WHEN** this feature is implemented
- **THEN** content-wide rename, merge, delete, and usage-dashboard tools SHALL remain `feature-031-content-tags-admin-management`
- **AND** the `Post.tags` column SHALL remain present after migration
