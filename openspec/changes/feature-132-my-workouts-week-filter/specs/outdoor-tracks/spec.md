# Spec Delta

## ADDED Requirements

### Requirement: Owner can filter workouts by ISO week

The owner's workout list SHALL support narrowing to a single ISO 8601 week: Monday start, week 1 containing the first Thursday, and 52 or 53 weeks per ISO week-year. The list SHALL open on `All time`, SHALL show the selected week number with its date range, and SHALL keep the existing sorting and short column set.

#### Scenario: Page opens on all time

- **WHEN** an owner opens `/my/workouts`
- **THEN** every workout is listed
- **AND** the filter control reads `All time`
- **AND** the default `started desc` order is unchanged

#### Scenario: Owner selects an ISO week

- **WHEN** an owner selects week 45 of 2026
- **THEN** only workouts whose effective recording start falls in 2–8 November 2026 are listed
- **AND** the control reads `Week 45 · 2–8 Nov 2026`
- **AND** the week picker closes

#### Scenario: Owner moves to the previous or next week

- **WHEN** the owner uses the week arrows
- **THEN** the selection moves by exactly one ISO week
- **AND** crossing a year boundary follows the ISO week-year, including moving from the last week of a 53-week year to week 1 of the next

#### Scenario: Owner returns to this week

- **WHEN** the owner chooses **This week**
- **THEN** the selection becomes the current ISO week
- **AND** the list shows only workouts from that week

#### Scenario: Workouts without a recording start

- **WHEN** a week is selected
- **THEN** workouts without an effective recording start are not listed
- **AND** choosing `All time` lists them again

#### Scenario: Week filter composes with sorting

- **WHEN** the owner sorts a column while a week is selected
- **THEN** the rows stay limited to that week
- **AND** the chosen sort applies to that filtered set

#### Scenario: A 53-week ISO year is reachable

- **WHEN** the owner picks an ISO week-year that has 53 weeks
- **THEN** the week selector offers week 53 with its date range
- **AND** a 52-week year does not offer week 53

### Requirement: Week filtering controls the pagination scope

The workout list SHALL paginate `All time` and SHALL render a selected week in full without pagination. Switching between the two modes SHALL return a paginated view to its first page without resetting the selected column sort.

#### Scenario: All time is paginated

- **WHEN** the owner views `/my/workouts` on `All time`
- **THEN** the list uses the existing page size and pagination controls
- **AND** the rows can be paged

#### Scenario: A selected week is not paginated

- **WHEN** the owner selects a week
- **THEN** every workout in that week is rendered
- **AND** no pagination controls are shown

#### Scenario: Returning to All time starts on the first page

- **WHEN** the owner leaves a selected week and returns to `All time`
- **THEN** the paginated list starts on its first page
- **AND** the column sort the owner chose is still applied
