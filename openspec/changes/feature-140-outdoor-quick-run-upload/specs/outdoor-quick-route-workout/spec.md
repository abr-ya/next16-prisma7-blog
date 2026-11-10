# Spec Delta

## MODIFIED Requirements

### Requirement: The quick walk dialog offers a route mode

The quick walk dialog SHALL offer a secondary **Create with route** action that switches the dialog to a route form in place. The action SHALL be disabled while a GPX file is uploaded or uploading. The route form SHALL offer a **Back to GPX upload** action and SHALL NOT open a second dialog. The route mode SHALL be offered for the walking activity type only, because the workout it creates is a walking workout.

#### Scenario: Owner opens the route mode

- **WHEN** the owner clicks **Create with route** in the quick walk dialog with no uploaded GPX
- **THEN** the dialog switches its content to the route form
- **AND** the GPX file, title, and upload controls are no longer shown

#### Scenario: Uploaded GPX disables the route action

- **WHEN** a GPX file is uploaded or uploading in the quick walk dialog
- **THEN** the **Create with route** action is disabled
- **AND** the owner can still save the GPX workout

#### Scenario: Owner returns to the GPX mode

- **WHEN** the owner clicks **Back to GPX upload** in the route form
- **THEN** the dialog switches back to the GPX file form
- **AND** no route is created

#### Scenario: The route mode stays inside one dialog

- **WHEN** the owner opens the route mode
- **THEN** no second modal is opened
- **AND** the dialog keeps its activity type and gear context

#### Scenario: Another activity type opens no route mode

- **WHEN** the owner opens the quick upload dialog for an activity type other than walking
- **THEN** the dialog offers no **Create with route** action
- **AND** the dialog offers no source hint about a route
- **AND** the dialog offers only the file mode
