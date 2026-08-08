# GitHub Account Flow Specification

## Purpose

Define the public GitHub account creation and sign-in flow, including Better Auth entry points, callback behavior, provider configuration boundaries, ordinary role defaults, and safe account-linking limits.

## Requirements

### Requirement: GitHub auth entry points

The system SHALL provide clear GitHub authentication entry points on the public sign-in and sign-up pages.

#### Scenario: Sign-in page offers GitHub auth

- **WHEN** a visitor opens `/sign-in`
- **THEN** the page SHALL display a GitHub authentication action
- **AND** activating it SHALL start the Better Auth GitHub social sign-in flow

#### Scenario: Sign-up page offers GitHub auth

- **WHEN** a visitor opens `/sign-up`
- **THEN** the page SHALL display a GitHub authentication action
- **AND** activating it SHALL start the Better Auth GitHub social sign-in flow that may create an account when provider rules allow it

#### Scenario: GitHub auth action shows progress

- **WHEN** a visitor activates the GitHub authentication action
- **THEN** the UI SHALL show a pending state for that action until the redirect starts or an error is shown

### Requirement: GitHub callback destination

The system SHALL send successful GitHub authentication sessions to the authenticated creator workspace.

#### Scenario: Successful GitHub auth returns to admin workspace

- **WHEN** a visitor successfully completes GitHub authentication
- **THEN** the configured callback destination SHALL be `/admin`
- **AND** existing `/admin` session gating SHALL determine whether the user can view the workspace

#### Scenario: Existing signed-in visitors cannot open auth pages

- **WHEN** an already authenticated user visits `/sign-in` or `/sign-up`
- **THEN** the existing `requireNoAuth()` behavior SHALL redirect them away from the auth page

### Requirement: GitHub provider configuration boundary

The system SHALL keep GitHub OAuth configuration server-owned and handle unavailable configuration without exposing secrets.

#### Scenario: GitHub provider is configured from server environment

- **WHEN** the auth server configuration loads the GitHub provider
- **THEN** it SHALL use server-side GitHub OAuth client configuration
- **AND** it SHALL NOT expose the client secret to browser code

#### Scenario: GitHub auth initiation fails

- **WHEN** GitHub authentication cannot be started because provider configuration or provider response is unavailable
- **THEN** the UI SHALL show an actionable error state
- **AND** it SHALL NOT expose OAuth secrets or raw provider credentials

#### Scenario: Live credential validation is deferred

- **WHEN** this GitHub account-flow slice is implemented
- **THEN** the system SHALL NOT require creating real GitHub OAuth App credentials as part of this slice
- **AND** manual live provider callback verification SHALL be tracked by `feature-063-github-oauth-credentials-validation`

### Requirement: GitHub users keep ordinary role defaults

The system SHALL preserve the existing role model for users authenticated through GitHub.

#### Scenario: GitHub-created user receives ordinary role

- **WHEN** a new user account is created through GitHub authentication
- **THEN** the user SHALL receive the ordinary `user` role by default
- **AND** the system SHALL NOT promote the user to `admin` because the account came from GitHub

#### Scenario: GitHub sign-in does not bypass admin checks

- **WHEN** a GitHub-authenticated user accesses a sensitive admin-only page or action
- **THEN** existing persisted role checks SHALL still determine access
- **AND** GitHub provider identity SHALL NOT be treated as an authorization source

### Requirement: GitHub account-linking boundary

The system SHALL define safe behavior for GitHub accounts whose email or provider account identity overlaps with existing users.

#### Scenario: Existing GitHub account signs in

- **WHEN** a visitor authenticates with a GitHub account already linked to an existing user
- **THEN** the system SHALL sign in that existing user through Better Auth provider account matching

#### Scenario: Email conflict is not manually merged

- **WHEN** GitHub authentication encounters an existing account or email state that Better Auth cannot safely link automatically
- **THEN** the app SHALL NOT manually merge users by email in this slice
- **AND** the UI SHALL surface a recoverable sign-in failure or direct the user to another available sign-in path

#### Scenario: Full account management remains deferred

- **WHEN** GitHub authentication is implemented
- **THEN** the system SHALL NOT add account unlinking, manual provider linking, profile settings, or account merge controls in this slice
