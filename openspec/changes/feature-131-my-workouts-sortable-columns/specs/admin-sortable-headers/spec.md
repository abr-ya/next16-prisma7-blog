# Spec Delta

## ADDED Requirements

### Requirement: Workout columns sort by the value they display

Every meaningful data column in the owner's workout table SHALL be sortable: **Title**, **Started**, **Distance**, **Duration**, and **Type**. A derived column SHALL sort by the same underlying value its cell renders, not by the formatted label. Distance and duration SHALL sort numerically, and **Type** SHALL sort by the activity-type name shown in the current interface language. The short workout column set SHALL stay unchanged.

#### Scenario: Owner sorts workouts by distance

- **WHEN** an owner clicks the **Distance** header on `/my/workouts`
- **THEN** the rows sort by the numeric distance, so a longer distance is never ordered before a shorter one because of the rendered text
- **AND** workouts without a parsed distance stay after workouts with one, in both directions

#### Scenario: Owner sorts workouts by duration

- **WHEN** an owner clicks the **Duration** header on `/my/workouts`
- **THEN** the rows sort by the numeric duration in seconds
- **AND** workouts without a known duration stay after workouts with one, in both directions

#### Scenario: Owner sorts workouts by title

- **WHEN** an owner clicks the **Title** header on `/my/workouts`
- **THEN** the rows sort by the workout title
- **AND** the header cycles through ascending, descending, and cleared like every other sortable header

#### Scenario: Owner sorts workouts by type

- **WHEN** an owner clicks the **Type** header on `/my/workouts`
- **THEN** the rows sort by the activity-type name shown in the current interface language
- **AND** unclassified workouts are grouped together under the unclassified label

#### Scenario: Started remains the default sort

- **WHEN** an owner opens `/my/workouts` without touching a header
- **THEN** the rows are ordered most recently started first
- **AND** the **Started** header shows the down-arrow glyph

#### Scenario: The workout table keeps its short column set

- **WHEN** the owner opens `/my/workouts`
- **THEN** no column is added by making the existing ones sortable
- **AND** the table still shows no **Updated** column

### Requirement: Missing derived values have a defined sort position

A workout column whose value comes from parsed metadata SHALL place workouts without that value after workouts that have it, in both ascending and descending order. This SHALL apply at least to **Started**, **Distance**, and **Duration**.

#### Scenario: Missing values stay last when sorting descending

- **WHEN** the owner sorts a derived column descending
- **THEN** workouts with a value appear first, ordered from greatest to least
- **AND** workouts without a value appear after them

#### Scenario: Missing values stay last when sorting ascending

- **WHEN** the owner sorts the same derived column ascending
- **THEN** workouts with a value appear first, ordered from least to greatest
- **AND** workouts without a value still appear after them
