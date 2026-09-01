## MODIFIED Requirements

### Requirement: Photo publication status is stored without standalone public gallery exposure

The system SHALL store whether a photo is draft or published while keeping standalone public photo browsing out of the immediate outdoor roadmap.

#### Scenario: Admin marks photo as published

- **WHEN** an authenticated admin saves a photo with `PUBLISHED` status
- **THEN** the system stores the status for future public exposure
- **AND** the photo becomes eligible for future hike-linked public rendering only when associated with a published hike

#### Scenario: Visitor cannot browse photos through standalone photo routes

- **WHEN** a visitor uses existing public navigation or known outdoor routes
- **THEN** the system does not expose a standalone public `/photos` or `/photos/[slug]` experience from this slice
- **AND** public photo exposure is planned first through hike detail pages rather than a global photo gallery
