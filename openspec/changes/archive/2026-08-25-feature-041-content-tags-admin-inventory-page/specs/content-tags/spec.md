## ADDED Requirements

### Requirement: Admin Content Tag Inventory Page
The system SHALL provide an admin-only inventory view for all shared content tags and their currently supported usage without adding broad tag-management mutations in this slice.

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
- **THEN** it SHALL NOT add broad rename, merge, delete, replace, or selected-assignment mutation controls for all tags
- **AND** any mutation controls already present in the existing needs-review workflow SHALL keep their existing scope

#### Scenario: Public tag behavior is unchanged
- **WHEN** the inventory page is delivered
- **THEN** public tag display and public tag links SHALL keep their existing visibility behavior
- **AND** tag review status SHALL NOT change public content visibility
