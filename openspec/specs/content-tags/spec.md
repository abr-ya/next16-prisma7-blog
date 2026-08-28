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

#### Scenario: Admin selects posts for legacy import planning

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

#### Scenario: Selected dry-run remains read-only

- **WHEN** an admin dry-runs the same selected legacy posts more than once
- **THEN** no content tags or post/tag assignments SHALL be created
- **AND** reusable tag records SHALL remain unchanged
- **AND** posts that are no longer eligible SHALL be skipped safely from the dry-run summary

#### Scenario: Imported tags enter existing review workflow

- **WHEN** legacy tags are imported as `NEEDS_REVIEW`
- **THEN** admins SHALL be able to approve, replace, remove, or merge those imported tags through the existing content-tag review workflow
- **AND** the import workflow SHALL NOT need separate canonicalization controls for those cleanup actions

#### Scenario: Existing broad legacy inventory remains available

- **WHEN** the selective import workflow is delivered
- **THEN** the existing raw-value legacy tag inventory summary SHALL remain available for migration planning context
- **AND** it SHALL NOT replace the selected-post import decision surface

#### Scenario: Broad all-post import is replaced by selected import

- **WHEN** the selected import workflow is delivered
- **THEN** the legacy migration panel SHALL provide selected-post import instead of an all-or-nothing import for every eligible post
- **AND** admins SHALL confirm selected import through the app-styled confirmation dialog before writes occur

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

### Requirement: Admin Content Tag Management Foundation

The system SHALL provide admin-only data and mutation behavior for managing shared content tag records across their current content-type usage without changing public visibility semantics.

#### Scenario: Admin management data includes all shared content tags

- **WHEN** an authenticated admin requests shared content tag management data
- **THEN** the system SHALL return shared content tags regardless of review status
- **AND** each returned tag SHALL include its display name, slug, review status, and total usage count
- **AND** the data SHALL distinguish reviewed tags from tags that need review

#### Scenario: Admin management data groups usage by content type

- **WHEN** an authenticated admin requests shared content tag management data
- **THEN** the system SHALL return usage grouped by supported content type
- **AND** post usage SHALL include enough post identity and status information to decide whether each assignment should remain, be removed, or be replaced
- **AND** unsupported or not-yet-adopted content types SHALL NOT be presented as migrated shared-tag usage

#### Scenario: Admin server action renames a shared content tag

- **WHEN** an authenticated admin submits a shared content tag rename
- **THEN** the system SHALL normalize the new name and slug using the shared tag identity rules
- **AND** the tag SHALL keep its existing assignments
- **AND** the rename SHALL be rejected when the normalized slug conflicts with another tag unless the admin uses the merge workflow

#### Scenario: Admin server action changes tag review status

- **WHEN** an authenticated admin marks a shared content tag active or needing review
- **THEN** the system SHALL update only the tag review status
- **AND** the tag SHALL keep its existing assignments
- **AND** public tag display SHALL remain unchanged

#### Scenario: Admin server action merges shared content tags

- **WHEN** an authenticated admin merges a source shared content tag into a target shared content tag
- **THEN** all supported assignments from the source tag SHALL move to the target tag
- **AND** duplicate target assignments SHALL be deduplicated safely
- **AND** the source tag SHALL no longer appear as a managed shared tag after the merge

#### Scenario: Admin server action removes selected assignments

- **WHEN** an authenticated admin removes selected assignments from a shared content tag
- **THEN** the system SHALL delete only those selected assignments
- **AND** it SHALL NOT delete the associated content items
- **AND** it SHALL NOT remove unrelated assignments of the same tag

#### Scenario: Admin server action deletes an unused shared content tag

- **WHEN** an authenticated admin deletes a shared content tag with no supported assignments
- **THEN** the system SHALL delete the unused tag record
- **AND** public content pages SHALL remain valid

#### Scenario: Admin server action rejects direct deletion of a used shared content tag

