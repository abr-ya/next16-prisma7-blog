## MODIFIED Requirements

### Requirement: Admin Content Tag Inventory Page

The system SHALL provide an admin-only inventory and focused management view for all shared content tags, including tag-level actions and assignment-level actions for currently supported usage.

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

- **WHEN** an authenticated admin views a shared content tag in the inventory
- **THEN** the inventory SHALL provide tag-level rename, status, merge, and unused-delete controls for that tag
- **AND** the inventory SHALL provide selected-assignment removal and replacement controls for supported post assignments
- **AND** it SHALL NOT add bulk content editing beyond selected shared-tag assignment removal and replacement
- **AND** mutation controls already present in the existing needs-review workflow SHALL keep their existing scope

#### Scenario: Admin selects post assignments from inventory

- **WHEN** an authenticated admin views a shared content tag with linked post assignments in the inventory
- **THEN** the inventory SHALL allow the admin to select individual post assignments for that tag
- **AND** it SHALL provide a way to select all visible post assignments for that tag
- **AND** selection for one tag SHALL NOT select assignments for another tag

#### Scenario: Admin removes selected post assignments from inventory

- **WHEN** an authenticated admin confirms removal of selected post assignments for a shared content tag from the inventory
- **THEN** the system SHALL delete only the selected post/tag assignments
- **AND** it SHALL NOT delete the associated posts
- **AND** it SHALL NOT remove unrelated assignments of the same tag
- **AND** it SHALL NOT remove assignments from other tags
- **AND** the inventory SHALL reflect the updated assignment counts after the action completes

#### Scenario: Admin replaces selected post assignments from inventory

- **WHEN** an authenticated admin confirms replacement of selected post assignments for a shared content tag from the inventory
- **THEN** the selected posts SHALL receive the replacement shared tag assignment
- **AND** the original selected assignments SHALL be removed
- **AND** duplicate replacement assignments SHALL be deduplicated safely
- **AND** assignments outside the selected set SHALL remain unchanged
- **AND** the inventory SHALL reflect the updated tag usage after the action completes

#### Scenario: Inventory rejects assignment actions without a selection

- **WHEN** an authenticated admin starts a selected-assignment remove or replace action without selecting any post assignments for that tag
- **THEN** the action SHALL be unavailable or rejected
- **AND** the admin SHALL be told to select at least one post assignment

#### Scenario: Inventory rejects replacement without a target tag name

- **WHEN** an authenticated admin starts a selected-assignment replace action without a replacement tag name
- **THEN** the action SHALL be unavailable or rejected
- **AND** no assignments SHALL be changed

#### Scenario: Public tag behavior is unchanged

- **WHEN** inventory assignment actions are delivered
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

- **WHEN** an authenticated admin starts a merge, delete, selected-assignment removal, or selected-assignment replacement action from the tag inventory
- **THEN** the page SHALL show an app-styled confirmation dialog before the action runs
- **AND** canceling or closing the dialog SHALL leave tag data and assignments unchanged
