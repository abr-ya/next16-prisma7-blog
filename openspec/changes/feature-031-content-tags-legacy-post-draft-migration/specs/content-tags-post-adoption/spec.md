## MODIFIED Requirements

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
