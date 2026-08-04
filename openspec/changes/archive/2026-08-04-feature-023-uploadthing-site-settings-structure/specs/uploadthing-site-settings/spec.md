# uploadthing-site-settings Specification

## Purpose

Define the admin-only site-wide file and UploadThing settings surface, visible parameter categories, access boundaries, and future management controls before executable settings UI is implemented.

## Requirements
### Requirement: Admin-only settings surface

The system SHALL define site-wide file settings as sensitive administrator-only functionality.

#### Scenario: Settings route is role gated

- **WHEN** a future settings page, route handler, or server action is implemented
- **THEN** it SHALL require the persisted `admin` role through server-side authorization
- **AND** it SHALL NOT rely only on the authenticated `/admin` layout boundary

#### Scenario: Ordinary creator users are excluded

- **WHEN** an authenticated user without the `admin` role attempts to access site-wide file settings
- **THEN** the system SHALL deny access before exposing configuration values, usage statistics, or management controls

#### Scenario: Public surface is absent

- **WHEN** site-wide file settings functionality is implemented
- **THEN** public routes SHALL NOT expose settings values, upload limits, storage usage, or provider configuration

#### Scenario: Settings are distinct from per-user file browsing

- **WHEN** site-wide file settings are implemented
- **THEN** they SHALL NOT be mixed with per-user file browsing or upload controls on the existing `/admin/files` page
- **AND** they MAY live under `/admin/settings` or `/admin/settings/files` with a dedicated admin-gated route

### Requirement: App configuration visibility

The system SHALL display read-only app configuration values for file uploads and storage.

#### Scenario: Upload limits are visible

- **WHEN** an administrator views site-wide file settings
- **THEN** the settings SHALL display the current per-file upload size limit
- **AND** it SHALL display the current per-user storage quota limit
- **AND** it SHALL clearly label these values as read-only in the first implementation

#### Scenario: File URL base is visible

- **WHEN** an administrator views site-wide file settings
- **THEN** the settings SHALL display or derive the canonical file URL base from UploadThing configuration

#### Scenario: Allowed file types are visible

- **WHEN** an administrator views site-wide file settings
- **THEN** the settings MAY display allowed file types or extensions for the general file upload route

#### Scenario: Configuration remains server-only by default

- **WHEN** site-wide file settings display configuration values
- **THEN** sensitive values such as UploadThing secret keys, webhook URLs, or internal routing details SHALL NOT be exposed

### Requirement: App-computed usage visibility

The system SHALL display app-computed storage usage calculated from stored file assets.

#### Scenario: Total file count is visible

- **WHEN** an administrator views site-wide file settings
- **THEN** the settings SHALL display the total count of active `FileAsset` records across all users

#### Scenario: Total storage used is visible

- **WHEN** an administrator views site-wide file settings
- **THEN** the settings SHALL display the total storage used by active `FileAsset` records
- **AND** it SHALL compute this as the sum of `sizeBytes` where `status = ACTIVE`

#### Scenario: Storage is broken down by purpose

- **WHEN** an administrator views site-wide file settings
- **THEN** the settings SHALL display storage usage and file count grouped by `FileAsset.purpose`
- **AND** each purpose category SHALL be distinguishable (e.g., `ADMIN_UPLOAD`, future `POST_ATTACHMENT`, `DOC_PREVIEW`)

#### Scenario: Top users by usage are optional

- **WHEN** an administrator views site-wide file settings
- **THEN** the settings MAY display top users by file count or storage usage
- **AND** this aggregation is optional in the first implementation

### Requirement: Upload route visibility

The system SHALL distinguish tracked file upload routes from legacy untracked routes.

#### Scenario: Tracked routes are labeled

- **WHEN** an administrator views site-wide file settings
- **THEN** the settings SHALL display known UploadThing routes in the app
- **AND** it SHALL label routes that create `FileAsset` records as tracked

#### Scenario: Legacy routes are labeled

- **WHEN** an administrator views site-wide file settings and legacy upload routes exist
- **THEN** the settings SHALL label routes that do not create `FileAsset` records as legacy or untracked
- **AND** it SHALL distinguish tracked routes from legacy routes visually or textually

#### Scenario: Image uploader route visibility

- **WHEN** an administrator views site-wide file settings
- **THEN** the settings SHALL display both the tracked `fileUploader` route and the legacy `imageUploader` route
- **AND** it SHALL clearly indicate that `imageUploader` files do not count toward user quotas or appear in the admin file manager

### Requirement: Provider metadata boundaries

The system SHALL defer UploadThing provider-sourced metadata to a future implementation slice.

#### Scenario: Provider API integration is deferred

- **WHEN** the first settings implementation is built
- **THEN** it SHALL NOT call UploadThing API for provider-sourced metadata such as account limits, account usage, or plan tier

#### Scenario: Provider metadata is additive

- **WHEN** a future implementation adds UploadThing API integration
- **THEN** provider-sourced metadata SHALL be displayed alongside app-computed values
- **AND** it SHALL be clearly labeled to distinguish provider data from app data

### Requirement: Editable controls boundaries

The system SHALL defer editable settings controls to a future implementation slice.

#### Scenario: First implementation is read-only

- **WHEN** the first settings page is implemented
- **THEN** all displayed values SHALL be read-only
- **AND** administrators SHALL NOT be able to edit per-file limits, per-user quotas, or allowed file types from the settings UI

#### Scenario: Editable controls require separate design

- **WHEN** a future feature proposes editable settings controls
- **THEN** it SHALL require a design for configuration persistence, validation, safe reload, and audit
- **AND** it SHALL address whether editable config is stored in environment variables, a database table, or a config file

#### Scenario: Configuration persistence is deferred

- **WHEN** this settings structure feature is implemented or archived
- **THEN** the system SHALL NOT add database-backed configuration tables, config file writes, or environment variable updates

### Requirement: Settings are distinct from per-file management

The system SHALL keep site-wide settings separate from per-file management controls.

#### Scenario: File-specific controls are excluded

- **WHEN** site-wide file settings are displayed
- **THEN** they SHALL NOT include per-file actions such as preview, download, deletion, or metadata editing

#### Scenario: File manager integration is deferred

- **WHEN** site-wide settings display storage breakdown by purpose
- **THEN** drill-down navigation to purpose-filtered file views is deferred to `feature-070-admin-file-category-drill-down`

### Requirement: Implementation follow-up boundaries

The system SHALL split site-wide file settings work into small implementation slices after the structure is accepted.

#### Scenario: First slice creates read-only display

- **WHEN** a follow-up settings implementation starts
- **THEN** it MAY focus on displaying read-only app configuration and app-computed usage before adding editable controls or provider API integration

#### Scenario: Provider integration is separate

- **WHEN** UploadThing API integration is added
- **THEN** it SHALL be handled as an explicit follow-up slice with error handling, rate limiting, and data freshness considerations

#### Scenario: Editable controls are separate

- **WHEN** editable settings controls are added
- **THEN** they SHALL be handled as a separate implementation with configuration persistence, validation, and audit
