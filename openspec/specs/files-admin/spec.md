# files-admin Specification

## Purpose

Enhance the admin file management page with pagination, search, filters, and improved metadata display to help administrators navigate and manage tracked file assets.

## Requirements

### Requirement: File list pagination

The admin file list SHALL support client-side pagination.

#### Scenario: Files are paginated

- **WHEN** an administrator views `/admin/files`
- **THEN** the file list SHALL display files in pages of 10 rows per page
- **AND** pagination controls SHALL allow navigating between pages
- **AND** the current page number and total pages SHALL be visible

#### Scenario: Pagination state persists during filtering

- **WHEN** an administrator applies search or filters while on page 2 or later
- **THEN** the pagination SHALL reset to page 1 with filtered results
- **AND** pagination controls SHALL reflect the filtered result count

### Requirement: Filename search

The admin file list SHALL support client-side search by filename.

#### Scenario: Administrator searches by filename

- **WHEN** an administrator enters text in the search input
- **THEN** the file list SHALL filter to show only files whose names contain the search text (case-insensitive)
- **AND** the filtered count SHALL be displayed
- **AND** empty search input SHALL show all files

#### Scenario: Search combines with filters

- **WHEN** an administrator has active purpose/visibility/status filters and enters search text
- **THEN** the file list SHALL show only files matching both the search text AND all active filters

### Requirement: Purpose filter

The admin file list SHALL support filtering by file purpose.

#### Scenario: Administrator filters by purpose

- **WHEN** an administrator selects a purpose from the purpose filter dropdown
- **THEN** the file list SHALL show only files with the selected purpose
- **AND** selecting "All purposes" SHALL clear the purpose filter
- **AND** the filtered count SHALL be displayed

#### Scenario: Purpose filter combines with other filters

- **WHEN** an administrator has selected a purpose filter
- **THEN** visibility, status, and search filters SHALL continue to apply
- **AND** only files matching all active filters SHALL be displayed

### Requirement: Visibility filter

The admin file list SHALL support filtering by file visibility.

#### Scenario: Administrator filters by visibility

- **WHEN** an administrator selects a visibility level from the visibility filter dropdown
- **THEN** the file list SHALL show only files with the selected visibility
- **AND** selecting "All visibilities" SHALL clear the visibility filter
- **AND** the filtered count SHALL be displayed

#### Scenario: Visibility filter combines with other filters

- **WHEN** an administrator has selected a visibility filter
- **THEN** purpose, status, and search filters SHALL continue to apply
- **AND** only files matching all active filters SHALL be displayed

### Requirement: Status filter

The admin file list SHALL support filtering by file status.

#### Scenario: Administrator filters by status

- **WHEN** an administrator selects a status from the status filter dropdown
- **THEN** the file list SHALL show only files with the selected status
- **AND** selecting "All statuses" SHALL clear the status filter
- **AND** the filtered count SHALL be displayed
- **AND** the initial default filter SHALL be "ACTIVE" to show active files only

#### Scenario: Status filter combines with other filters

- **WHEN** an administrator has selected a status filter
- **THEN** purpose, visibility, and search filters SHALL continue to apply
- **AND** only files matching all active filters SHALL be displayed

### Requirement: Enhanced metadata display

The admin file list SHALL display comprehensive file metadata.

#### Scenario: File listing shows core metadata

- **WHEN** an administrator views the file list
- **THEN** each file row SHALL display: filename (as clickable download link), MIME type, file size, purpose badge, visibility badge, status badge, owner name, uploaded date
- **AND** filename SHALL link to `/files/{fileId}/download`
- **AND** file size SHALL be formatted in human-readable units (B, KB, MB, GB)

#### Scenario: Purpose is displayed as badge

- **WHEN** a file row is rendered
- **THEN** the purpose SHALL be displayed as a badge
- **AND** purpose values SHALL use readable labels (e.g., "Admin Upload", "Rich Text Image")

#### Scenario: Visibility is displayed as badge

- **WHEN** a file row is rendered
- **THEN** the visibility SHALL be displayed as a badge with appropriate variant
- **AND** PRIVATE visibility SHALL use secondary variant
- **AND** PUBLIC visibility SHALL use default variant
- **AND** UNLISTED visibility SHALL use outline variant

#### Scenario: Status is displayed as badge

- **WHEN** a file row is rendered
- **THEN** the status SHALL be displayed as a badge with appropriate variant
- **AND** ACTIVE status SHALL use default variant
- **AND** DETACHED and PENDING_DELETE statuses SHALL use secondary or outline variant

#### Scenario: Owner name is displayed

- **WHEN** a file row is rendered
- **THEN** the owner's display name SHALL be shown
- **AND** if owner data is unavailable, a fallback value SHALL be displayed

#### Scenario: Uploaded date is formatted consistently

- **WHEN** a file row is rendered
- **THEN** the uploaded date SHALL be formatted consistently with other admin tables (ru-RU locale, medium date + short time)

### Requirement: Sortable columns

The admin file list SHALL support sorting by filename and uploaded date.

#### Scenario: Administrator sorts by filename

- **WHEN** an administrator clicks the filename column header
- **THEN** the file list SHALL sort alphabetically by filename in ascending order
- **AND** clicking again SHALL reverse the sort to descending order
- **AND** the sort indicator SHALL be visible

#### Scenario: Administrator sorts by uploaded date

