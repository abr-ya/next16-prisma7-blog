# Spec Delta

## ADDED Requirements

### Requirement: The owner can rename the file of their own workout

The public track detail page SHALL offer the track owner a rename control next to the displayed file name when the track owns its GPX file. The control SHALL open a modal with a single field for the file's base name and a fixed `.gpx` suffix that is not editable.

#### Scenario: Owner sees the rename control

- **WHEN** the track owner opens the public page of a track that owns its GPX file
- **THEN** a rename control appears next to the displayed file name
- **AND** activating it opens a modal with the current base name and a fixed `.gpx` suffix

#### Scenario: The suffix is not editable

- **WHEN** the owner edits the name in the modal
- **THEN** the field holds the base name only
- **AND** the `.gpx` suffix is shown next to it and cannot be changed or dropped

### Requirement: Renaming a workout file changes only its stored name

Saving the rename SHALL store the new name on the track's file asset and SHALL leave the stored object, its provider key, and its URL unchanged, so the application's download URL for the file stays the same while the name it serves changes. The new name SHALL replace the old one for every viewer of the track.

#### Scenario: Owner renames the file

- **WHEN** the owner enters a new base name and saves
- **THEN** the page shows the new file name
- **AND** the file asset carries the new name
- **AND** the stored object, its provider key, and its URL are unchanged

#### Scenario: The new name is public

- **WHEN** the owner renames the file of a published track
- **THEN** every viewer of the track, including an anonymous one, sees the new name
- **AND** the previous name is no longer shown

#### Scenario: The download carries the new name

- **WHEN** the owner downloads the renamed file
- **THEN** the downloaded file carries the new name
- **AND** the download URL is the same one the file had before the rename

### Requirement: Only a workout that owns its file can be renamed

The rename control SHALL NOT be offered for a track whose geometry belongs to a route, nor for a viewer who does not own the track, and a direct save request for such a track SHALL be rejected without changing any file.

#### Scenario: A workout that borrows a route's file has no control

- **WHEN** the owner opens a track whose geometry belongs to a route
- **THEN** the page shows no rename control
- **AND** a direct save request for that track is rejected without changing any file

#### Scenario: A viewer who is not the owner has no control

- **WHEN** a visitor who does not own the track opens its public page
- **THEN** the page shows no rename control
- **AND** a direct save request for that track is rejected without changing any file

### Requirement: An unusable name is refused

The system SHALL refuse a save whose base name is empty or consists only of path separators or control characters, and SHALL leave the track, its file, and its download exactly as they were.

#### Scenario: An unusable name is refused

- **WHEN** the owner saves an empty name, or a name that consists only of path separators or control characters
- **THEN** the save is rejected with an explanatory message
- **AND** the file keeps its previous name

#### Scenario: A refused save leaves the track intact

- **WHEN** the save fails
- **THEN** the track, its file, and its download stay exactly as they were
- **AND** the owner sees an error instead of a success state
