# Spec Delta

## Purpose

Defines the resource limits and promotion path for verified accounts while preserving administrator authority, private likes, and the existing trust-gate boundary.

## ADDED Requirements

### Requirement: Verified accounts have bounded live-resource creation

The system SHALL allow a non-administrator `VERIFIED` user to own no more than 3 live trips, 30 live `Photo` records, and 10 live tracks. Each applicable creation mutation SHALL enforce the limit on the server before creating its record. A successful deletion of one of those records SHALL free one slot. `TRUSTED` users and administrators SHALL not be subject to these count limits; existing `NEW` and `RESTRICTED` mutation gates remain authoritative.

#### Scenario: Verified user reaches a trip limit

- **WHEN** a non-administrator `VERIFIED` user already owns 3 live trips and submits another trip creation
- **THEN** the system rejects the creation without writing a fourth trip
- **AND** the response does not bypass existing authorization or disclose another user's data

#### Scenario: Deletion frees a verified user's photo slot

- **WHEN** a non-administrator `VERIFIED` user deletes one of their live `Photo` records after reaching 30
- **THEN** that user can successfully create one subsequent authorized photo record
- **AND** they still cannot exceed 30 live photo records

#### Scenario: Trusted user is not limited by verified quotas

- **WHEN** a `TRUSTED` user submits an otherwise authorized trip, photo, or track creation after the verified limit for that resource would be reached
- **THEN** the quota does not reject the mutation
- **AND** all existing resource-specific authorization and validation rules still apply

### Requirement: Photo likes can automatically promote eligible owners

The system SHALL promote a user from `VERIFIED` to `TRUSTED` when the total persisted likes on that user's photos reaches the adjustable threshold of 10. The like write, qualifying count, trust update, and `AUTO_PROMOTION` audit record SHALL be atomic. A user already `TRUSTED` SHALL not be demoted after later unlikes; a `RESTRICTED` user SHALL never be promoted automatically. Existing qualifying likes SHALL be evaluated during rollout, and the same eligibility evaluation SHALL be available to any future flow that changes a user from `NEW` to `VERIFIED`.

#### Scenario: Tenth like promotes a verified photo owner

- **WHEN** a successful like makes a `VERIFIED` photo owner's total persisted photo likes equal 10
- **THEN** the owner becomes `TRUSTED` in the same durable operation
- **AND** exactly one `TrustChangeLog` row records `fromLevel = VERIFIED`, `toLevel = TRUSTED`, `source = AUTO_PROMOTION`, and no actor user

#### Scenario: Concurrent likes cannot miss or duplicate promotion

- **WHEN** concurrent eligible likes cross the promotion threshold for the same verified photo owner
- **THEN** the owner ends as `TRUSTED`
- **AND** the system records no more than one auto-promotion audit row for that threshold crossing

#### Scenario: Restricted owner does not auto-promote

- **WHEN** a `RESTRICTED` user's photos have 10 or more persisted likes
- **THEN** the user remains `RESTRICTED`
- **AND** no auto-promotion audit record is written

### Requirement: Administrators can make audited non-administrator trust changes

The system SHALL provide an administrator-only server-side mutation that sets a non-administrator account to `VERIFIED`, `TRUSTED`, or `RESTRICTED`. It SHALL reject attempts to change an administrator's trust level, persist the selected level, and write an `ADMIN_MANUAL` audit row identifying the administrator and the prior and new levels. This capability SHALL not require an administrator UI.

#### Scenario: Administrator restricts an ordinary account

- **WHEN** an administrator sets a non-administrator account from `VERIFIED` to `RESTRICTED`
- **THEN** the target's persisted trust level becomes `RESTRICTED`
- **AND** an audit row records the administrator, both levels, and `ADMIN_MANUAL`

#### Scenario: Administrator account is protected from manual change

- **WHEN** an administrator attempts to change another administrator's trust level through the mutation
- **THEN** the system rejects the request
- **AND** it does not change the target or write an audit row

### Requirement: Quota and promotion counts remain private and authoritative

The system SHALL calculate quotas and promotion eligibility from server-side persisted records. It SHALL not expose a user's aggregate photo-like count, trust status, or quota count on public trip or photo surfaces solely for this capability.

#### Scenario: Public visitor views a liked photo

- **WHEN** any visitor views a public trip photo after its owner reaches the promotion threshold
- **THEN** the page continues to omit public like totals, liker identities, and the owner's trust level
- **AND** the existing private viewer-liked state remains unchanged
