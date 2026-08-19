## ADDED Requirements

### Requirement: Admin Content Tag Management
The system SHALL provide an admin-only workflow for managing shared content tag records across their current content-type usage without changing public visibility semantics.

#### Scenario: Admin views all shared content tags
- **WHEN** an authenticated admin opens the content tag management surface
- **THEN** the system SHALL list shared content tags regardless of review status
- **AND** each listed tag SHALL show its display name, slug, review status, and total usage count
- **AND** the list SHALL distinguish reviewed tags from tags that need review

#### Scenario: Admin sees usage by content type
- **WHEN** an authenticated admin inspects a shared content tag
- **THEN** the system SHALL show usage grouped by supported content type
- **AND** post usage SHALL include enough post identity and status information to decide whether each assignment should remain, be removed, or be replaced
- **AND** unsupported or not-yet-adopted content types SHALL NOT be presented as migrated shared-tag usage

#### Scenario: Admin renames a shared content tag
- **WHEN** an authenticated admin renames a shared content tag
- **THEN** the system SHALL normalize the new name and slug using the shared tag identity rules
- **AND** the tag SHALL keep its existing assignments
- **AND** the rename SHALL be rejected when the normalized slug conflicts with another tag unless the admin uses the merge workflow

#### Scenario: Admin changes tag review status
- **WHEN** an authenticated admin marks a shared content tag active or needing review
- **THEN** the system SHALL update only the tag review status
- **AND** the tag SHALL keep its existing assignments
- **AND** public tag display SHALL remain unchanged

#### Scenario: Admin merges shared content tags
- **WHEN** an authenticated admin merges a source shared content tag into a target shared content tag
- **THEN** all supported assignments from the source tag SHALL move to the target tag
- **AND** duplicate target assignments SHALL be deduplicated safely
- **AND** the source tag SHALL no longer appear as a managed shared tag after the merge

#### Scenario: Admin removes selected assignments
- **WHEN** an authenticated admin removes selected assignments from a shared content tag
- **THEN** the system SHALL delete only those selected assignments
- **AND** it SHALL NOT delete the associated content items
- **AND** it SHALL NOT remove unrelated assignments of the same tag

#### Scenario: Admin deletes an unused shared content tag
- **WHEN** an authenticated admin deletes a shared content tag with no supported assignments
- **THEN** the system SHALL delete the unused tag record
- **AND** public content pages SHALL remain valid

#### Scenario: Admin cannot delete a used shared content tag directly
- **WHEN** an authenticated admin attempts to delete a shared content tag that still has supported assignments
- **THEN** the system SHALL reject direct deletion
- **AND** the response SHALL direct the admin to remove assignments or merge the tag first
