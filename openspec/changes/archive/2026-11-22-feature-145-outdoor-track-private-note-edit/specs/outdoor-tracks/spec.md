# Spec Delta

## ADDED Requirements

### Requirement: The owner edits the private note from the track page

On `/tracks/[slug]`, the owner SHALL be able to add, edit, and clear the track's private note without opening the full edit dialog. The note SHALL stay owner-only, SHALL be limited to 2000 characters, and an empty value SHALL clear it and hide the block. A viewer who does not own the track SHALL see neither the note nor the edit controls.

#### Scenario: The owner adds a note to a track without one

- **WHEN** the owner opens their published track that has no private note
- **THEN** the page offers an **Add private note** action
- **AND** saving a note shows it in the private-note block

#### Scenario: The owner edits an existing note

- **WHEN** the owner opens the edit action next to their note, changes the text, and saves
- **THEN** the stored note is updated
- **AND** the block shows the new text after the page refreshes

#### Scenario: The owner clears the note

- **WHEN** the owner opens the editor, empties the text, and saves
- **THEN** the stored note is cleared
- **AND** the private-note block disappears

#### Scenario: Overlong notes are refused

- **WHEN** the text is longer than 2000 characters
- **THEN** the system refuses the save with a validation message
- **AND** the stored note stays unchanged

#### Scenario: Only the owner sees the note and controls

- **WHEN** an anonymous visitor or another user opens the track page
- **THEN** the private note is not shown
- **AND** no add or edit control is shown

#### Scenario: A foreign track cannot be edited

- **WHEN** a direct note update reaches the server for a track the caller does not own
- **THEN** the system refuses it
- **AND** the stored note stays unchanged
