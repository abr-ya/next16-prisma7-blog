# Spec Delta

## ADDED Requirements

### Requirement: Eligible users can create trips from the public Trips listing

The system SHALL display an `Add Trip` control on the public `/trips` listing for every visitor. The control SHALL be enabled only for an authenticated user who is currently authorized by the existing trust and quota rules to create a trip, and SHALL otherwise remain disabled with localized, adjacent, user-actionable feedback that identifies whether sign-in, account verification/sufficient trust, or available verified-account trip capacity is required. Eligible users SHALL receive a creation dialog with title, slug, description, start date, end date, type, and Draft/Published status. The public dialog and administrator trip create/edit flow SHALL use the same field validation and accepted values while preserving their existing surface-specific authorization.

#### Scenario: Anonymous visitor views the Trips listing

- **WHEN** an anonymous visitor opens `/trips`
- **THEN** the page displays a disabled `Add Trip` control
- **AND** adjacent localized feedback explains that sign-in is required
- **AND** the visitor cannot open the creation dialog or create a trip

#### Scenario: Account without sufficient trust views the Trips listing

- **WHEN** a signed-in non-administrator user with `NEW` or `RESTRICTED` trust opens `/trips`
- **THEN** the page displays a disabled `Add Trip` control
- **AND** adjacent localized feedback explains that account verification or sufficient trust is required
- **AND** it does not expose a form that could bypass the server trust gate

#### Scenario: Verified account reaches the trip quota

- **WHEN** a signed-in `VERIFIED` user already owns the allowed number of live trips and opens `/trips`
- **THEN** the page displays a disabled `Add Trip` control
- **AND** adjacent localized feedback explains that the trip limit has been reached
- **AND** it does not expose another user's trip, quota, or trust information

#### Scenario: Eligible user creates a published trip

- **WHEN** a `TRUSTED` user, an under-quota `VERIFIED` user, or an administrator submits valid trip fields with Published status from `/trips`
- **THEN** the system creates a trip owned by that user through the existing server-authoritative creation flow
- **AND** the user is sent to the new public `/trips/[slug]` page
- **AND** existing slug, date-range, trust, quota, and ownership validation remains enforced on the server

#### Scenario: Eligible user creates a draft trip

- **WHEN** an eligible user submits valid trip fields with Draft status from `/trips`
- **THEN** the system creates a draft trip owned by that user through the existing server-authoritative creation flow
- **AND** the user is sent to the existing owner-scoped `/admin/trips` workspace to manage that draft
- **AND** the draft remains unavailable on public trip routes

#### Scenario: Creation authority changes after the listing loads

- **WHEN** a visitor submits the public creation form after their trust or quota state has changed
- **THEN** the server reevaluates the existing creation authority before writing the trip
- **AND** an ineligible submission creates no trip and receives safe actionable feedback

#### Scenario: Administrator continues using trip management

- **WHEN** an administrator creates or edits a trip from the authenticated workspace
- **THEN** the existing administrator form retains title, slug, description, date, type, and status behavior
- **AND** administrator-specific management controls and cross-user boundaries remain unchanged
