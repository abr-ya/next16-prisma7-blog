## MODIFIED Requirements

### Requirement: Post Tag Adoption Scope Boundaries

Post content-tag adoption SHALL keep video tags and content-wide tag management out of scope, while remaining legacy-only `Post.tags` values SHALL be migratable through the dedicated legacy migration feature.

#### Scenario: Video tags remain on VideoTag storage

- **WHEN** post content-tag adoption is used
- **THEN** `VideoTag` and `VideosToVideoTags` behavior SHALL remain the active runtime path for videos
- **AND** public and admin video tag flows SHALL NOT be required to use `ContentTag`

#### Scenario: Remaining legacy-only posts use controlled migration

- **WHEN** posts still have non-empty `Post.tags` without content-tag assignments after adoption
- **THEN** those values SHALL remain dual-read display sources until migrated or the post is re-saved
- **AND** bulk transfer of those values SHALL be performed only through `feature-030-content-tags-legacy-post-migration` admin inventory, dry-run, and apply

#### Scenario: Content-wide tag management stays out of adoption and migration slices

- **WHEN** post adoption or legacy migration is implemented
- **THEN** the system SHALL NOT add admin rename, merge, delete, or usage-dashboard tools for shared tags beyond migration policy mapping
- **AND** that ongoing management work SHALL remain `feature-031-content-tags-admin-management`
