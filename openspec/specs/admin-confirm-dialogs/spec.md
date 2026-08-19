## Purpose

Define reusable app-styled confirmation behavior for admin actions that require explicit user confirmation before running destructive or sensitive operations.

## Requirements

### Requirement: Reusable Admin Confirmation Dialog

The system SHALL provide a reusable app-styled confirmation dialog for admin client components.

#### Scenario: Caller customizes confirmation copy and actions

- **WHEN** an admin workflow renders a confirmation dialog
- **THEN** the caller SHALL be able to provide the title, description, confirm button label, cancel button label, and confirm action
- **AND** the dialog SHALL support a destructive confirm presentation for dangerous actions

#### Scenario: Cancel does not run the action

- **WHEN** an admin opens the confirmation dialog and chooses cancel or closes the dialog
- **THEN** the protected action SHALL NOT run
- **AND** the admin SHALL return to the original workflow without data changes

#### Scenario: Confirm runs the protected action once

- **WHEN** an admin confirms the dialog
- **THEN** the protected action SHALL run once
- **AND** the dialog SHALL prevent duplicate confirmation while the action is pending

### Requirement: Admin Browser Confirm Replacement

The system SHALL replace browser-native confirmation prompts in covered admin workflows with the reusable app-styled confirmation dialog.

#### Scenario: Destructive table actions use app dialog

- **WHEN** an admin deletes or marks an item for deletion from supported admin tables
- **THEN** the confirmation SHALL be shown with the reusable app-styled dialog instead of `window.confirm`
- **AND** the existing server action, toast result, and refresh behavior SHALL remain unchanged after confirmation

#### Scenario: Sensitive creation/import actions use app dialog

- **WHEN** an admin confirms creating new video tags or importing legacy post tags
- **THEN** the confirmation SHALL be shown with the reusable app-styled dialog instead of `window.confirm`
- **AND** the existing create/import behavior SHALL remain unchanged after confirmation
