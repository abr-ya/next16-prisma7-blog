## ADDED Requirements

### Requirement: Optional markdown doc preview image
The system SHALL allow markdown docs to store an optional preview image URL.

#### Scenario: Doc can be saved without preview image
- **WHEN** an admin creates or updates a markdown doc without a preview image
- **THEN** the doc SHALL save successfully
- **AND** the stored preview image value SHALL remain empty

#### Scenario: Doc can be saved with preview image
- **WHEN** an admin creates or updates a markdown doc with a valid uploaded preview image URL
- **THEN** the doc SHALL save successfully
- **AND** the preview image URL SHALL be stored with that doc

#### Scenario: Existing preview image can be cleared
- **WHEN** an admin clears the preview image from a markdown doc and saves
- **THEN** the stored preview image URL SHALL be removed from that doc

### Requirement: Markdown doc preview image admin control
The system SHALL provide admin controls for managing the optional markdown doc preview image.

#### Scenario: Admin edits preview image in doc form
- **WHEN** an admin opens the markdown doc create or edit form
- **THEN** the form SHALL include a control for uploading or replacing the optional preview image

#### Scenario: Existing preview image is visible in admin form
- **WHEN** an admin opens an existing markdown doc that has a preview image
- **THEN** the form SHALL show the current preview image before saving changes

#### Scenario: Preview image upload stays optional
- **WHEN** the preview image control has no image
- **THEN** the form SHALL NOT block saving an otherwise valid markdown doc
