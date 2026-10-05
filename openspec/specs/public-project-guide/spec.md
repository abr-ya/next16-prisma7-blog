# Public Project Guide Specification

## Purpose

Defines concise, localized public guide pages that explain the project, orient visitors within its main content areas, and accurately communicate account participation levels.

## Requirements

### Requirement: Public project-guide overview is available

The system SHALL provide a public project-guide overview at `/about`. It SHALL explain the site's purpose in concise static copy and link visitors to the account-level guide and existing public content destinations. The overview SHALL be available to anonymous and signed-in visitors through the shared public shell.

#### Scenario: Anonymous visitor opens the overview

- **WHEN** an anonymous visitor opens `/about`
- **THEN** the page renders the project overview without requiring authentication
- **AND** it links to the account-level guide and existing public content destinations
- **AND** it renders the shared public navigation

#### Scenario: Signed-in visitor opens the overview

- **WHEN** a signed-in visitor opens `/about`
- **THEN** the page remains publicly readable
- **AND** the shared navigation preserves authenticated account access

### Requirement: Account-level guide describes enforced participation policy

The system SHALL provide a public account-level guide at `/about/account-levels` that describes `new`, `verified`, `trusted`, and `restricted` levels in the active locale. It SHALL distinguish account role from trust level, describe only currently enforced participation limits and transitions, and link visitors to sign-in or sign-up when appropriate. It SHALL not reveal administrator-only operational details, audit records, user-specific counts, or hidden moderation criteria.

#### Scenario: Visitor reads account-level explanations

- **WHEN** an anonymous or signed-in visitor opens `/about/account-levels`
- **THEN** the page explains all four account levels in the active locale
- **AND** it distinguishes trust level from administrator role
- **AND** its described permissions, limits, and promotion paths match the trust policy enforced by the application at release time

#### Scenario: Guide avoids privileged or user-specific information

- **WHEN** a visitor views the account-level guide
- **THEN** the page does not disclose trust audit entries, another user's trust state, administrator-only controls, or user-specific quota counts

### Requirement: Project-guide copy supports public locales

The system SHALL render all project-guide navigation and page copy in English or Russian according to the active supported public locale, with the existing default-locale fallback preserving a usable guide.

#### Scenario: Visitor switches guide locale

- **WHEN** a visitor changes the active public locale while viewing a project-guide page
- **THEN** the guide's static copy and guide-navigation labels render in the selected supported locale
- **AND** the visitor remains in the project-guide route context

#### Scenario: Guide receives an unsupported locale

- **WHEN** a project-guide page is requested without a supported active locale
- **THEN** the page uses the existing default public locale
- **AND** the guide remains readable and linked correctly
