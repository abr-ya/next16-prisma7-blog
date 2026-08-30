## ADDED Requirements

### Requirement: Dedicated outdoor photo upload route

The system SHALL provide a dedicated authenticated UploadThing route for outdoor photo image uploads separate from general files, track GPX uploads, and legacy image upload routes.

#### Scenario: Admin uploads one to three valid outdoor photo images

- **WHEN** an authenticated admin uploads one to three valid image files through the dedicated outdoor photo route
- **THEN** the route SHALL accept the upload attempt when each file satisfies the route's image type and size limits
- **AND** it SHALL create first-party file asset records with an outdoor photo image purpose after UploadThing reports completed uploads

#### Scenario: Outdoor photo upload requires authenticated user

- **WHEN** an unauthenticated request attempts to upload through the dedicated outdoor photo route
- **THEN** the upload SHALL be rejected before a file asset record is created

#### Scenario: Invalid outdoor photo upload is rejected

- **WHEN** an authenticated admin uploads a non-image file or an image that exceeds the route limits through the dedicated outdoor photo route
- **THEN** the upload SHALL be rejected before an outdoor photo file asset record is created

#### Scenario: Outdoor photo upload respects user quota

- **WHEN** an authenticated admin starts an outdoor photo upload and the upload would exceed the user's active stored-file quota
- **THEN** the upload SHALL be rejected before new file asset records are created

#### Scenario: Outdoor photo route remains separate from other upload routes

- **WHEN** the system supports general files, track GPX uploads, legacy images, and outdoor photo uploads
- **THEN** the dedicated outdoor photo route SHALL NOT reuse the general file, track GPX, or legacy image uploader route slug