- **WHEN** an administrator clicks the uploaded date column header
- **THEN** the file list SHALL sort by uploaded date in ascending order
- **AND** clicking again SHALL reverse the sort to descending order
- **AND** the sort indicator SHALL be visible
- **AND** the default sort SHALL be uploaded date descending (newest first)

### Requirement: Existing page elements preserved

The admin files page SHALL preserve existing stats, upload form, and usage information.

#### Scenario: Stats cards remain visible

- **WHEN** an administrator views `/admin/files`
- **THEN** the "My Files", "Storage Used", and "Tracked Files" stat cards SHALL remain visible above the table
- **AND** their values SHALL reflect current user and system state

#### Scenario: Upload form remains functional

- **WHEN** an administrator views `/admin/files`
- **THEN** the upload form SHALL remain visible in its left-side card position
- **AND** uploading a file SHALL refresh the file list

#### Scenario: UploadThing usage points remain visible

- **WHEN** an administrator views `/admin/files`
- **THEN** the UploadThing usage points card SHALL remain visible
- **AND** it SHALL display tracked and legacy upload routes with their status

### Requirement: Admin file previews

The admin file manager SHALL allow administrators to preview common tracked file types from `/admin/files` without leaving the page.

#### Scenario: Preview action is available for previewable files

- **WHEN** an administrator views a tracked file whose MIME type is an image, PDF, or text-like type
- **THEN** the file row SHALL expose a preview action
- **AND** activating the action SHALL open an in-page preview dialog for that file

#### Scenario: Image file is previewed

- **WHEN** an administrator previews a tracked image file
- **THEN** the dialog SHALL render the image using the app-owned `/files/{fileId}/download` route
- **AND** the dialog SHALL preserve a download link for the same file

#### Scenario: PDF file is previewed

- **WHEN** an administrator previews a tracked PDF file
- **THEN** the dialog SHALL embed the PDF using the app-owned `/files/{fileId}/download` route
- **AND** the dialog SHALL preserve a download link for the same file

#### Scenario: Text file is previewed

- **WHEN** an administrator previews a tracked text-like file within the preview size limit
- **THEN** the dialog SHALL fetch the file content through the app-owned `/files/{fileId}/download` route
- **AND** it SHALL render the text in a readable, scrollable preview area

#### Scenario: Text file is too large to preview

- **WHEN** an administrator previews a tracked text-like file that exceeds the preview size limit
- **THEN** the dialog SHALL explain that inline preview is unavailable for the file size
- **AND** it SHALL preserve a download link for the same file

#### Scenario: Unsupported file remains downloadable

- **WHEN** an administrator views a tracked file whose MIME type is not previewable
- **THEN** the file row SHALL NOT offer an active inline preview
- **AND** the existing download link SHALL remain available

#### Scenario: Preview does not expose provider URLs

- **WHEN** an administrator previews any supported tracked file
- **THEN** the preview source SHALL use the app-owned `/files/{fileId}/download` route
- **AND** the UI SHALL NOT expose the raw storage provider URL as the preview source

### Requirement: Admin file deletion controls

The admin file manager SHALL allow administrators to mark active tracked file assets for deletion through a safe lifecycle transition.

#### Scenario: Active file exposes delete action

- **WHEN** an administrator views an active tracked file row on `/admin/files`
- **THEN** the row SHALL expose a delete action
- **AND** the action SHALL require confirmation before submitting the deletion mutation

#### Scenario: Delete action marks file pending delete

- **WHEN** an administrator confirms deletion for an active tracked file
- **THEN** the system SHALL update that `FileAsset.status` to `PENDING_DELETE`
- **AND** it SHALL set `FileAsset.deletedAt` to the deletion time
- **AND** it SHALL keep the `FileAsset` database record for audit and future cleanup

#### Scenario: Delete action refreshes admin file state

- **WHEN** a tracked file is marked pending delete from `/admin/files`
- **THEN** the admin file manager SHALL refresh its file list and stats
- **AND** the default active-file view SHALL no longer include that file
- **AND** status filters SHALL still allow the administrator to view the pending-delete record

#### Scenario: Non-active files cannot be deleted again

- **WHEN** an administrator views a file whose status is `DETACHED`, `PENDING_DELETE`, or `DELETED`
- **THEN** the file row SHALL NOT expose an enabled delete action
- **AND** submitting a deletion mutation for that file SHALL NOT transition it again

#### Scenario: Deletion is admin authorized server-side

- **WHEN** a file deletion mutation is submitted
- **THEN** the server SHALL verify the current user has the persisted admin role before changing `FileAsset` lifecycle fields
- **AND** unauthenticated or non-admin users SHALL NOT be able to mark files pending delete

### Requirement: File deletion cleanup boundary

The admin file deletion workflow SHALL preserve provider storage until a future cleanup implementation explicitly removes provider objects.

#### Scenario: Provider object is not deleted

- **WHEN** an administrator marks a tracked file pending delete
- **THEN** the system SHALL NOT call the UploadThing provider delete API in this slice
- **AND** it SHALL preserve the stored provider metadata needed for future cleanup

#### Scenario: Legacy URL-only uploads are excluded

- **WHEN** the admin file deletion workflow is available
- **THEN** it SHALL apply only to tracked `FileAsset` records
- **AND** it SHALL NOT provide deletion controls for legacy URL-only image uploads that are not represented by `FileAsset`

#### Scenario: Non-active files remain unavailable through active download path

- **WHEN** a tracked file is marked `PENDING_DELETE`
- **THEN** the existing app-owned download route SHALL NOT serve it as an active downloadable file
- **AND** preview actions SHALL NOT be enabled for that non-active file
