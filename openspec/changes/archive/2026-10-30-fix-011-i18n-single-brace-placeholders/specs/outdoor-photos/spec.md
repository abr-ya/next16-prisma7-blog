# Spec Delta

## ADDED Requirements

### Requirement: The trip photo timezone dialog title names the photo

The system SHALL render the trip photo timezone dialog's title with the photo's title in place of the placeholder, in the interface language of the trip page.

#### Scenario: The dialog title names the photo

- **WHEN** an authorized reviewer opens the timezone dialog for a trip photo
- **THEN** the dialog title renders the photo's title in place of the placeholder
- **AND** it does not render the placeholder as literal text

#### Scenario: The named title is rendered as given

- **WHEN** the photo's title contains punctuation such as an apostrophe or an ampersand
- **THEN** the dialog title renders that title unchanged
- **AND** no character of the title is replaced by an escape sequence
