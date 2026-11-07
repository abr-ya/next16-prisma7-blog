# Spec Delta

## ADDED Requirements

### Requirement: Owner can filter workouts by calendar month, year, or custom range

The owner's workout list SHALL offer, next to `All time` and the existing ISO week, a calendar **month**, a calendar **year**, and an inclusive **custom from/to range**. A period boundary SHALL be resolved through the workout's calendar date in its `recordingTimezone`, not the browser timezone. A workout without an effective start SHALL be excluded while any period other than `All time` is selected. The short workout column set and sorting SHALL remain unchanged, and the Week summary dialog SHALL remain week-only.

#### Scenario: Calendar month boundaries follow the recording timezone

- **WHEN** the owner selects March 2026 and a workout starts at 23:40 on 31 March in its `recordingTimezone`
- **THEN** the workout is included in March
- **AND** a workout recorded just after midnight on 1 April in that timezone is excluded

#### Scenario: Calendar year boundaries

- **WHEN** the owner selects 2025
- **THEN** every workout whose recording-timezone calendar date falls in 2025 is listed
- **AND** workouts from 2024 and 2026 are excluded

#### Scenario: Custom range is inclusive

- **WHEN** the owner enters `2026-03-01` as the start and `2026-03-31` as the end
- **THEN** workouts on both boundary dates are included
- **AND** workouts outside the range are excluded

#### Scenario: Custom range rejects a reversed interval

- **WHEN** the owner enters a start date after the end date
- **THEN** the range is not applied
- **AND** the control explains that the start must not be after the end

#### Scenario: Month and year navigation

- **WHEN** the owner uses the previous or next arrow while a month or year is selected
- **THEN** the period moves by exactly one calendar month or year
- **AND** the table updates to that period

#### Scenario: Period filter composes with sorting

- **WHEN** the owner sorts a column while a month, year, or custom range is selected
- **THEN** the rows stay limited to that period

#### Scenario: Week summary stays week-only

- **WHEN** the owner selects a month, year, or custom range
- **THEN** no Week summary button or daily charts are rendered
- **AND** the table shows the filtered workouts

#### Scenario: The filter is workout-only

- **WHEN** the owner views `/my/tracks` or `/admin/tracks`
- **THEN** no month, year, or custom period control is rendered

## MODIFIED Requirements

### Requirement: Week filtering controls the pagination scope

The workout list SHALL paginate `All time`, a selected month, a selected year, and a custom date range. A selected ISO week SHALL render in full without pagination. Switching between any two periods SHALL return the view to its first page without resetting the selected column sort.

#### Scenario: All time is paginated

- **WHEN** the owner views `/my/workouts` on `All time`
- **THEN** the list uses the existing page size and pagination controls
- **AND** the rows can be paged

#### Scenario: A selected week is not paginated

- **WHEN** the owner selects a week
- **THEN** every workout in that week is rendered
- **AND** no pagination controls are shown

#### Scenario: A selected month or year is paginated

- **WHEN** the owner selects a calendar month or year
- **THEN** the list uses the existing page size and pagination controls
- **AND** every workout in that period is reachable by paging

#### Scenario: A custom range is paginated

- **WHEN** the owner applies a custom from/to range
- **THEN** the list uses the existing page size and pagination controls
- **AND** every workout in the range is reachable by paging

#### Scenario: Returning to All time starts on the first page

- **WHEN** the owner leaves a selected week and returns to `All time`
- **THEN** the paginated list starts on its first page
- **AND** the column sort the owner chose is still applied

#### Scenario: Switching periods starts on the first page

- **WHEN** the owner moves from one month, year, or custom range to another
- **THEN** the paginated list starts on its first page
- **AND** the column sort the owner chose is still applied
