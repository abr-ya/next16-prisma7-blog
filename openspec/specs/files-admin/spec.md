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