- **WHEN** an authenticated admin attempts to delete a shared content tag that still has supported assignments
- **THEN** the system SHALL reject direct deletion
- **AND** the response SHALL direct the admin to remove assignments or merge the tag first

### Requirement: Admin Content Tag Inventory Page

The system SHALL provide an admin-only inventory and focused tag-level management view for all shared content tags and their currently supported usage.

#### Scenario: Admin sees all shared tags in the inventory

- **WHEN** an authenticated admin opens the content tags admin page
- **THEN** the page SHALL show shared content tags regardless of review status
- **AND** each listed tag SHALL show its display name, slug, review status, and total supported usage count
- **AND** the page SHALL distinguish active tags from tags that need review

#### Scenario: Admin sees inventory summary counts

- **WHEN** an authenticated admin opens the content tags admin page
- **THEN** the page SHALL show summary counts for total shared tags, active tags, tags that need review, and current post assignments

#### Scenario: Admin inspects supported usage by content type

- **WHEN** an authenticated admin views a shared tag in the inventory
- **THEN** the page SHALL show grouped usage for supported shared-tag content types
- **AND** post usage SHALL include enough post identity and status context to identify the assigned post
- **AND** unsupported or not-yet-adopted content types SHALL NOT be shown as shared-tag usage

#### Scenario: Existing review workflow remains available

- **WHEN** an authenticated admin opens the content tags admin page
- **THEN** the existing needs-review cleanup workflow SHALL remain available for tags that need review
- **AND** the existing legacy post-tag migration workflow SHALL remain available

#### Scenario: Inventory slice does not add broad mutation controls

- **WHEN** the inventory page is delivered in this slice
- **THEN** it SHALL add only tag-level rename, status, merge, and unused-delete controls for all tags
- **AND** it SHALL NOT add selected-assignment removal or replacement controls for all tags
- **AND** any mutation controls already present in the existing needs-review workflow SHALL keep their existing scope

#### Scenario: Public tag behavior is unchanged

- **WHEN** the inventory page is delivered
- **THEN** public tag display and public tag links SHALL keep their existing visibility behavior
- **AND** tag review status SHALL NOT change public content visibility

#### Scenario: Admin renames a shared tag from inventory

- **WHEN** an authenticated admin submits a new name for a shared content tag from the inventory
- **THEN** the system SHALL rename that tag using the shared tag identity normalization rules
- **AND** the tag SHALL keep its existing assignments
- **AND** the admin SHALL receive an error when the normalized slug conflicts with another tag

#### Scenario: Admin changes tag review status from inventory

- **WHEN** an authenticated admin marks a shared content tag active or needing review from the inventory
- **THEN** the system SHALL update only the tag review status
- **AND** the tag SHALL keep its existing assignments
- **AND** the inventory SHALL reflect the updated status after the action completes

#### Scenario: Admin merges a shared tag from inventory

- **WHEN** an authenticated admin merges a source shared content tag into a target tag from the inventory
- **THEN** supported assignments from the source tag SHALL move to the target tag
- **AND** duplicate target assignments SHALL be deduplicated safely
- **AND** the source tag SHALL no longer appear in the inventory after the action completes

#### Scenario: Admin deletes an unused shared tag from inventory

- **WHEN** an authenticated admin deletes a shared content tag with no supported assignments from the inventory
- **THEN** the system SHALL delete the unused tag record
- **AND** the inventory SHALL no longer list that tag after the action completes

#### Scenario: Admin cannot directly delete a used shared tag from inventory

- **WHEN** an authenticated admin attempts to delete a shared content tag that still has supported assignments from the inventory
- **THEN** the system SHALL reject direct deletion
- **AND** the admin SHALL be told to remove assignments or merge the tag first

#### Scenario: Sensitive tag actions use app confirmation

- **WHEN** an authenticated admin starts a merge or delete action from the tag inventory
- **THEN** the page SHALL show an app-styled confirmation dialog before the action runs
- **AND** canceling or closing the dialog SHALL leave tag data unchanged

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
