## Purpose

Define runtime post adoption of shared content tags: assignment storage, admin read/write through shared tags, dual-read display with legacy `Post.tags` fallback, and boundaries for later migration and admin management slices.

## Requirements

### Requirement: Shared Content Tag Records For Posts

The system SHALL store reusable post tags as shared `ContentTag` records identified by a normalized display name and a unique slug.

#### Scenario: Creating a post creates shared tags from form input

- **WHEN** an authenticated user creates a post with one or more non-empty tag inputs
- **THEN** the system SHALL upsert matching `ContentTag` records by slug
- **AND** the system SHALL create `PostsToContentTags` assignments for the new post to those tags
- **AND** empty or slugless tag inputs SHALL NOT create tag records or assignments

#### Scenario: Updating a post replaces its content-tag assignments

- **WHEN** an authenticated user updates a post's selected tags
- **THEN** the system SHALL set that post's content-tag assignments to exactly the normalized tag set from the form
- **AND** tags removed from the form SHALL no longer be assigned to that post
- **AND** reusable `ContentTag` records SHALL remain available for other content even when unassigned from this post

### Requirement: Dual-Write Legacy Post Tags On Edit

The system SHALL keep `Post.tags` populated with the normalized display names from the current content-tag set whenever a post is created or updated through the admin post form path.

#### Scenario: Save mirrors normalized names into Post.tags

- **WHEN** a post is created or updated with tags that resolve into shared content tags
- **THEN** `Post.tags` SHALL be written to the sorted list of those tag display names
- **AND** posts that are never saved after this feature ships MAY still have only legacy `Post.tags` values without assignments until a later migration

### Requirement: Dual-Read Display Tags For Posts

The system SHALL resolve display tags for posts by preferring shared content-tag assignments and falling back to legacy `Post.tags`.

#### Scenario: Public surfaces prefer shared assignments

- **WHEN** a public listing or detail surface renders tags for a post that has one or more content-tag assignments
- **THEN** it SHALL display the shared tag display names for those assignments
- **AND** it SHALL NOT require that legacy `Post.tags` already match those assignments

#### Scenario: Public surfaces fall back to legacy strings

- **WHEN** a public listing or detail surface renders tags for a post with no content-tag assignments
- **THEN** it SHALL display the existing `Post.tags` string values
- **AND** posts without either source SHALL omit tag badges

#### Scenario: Admin post edit loads preferred display tags

- **WHEN** an authenticated user opens the admin post edit form for a post
- **THEN** the form tag field SHALL seed from shared assignment display names when assignments exist
- **AND** otherwise it SHALL seed from legacy `Post.tags`

### Requirement: Post Tag Adoption Scope Boundaries

Post content-tag adoption SHALL limit routine post create/edit behavior to posts while allowing the dedicated legacy migration feature to import remaining legacy-only post tags into shared content-tag assignments.

#### Scenario: Video tags remain on VideoTag storage

- **WHEN** post content-tag adoption or legacy post-tag import is used
- **THEN** `VideoTag` and `VideosToVideoTags` behavior SHALL remain the active runtime path for videos
- **AND** public and admin video tag flows SHALL NOT be required to use `ContentTag`

#### Scenario: Legacy bulk migration stays out of this slice

- **WHEN** posts still have non-empty `Post.tags` values without content-tag assignments after post adoption
- **THEN** those values SHALL remain dual-read display sources until imported or the post is re-saved
- **AND** bulk transfer of those values SHALL be performed only through the dedicated admin legacy post-tag import workflow
- **AND** imported legacy values SHALL become shared assignments marked for review rather than immediately canonical tags

#### Scenario: Content-wide tag management stays out of this slice

- **WHEN** post adoption or legacy post-tag import is implemented
- **THEN** the system SHALL NOT add broad shared-tag rename, delete, or usage-dashboard tools beyond existing review-workflow cleanup controls
- **AND** broader shared-tag management SHALL remain a separate candidate
