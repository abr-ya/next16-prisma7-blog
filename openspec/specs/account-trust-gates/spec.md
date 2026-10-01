# account-trust-gates Specification

## Purpose

Defines the server-authoritative participation boundary for account trust levels, including a consistent anti-flood rule for all supported comment-creation domains.

## Requirements

### Requirement: Trust gate authorizes selected public mutations

The system SHALL determine the acting user's current trust level and administrator role on the server before a supported mutation writes data. An ordinary user with `VERIFIED` or `TRUSTED` trust SHALL retain the currently available supported actions. An administrator SHALL retain ordinary and administrative capabilities regardless of trust level. An anonymous user SHALL continue to receive the existing authentication denial.

#### Scenario: Verified or trusted ordinary user performs a supported action

- **WHEN** a signed-in ordinary user with trust level `VERIFIED` or `TRUSTED` performs a supported like, comment creation, trip creation, or photo/track upload action
- **THEN** the trust gate permits the action to continue to its existing validation and authorization checks
- **AND** the existing visibility, ownership, file, and quota behavior remains in force

#### Scenario: Administrator performs a supported action

- **WHEN** a signed-in administrator performs a supported ordinary or administrator action while their trust level is `NEW` or `RESTRICTED`
- **THEN** the trust gate does not block the action based on trust level
- **AND** existing administrator authorization remains required where applicable

#### Scenario: Trust is checked at mutation time

- **WHEN** a client invokes a supported mutation with stale UI state or directly calls the server action
- **THEN** the system evaluates the actor's current persisted trust level and role on the server before writing data
- **AND** no client-side state can bypass the trust boundary

### Requirement: New and restricted accounts cannot perform gated actions

The system SHALL reject a non-administrator user with `NEW` or `RESTRICTED` trust before it creates or removes a photo like, creates, updates, or deletes a comment, creates a trip, or creates a photo or track through an upload workflow. The rejection SHALL not write or partially bind target data, and SHALL provide a safe message that participation requires account verification or sufficient trust without disclosing private target details.

#### Scenario: New account attempts a gated action

- **WHEN** a signed-in non-administrator user with trust level `NEW` attempts a supported like, comment mutation, trip creation, photo upload, or track upload
- **THEN** the system rejects the mutation before its target write
- **AND** no like, comment, trip, photo, track, file binding, or partial record is created or changed

#### Scenario: Restricted account attempts a gated action

- **WHEN** a signed-in non-administrator user with trust level `RESTRICTED` attempts a supported like, comment mutation, trip creation, photo upload, or track upload
- **THEN** the system rejects the mutation before its target write
- **AND** the response does not reveal private photo, trip, track, or relationship data

#### Scenario: New or restricted account reads public content

- **WHEN** a user with trust level `NEW` or `RESTRICTED` reads a public page, public content listing, public comment feed, or other existing public read surface
- **THEN** the trust gate does not block that read
- **AND** existing public visibility rules remain unchanged

### Requirement: Comment creation has a shared per-user anti-flood interval

The system SHALL permit at most one successful comment creation per user across all current and future supported comment target domains in any rolling 15-second interval. The interval SHALL be enforced on the server atomically with comment creation, after authentication, trust, and target-visibility checks pass. A rejected or failed creation SHALL not consume the interval.

#### Scenario: User creates comments on different target domains in quick succession

- **WHEN** an eligible user successfully creates a comment on a public video
- **AND** the same user attempts to create a comment on a published-trip photo less than 15 seconds later
- **THEN** the second creation is rejected as rate limited
- **AND** no second comment is created

#### Scenario: User creates a comment after the interval

- **WHEN** an eligible user successfully creates a comment
- **AND** the user submits another valid comment at least 15 seconds later
- **THEN** the system permits the later creation subject to its existing target checks

#### Scenario: Concurrent comment creations preserve the interval

- **WHEN** an eligible user submits concurrent valid comment-creation requests within the same 15-second interval
- **THEN** at most one request creates a comment
- **AND** every other request is rejected as rate limited

#### Scenario: Failed attempt does not consume the interval

- **WHEN** a comment-creation request fails validation, authorization, trust, or target-visibility checks
- **THEN** the system does not create a comment
- **AND** a later valid comment creation by that user is not rate limited solely because of the failed request

### Requirement: Comment anti-flood feedback is safe and consistent

The system SHALL return a distinguishable, user-actionable rate-limit result for a comment creation denied by the 15-second interval. It SHALL not disclose another user's activity, private target state, or internal rate-limit implementation details. Existing read, edit, and delete behavior for eligible users remains unchanged except for the trust gate.

#### Scenario: User receives a rate-limit response

- **WHEN** an eligible user attempts comment creation before their 15-second interval has elapsed
- **THEN** the system returns feedback that the user must wait before posting another comment
- **AND** the response does not disclose another account's activity or hidden target data

#### Scenario: Existing eligible comment management remains available

- **WHEN** a `VERIFIED`, `TRUSTED`, or administrator user edits or deletes their own currently eligible comment
- **THEN** the existing ownership and target-visibility rules decide the result
- **AND** the creation anti-flood interval does not block that edit or delete
