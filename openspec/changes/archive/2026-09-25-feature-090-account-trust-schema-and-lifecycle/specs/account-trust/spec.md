# Spec Delta

## Purpose

Defines the foundation for account-trust state: a typed level on every user, a persistent audit log of every change, the initial assignment on signup, and the server-side read helpers that gate slices will consume. Trust is orthogonal to the existing `role` / `banned` admin-plugin fields; this capability ships only the foundation and explicitly defers mutation gates, quotas, auto-promotion, and admin controls to later slices (`account-trust-gates`, `account-trust-quotas`, `account-trust-admin-users`).

## ADDED Requirements

### Requirement: Every user has an explicit trust level

The system SHALL persist a `trustLevel` column on every `User` row with the enum values `NEW`, `VERIFIED`, `TRUSTED`, or `RESTRICTED`. The column SHALL be non-nullable with a database default of `NEW`. Existing rows at rollout SHALL be set to `VERIFIED` iff the user has `emailVerified = true` OR an `Account` row with `providerId ∈ {google, github}`; all other existing rows SHALL remain at the `NEW` default.

#### Scenario: Backfill assigns VERIFIED to verified users

- **WHEN** the migration runs
- **THEN** every user with `emailVerified = true` or any OAuth account in `{google, github}` has `trustLevel = VERIFIED`
- **AND** every other existing user has `trustLevel = NEW`
- **AND** no `TrustChangeLog` rows are written for the backfill

#### Scenario: New user lands at a known level

- **WHEN** a fresh signup completes
- **THEN** the resulting `User` row has `trustLevel ∈ {NEW, VERIFIED}`
- **AND** the value is observable via `prisma.user.findUnique` or any equivalent read

### Requirement: Initial trust level is set on signup and audited

The system SHALL set the initial `User.trustLevel` during the better-auth signup flow. A signup that arrives with `emailVerified = true` (OAuth provider callback) SHALL be assigned `VERIFIED`; all other signups SHALL be assigned `NEW`. The system SHALL write exactly one `TrustChangeLog` row for the initial assignment with `actorUserId = null`, `fromLevel = NEW`, `toLevel` matching the assigned level, and `source = OAUTH_SIGNUP` (for OAuth) or `source = SYSTEM_INIT` (otherwise). Failure of the audit write SHALL NOT block signup.

#### Scenario: OAuth signup is VERIFIED and audited

- **WHEN** a user completes a Google or GitHub signup
- **THEN** `User.trustLevel = VERIFIED`
- **AND** exactly one `TrustChangeLog` row exists for that user with `source = OAUTH_SIGNUP`, `actorUserId = null`, `fromLevel = NEW`, `toLevel = VERIFIED`

#### Scenario: Email/password signup is NEW and audited

- **WHEN** a user completes an email/password signup
- **THEN** `User.trustLevel = NEW`
- **AND** exactly one `TrustChangeLog` row exists for that user with `source = SYSTEM_INIT`, `actorUserId = null`, `fromLevel = NEW`, `toLevel = NEW`

#### Scenario: Audit failure does not block signup

- **WHEN** the audit write fails for any reason
- **THEN** the user row still exists with the assigned `trustLevel`
- **AND** the signup response still succeeds

### Requirement: Every subsequent trust change writes an audit row

The system SHALL record every later change to `User.trustLevel` (via gate auto-promotion, admin manual change, admin revert, email verification, or auto-promotion) as a `TrustChangeLog` row with the corresponding `source` enum value, the actor user id when the change is admin-driven (`actorUserId` non-null), and `actorUserId = null` for system-driven changes.

#### Scenario: Admin changes a user's level

- **WHEN** an admin changes `User.trustLevel` from `VERIFIED` to `RESTRICTED`
- **THEN** a `TrustChangeLog` row exists with `source = ADMIN_MANUAL`, `actorUserId = admin.id`, `fromLevel = VERIFIED`, `toLevel = RESTRICTED`

#### Scenario: Auto-promotion records the change

- **WHEN** a user is automatically promoted from `VERIFIED` to `TRUSTED` after reaching the like threshold
- **THEN** a `TrustChangeLog` row exists with `source = AUTO_PROMOTION`, `actorUserId = null`, `fromLevel = VERIFIED`, `toLevel = TRUSTED`

### Requirement: Read helpers expose the trust level safely

The system SHALL export `AUTH_TRUST_LEVELS`, `parseUserTrustLevel`, `getEffectiveTrust`, and `getCurrentUserTrust` so gate slices can read the current trust state without re-implementing the lookup. `parseUserTrustLevel` and `getEffectiveTrust` SHALL be pure, tolerant of unknown / missing values (falling back to `NEW`), and SHALL NOT throw. `getCurrentUserTrust` SHALL be a server-only helper that returns `{ userId, trustLevel }` for the signed-in viewer and `null` for anonymous viewers.

#### Scenario: Caller reads trust from a partial user

- **WHEN** a caller passes `{ trustLevel: "VERIFIED" }` to `getEffectiveTrust`
- **THEN** the helper returns `"VERIFIED"` without throwing

#### Scenario: Caller reads trust from a row with a missing column

- **WHEN** a caller passes `{}` or `{ trustLevel: null }` to `getEffectiveTrust`
- **THEN** the helper returns `"NEW"` without throwing

#### Scenario: Anonymous viewer asks for trust

- **WHEN** an anonymous request invokes `getCurrentUserTrust`
- **THEN** the helper returns `null`
- **AND** it does not query the database

#### Scenario: Signed-in viewer asks for trust

- **WHEN** a signed-in viewer invokes `getCurrentUserTrust`
- **THEN** the helper returns `{ userId: viewer.id, trustLevel: <current level> }`
- **AND** `trustLevel` matches the value persisted on the `User` row

### Requirement: Foundation does not gate mutations

This capability SHALL NOT introduce mutation gates, quotas, or admin UI for trust. A `NEW` or `RESTRICTED` user MAY still like, comment, create trips, and upload photos/tracks during the foundation slice. Gates are added by `account-trust-gates`; quotas and auto-promotion by `account-trust-quotas`; admin controls by `account-trust-admin-users`.

#### Scenario: Foundation slice does not change mutation behavior

- **WHEN** any signed-in user performs a like, comment, trip create, photo upload, or track upload
- **THEN** the foundation capability does not alter the success or failure of that operation based on `trustLevel`