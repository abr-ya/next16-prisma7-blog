## MODIFIED Requirements

### Requirement: Video comments participate in shared comment domain

The system SHALL adapt existing public video comments to the shared comment domain without changing current public video comment behavior.

#### Scenario: Video comments expose shared list items

- **WHEN** public video comments are queried for a public video detail page
- **THEN** the system SHALL be able to return or derive shared comment list items for those comments
- **AND** each item SHALL include the comment id, content, serialized creation timestamp, author display data, and video target metadata

#### Scenario: Shared adapter preserves current video behavior

- **WHEN** video comments are adapted to the shared comment list item contract
- **THEN** public video comment ordering, visibility filtering, creation behavior, count display, empty state, and safe link rendering SHALL remain unchanged
- **AND** the public video detail comment list SHALL NOT render target metadata because the target is already implied by the page
