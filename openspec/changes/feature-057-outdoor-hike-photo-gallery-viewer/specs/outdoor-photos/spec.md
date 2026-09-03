## MODIFIED Requirements

### Requirement: Photo publication status is stored without standalone public gallery exposure

The system SHALL store whether a photo is draft or published while exposing published photos publicly only through accepted hike-linked surfaces until a standalone public photo gallery is explicitly added. Hike-linked guest image exposure SHALL be limited to true technical thumbnails, and full-size photo image access SHALL require an authenticated site user.

#### Scenario: Admin marks photo as published

- **WHEN** an authenticated admin saves a photo with `PUBLISHED` status
- **THEN** the system stores the status for future public exposure
- **AND** the photo becomes eligible for hike-linked public rendering only when associated with a published hike

#### Scenario: Published photo is associated with a published hike

- **WHEN** a published photo is associated with a published hike
- **THEN** the photo becomes eligible to appear on that hike's public detail page
- **AND** anonymous visitors may receive only thumbnail-sized image responses for that photo
- **AND** authenticated site users may access the large-photo viewing experience for that photo
- **AND** it does not create a standalone public photo detail route or global public photo listing

#### Scenario: Visitor cannot browse photos through standalone photo routes

- **WHEN** a visitor uses existing public navigation or known outdoor routes
- **THEN** the system does not expose a standalone public `/photos` or `/photos/[slug]` experience from this slice
- **AND** public photo exposure remains hike-linked rather than a global photo gallery

