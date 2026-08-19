## ADDED Requirements

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
