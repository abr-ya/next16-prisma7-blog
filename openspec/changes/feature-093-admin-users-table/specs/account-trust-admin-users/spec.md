# Spec Delta

## Purpose

Provide administrators a protected, read-only directory of accounts so they can locate and inspect basic account and trust information without granting account-management controls.

## ADDED Requirements

### Requirement: Administrator user directory access

The system SHALL provide a read-only administrator user directory at `/admin/users`. It SHALL be accessible only to administrators; anonymous visitors and ordinary users SHALL not receive the directory or its user data.

#### Scenario: Administrator opens the directory

- **WHEN** an authenticated administrator visits `/admin/users`
- **THEN** the system displays the user directory

#### Scenario: Non-administrator requests the directory

- **WHEN** an anonymous visitor or authenticated ordinary user requests `/admin/users`
- **THEN** the system denies access according to the existing administrator access policy
- **AND** it does not expose directory user records

### Requirement: Directory account fields are read-only

The directory SHALL display each listed user's name, email address, registration date, role, and current trust status. The directory SHALL not provide controls to mutate a user, change a role or trust status, view trust history, or show resource-count or photo-like statistics.

#### Scenario: Administrator views a user row

- **WHEN** an administrator views an account in the directory
- **THEN** the row shows the user's name, email, registration date, role, and current trust status
- **AND** no edit, trust-status-change, resource-statistics, or audit-history control is shown

### Requirement: Paginated email search

The directory SHALL support email search and pagination. A submitted email search SHALL limit the visible results to accounts whose email matches the search text, and pagination SHALL operate on the filtered result set. An empty result set SHALL be represented clearly.

#### Scenario: Administrator searches by email

- **WHEN** an administrator submits an email search that matches one or more accounts
- **THEN** the directory shows only matching accounts
- **AND** the pagination reflects the matching result set

#### Scenario: Administrator search has no matches

- **WHEN** an administrator submits an email search that matches no accounts
- **THEN** the directory shows a clear empty state
- **AND** it does not show rows for non-matching accounts

#### Scenario: Administrator changes directory page

- **WHEN** an administrator moves to another directory page
- **THEN** the directory displays the corresponding page of the current email-filtered result set
