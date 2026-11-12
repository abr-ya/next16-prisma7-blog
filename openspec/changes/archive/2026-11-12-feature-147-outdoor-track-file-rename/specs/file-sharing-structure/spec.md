# Spec Delta

## ADDED Requirements

### Requirement: A file asset carries its own display name

The system SHALL store a display name on every first-party file asset, kept separate from the identity of the stored object. The stored name SHALL be the name the application serves the file under, including the name a download is offered with. Renaming a file asset SHALL change the stored name only: the stored object, its provider key, and its URL SHALL stay unchanged, and an application-owned download URL built from the file asset's identity SHALL stay valid.

#### Scenario: The stored name is the download name

- **WHEN** a file asset is downloaded through the application-owned download route
- **THEN** the download is offered under the file asset's stored name
- **AND** the name is not taken from the provider object

#### Scenario: Renaming leaves the provider identity alone

- **WHEN** a file asset is renamed
- **THEN** only the stored name changes
- **AND** the stored object, its provider key, and its URL stay unchanged
- **AND** no provider operation is performed

#### Scenario: The download URL survives a rename

- **WHEN** a file asset is renamed after its download URL was built
- **THEN** that URL still resolves to the same file
- **AND** it offers the file under the new name

#### Scenario: The stored name is what the admin list shows

- **WHEN** an administrator lists file assets
- **THEN** the list shows the stored name
- **AND** the name is the one the owner chose, not the name the file was uploaded under
