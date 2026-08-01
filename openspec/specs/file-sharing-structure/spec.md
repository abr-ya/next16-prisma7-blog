## Purpose

Provide the minimal first-party file foundation for admin uploads, UploadThing file tracking, file usage visibility, and future file-sharing features.
## Requirements
### Requirement: First-party file asset structure

The system SHALL store first-party uploaded files as file assets with stable identity, storage provider metadata, owner information, purpose, visibility, lifecycle state, and timestamps.

#### Scenario: Uploaded file has provider identity

- **WHEN** the system stores an uploaded file controlled by the application
- **THEN** the file asset structure SHALL include enough provider metadata to identify the stored object for future deletion, replacement, or signed access

#### Scenario: Uploaded file has ownership and purpose

- **WHEN** the system stores an uploaded file controlled by the application
- **THEN** the file asset structure SHALL record the owning user when known
- **AND** it SHALL record the file purpose separately from the raw URL

#### Scenario: Uploaded file has visibility

- **WHEN** the system stores an uploaded file controlled by the application
- **THEN** the file asset structure SHALL represent whether the file is private, unlisted, or public

### Requirement: Dedicated general file upload route

The system SHALL provide a dedicated UploadThing route for general file uploads separate from image-specific upload routes.

#### Scenario: Admin uploads one general file

- **WHEN** an authenticated admin uploads a file through the general file route
- **THEN** the route SHALL accept one file for the upload attempt
- **AND** it SHALL apply an explicit per-file size limit
- **AND** it SHALL create a first-party file asset record after UploadThing reports a completed upload

#### Scenario: Upload requires authenticated user

- **WHEN** an unauthenticated request attempts to upload through the general file route
- **THEN** the upload SHALL be rejected before a file asset record is created

#### Scenario: File route remains separate from image uploader

- **WHEN** the system supports both image-specific uploads and general file uploads
- **THEN** the general file route SHALL NOT reuse the image uploader route slug

### Requirement: Per-user file quota boundary

The system SHALL enforce the first general-file quota at the application backend boundary using stored file asset sizes for the current user.

#### Scenario: User is within file quota

- **WHEN** an authenticated user starts a general file upload and their active stored file total is below the configured limit
- **THEN** the upload MAY proceed if the selected file also satisfies the route's per-file limit

#### Scenario: User exceeds file quota

- **WHEN** an authenticated user starts a general file upload and their active stored file total is already at or above the configured limit
- **THEN** the upload SHALL be rejected before a new file asset record is created

#### Scenario: Quota uses first-party active files

- **WHEN** the system calculates a user's general file quota usage
- **THEN** it SHALL use active first-party file asset sizes owned by that user
- **AND** it SHALL NOT count external URL references that the application does not control

### Requirement: Minimal admin files page

The system SHALL provide a minimal admin files dashboard for the first file foundation.

#### Scenario: Admin sees own file count

- **WHEN** an authenticated admin opens `/admin/files`
- **THEN** the page SHALL display the current user's stored file count

#### Scenario: Admin sees tracked uploaded files

- **WHEN** an authenticated admin opens `/admin/files`
- **THEN** the page SHALL display a simple list of first-party file assets recorded by the new general file route

#### Scenario: Admin sees UploadThing usage points

- **WHEN** an authenticated admin opens `/admin/files`
- **THEN** the page SHALL display the known UploadThing usage points in the current project
- **AND** it SHALL distinguish tracked general file assets from legacy image/upload URL surfaces that are not migrated in this slice

#### Scenario: Admin can upload from files page

- **WHEN** an authenticated admin opens `/admin/files`
- **THEN** the page SHALL provide a simple form or upload control for uploading one general file

#### Scenario: Rich file management is deferred

- **WHEN** the minimal admin files page is implemented
- **THEN** it SHALL NOT be required to provide search, filters, bulk actions, deletion, previews, role-aware controls, or global storage settings

### Requirement: External file references remain distinct

The system SHALL distinguish externally referenced URLs from first-party uploaded files controlled by the application.

#### Scenario: External media URL is not treated as deletable storage

- **WHEN** content references an external image, thumbnail, video URL, or download URL that was not uploaded through the application storage provider
- **THEN** the file-sharing structure SHALL NOT require provider file keys or deletion behavior for that reference

#### Scenario: Imported external media becomes first-party

- **WHEN** a future implementation intentionally imports an external media URL into application-controlled storage
- **THEN** the imported stored object SHALL be represented as a first-party file asset
- **AND** the original external source URL MAY be retained as provenance

### Requirement: Content file attachments

The system SHALL define how files attach to content such as blog posts, markdown docs, videos, archives, and standalone shared files.

#### Scenario: File is attached to content with a purpose

- **WHEN** a future implementation attaches a file asset to content
- **THEN** the attachment SHALL identify the related content and the attachment purpose

#### Scenario: Content can have primary media

- **WHEN** a future implementation needs one file to act as primary media for a content item
- **THEN** the attachment structure SHALL support marking that file as the primary attachment for that purpose

#### Scenario: Ordered attachments are supported

- **WHEN** a future implementation renders multiple files for one content item in a stable order
- **THEN** the attachment structure SHALL support explicit ordering

### Requirement: Public download boundaries

The system SHALL define public download behavior separately from upload storage behavior.

#### Scenario: Public file can be rendered directly

- **WHEN** a file is intentionally public and does not require app-level access checks, audit, or URL stability
- **THEN** a future implementation MAY render its public provider URL directly

#### Scenario: File policy requires an app-owned route

- **WHEN** a file requires access checks, download audit, signed access, or a stable application URL
- **THEN** a future implementation SHALL serve the download through an app-owned route

#### Scenario: Private file is not publicly exposed

- **WHEN** a file is private or admin-only
- **THEN** public pages SHALL NOT expose a direct download URL for that file

### Requirement: File lifecycle and cleanup

The system SHALL define lifecycle states that prevent accidental data loss when files are replaced, detached, or deleted.

#### Scenario: Replaced file is detached before provider deletion

- **WHEN** a future implementation replaces a first-party file attached to content
- **THEN** the old file SHALL become detached or pending deletion before any provider delete operation occurs

#### Scenario: Referenced file is protected from cleanup

- **WHEN** a first-party file is still referenced by content, rich text, or metadata
- **THEN** cleanup behavior SHALL NOT delete the provider object

#### Scenario: Deleted content preserves safe cleanup path

- **WHEN** content with attached first-party files is deleted
- **THEN** the file lifecycle SHALL define whether each file is deleted, detached, or preserved for reuse
