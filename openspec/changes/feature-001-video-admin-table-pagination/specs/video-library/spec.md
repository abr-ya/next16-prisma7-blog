## ADDED Requirements

### Requirement: Admin video table pagination
The admin video table SHALL provide client-side pagination for loaded owned videos.

#### Scenario: Admin opens a paginated video table
- **WHEN** an authenticated admin opens `/admin/videos`
- **AND** the owned video list contains more rows than the default admin table page size
- **THEN** the system SHALL render only the current page of rows in the table body
- **AND** the system SHALL show pagination controls with current page state
- **AND** the system SHALL allow the admin to navigate to the next and previous pages

#### Scenario: Admin sorts a paginated video table
- **WHEN** an admin changes sorting in the paginated video table
- **THEN** the system SHALL sort the loaded owned video list client-side
- **AND** the paginated rows SHALL reflect the active sort order

#### Scenario: Admin uses row actions on a paginated row
- **WHEN** an admin activates an existing row action on any visible paginated row
- **THEN** the system SHALL keep the current open, copy-video-id, thumbnail fetch, edit, and delete behavior for that video
