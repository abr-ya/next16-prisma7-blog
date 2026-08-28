## ADDED Requirements

### Requirement: Dedicated GPX track upload route

The system SHALL provide a dedicated authenticated UploadThing route for GPX track uploads separate from the general file route and image upload routes.

#### Scenario: Admin uploads one valid GPX track file

- **WHEN** an authenticated admin uploads a valid GPX file through the dedicated track GPX route
- **THEN** the route SHALL accept one file for the upload attempt
- **AND** it SHALL apply an explicit per-file size limit
- **AND** it SHALL create a first-party file asset record with purpose `TRACK_GPX` after UploadThing reports a completed upload

#### Scenario: Track GPX upload requires authenticated user

- **WHEN** an unauthenticated request attempts to upload through the dedicated track GPX route
- **THEN** the upload SHALL be rejected before a file asset record is created

#### Scenario: Invalid GPX upload is rejected

- **WHEN** an authenticated admin uploads a file that fails GPX filename, MIME, or lightweight GPX content validation
- **THEN** the upload SHALL be rejected before a `TRACK_GPX` file asset record is created

#### Scenario: Track GPX upload respects user quota

- **WHEN** an authenticated admin starts a track GPX upload and the upload would exceed the user's active stored-file quota
- **THEN** the upload SHALL be rejected before a new file asset record is created

#### Scenario: Track GPX route remains separate from general file route

- **WHEN** the system supports both general file uploads and track GPX uploads
- **THEN** the dedicated track GPX route SHALL NOT reuse the general file uploader route slug
