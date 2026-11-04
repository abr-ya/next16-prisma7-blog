# Spec Delta

## ADDED Requirements

### Requirement: Owner sees a summary of the selected ISO week

The owner's workout list SHALL show, next to the week filter and only while a single ISO week is selected, the number of workouts in that week and the total distance of the workouts that carry a parsed distance. The summary SHALL be a button that opens a dialog repeating the selected week, the count, and the total distance. Both values SHALL be derived from the full filtered week set, not from a single page, and the summary SHALL be hidden on `All time`.

#### Scenario: A selected week shows its summary

- **WHEN** an owner selects an ISO week on `/my/workouts`
- **THEN** a summary next to the week filter shows how many workouts the week contains
- **AND** it shows the summed distance of the workouts that carry a parsed distance

#### Scenario: All time has no summary

- **WHEN** the owner views `All time`
- **THEN** no week summary is rendered
- **AND** the existing list and pagination are unchanged

#### Scenario: Opening the week summary

- **WHEN** the owner activates the week summary
- **THEN** a dialog opens with the selected week label, the workout count, and the total distance
- **AND** the dialog is read-only

#### Scenario: Workouts without a parsed distance

- **WHEN** a selected week contains workouts without a parsed distance
- **THEN** every workout counts toward the workout count
- **AND** only workouts with a finite distance count toward the total
- **AND** the dialog states how many workouts were counted for distance

#### Scenario: A week with no distance at all

- **WHEN** no workout in the selected week has a parsed distance
- **THEN** the summary reports that no distance is recorded instead of `0 m`

#### Scenario: The summary covers the whole week

- **WHEN** the owner changes the sort or scrolls the list
- **THEN** the count and the total distance stay the same, because both describe every workout in the selected week
