# Spec Delta

## ADDED Requirements

### Requirement: A table can declare its initial sort

The shared data table SHALL accept an optional initial sorting state and apply it on the first render. When a table declares an initial sort, the header of the sorted column SHALL show that column's direction immediately, without a click or a reload. A table that declares no initial sort SHALL keep the current unsorted behaviour.

#### Scenario: Fresh load shows the declared sort

- **WHEN** a table declares `updatedAt` descending and renders for the first time
- **THEN** the **Updated** header shows the down-arrow glyph
- **AND** no other sortable header shows an active direction

#### Scenario: Table without a declared sort stays unsorted

- **WHEN** a table declares no initial sort
- **THEN** every sortable header shows the neutral glyph on first render
- **AND** the rows keep the order supplied by the page

#### Scenario: Declared sort matches the supplied order

- **WHEN** a table declares an initial sort and the page supplies rows in that same order
- **THEN** the first render neither reorders the rows nor shows a different direction

### Requirement: Track tables declare recently updated order

The owner-facing track tables SHALL declare `updatedAt` descending as their initial sort and SHALL expose a sortable **Updated** column that renders that state. This SHALL apply to the full track table used by My Tracks and the admin track page, and to the workout table used by My Workouts.

#### Scenario: My Tracks opens with a visible default sort

- **WHEN** an owner opens `/my/tracks`
- **THEN** the rows are ordered most recently updated first
- **AND** the **Updated** header shows the down-arrow glyph
- **AND** the **Title** header shows the neutral glyph

#### Scenario: Admin track table opens with the same default sort

- **WHEN** an administrator opens `/admin/tracks`
- **THEN** the **Updated** header shows the down-arrow glyph
- **AND** the rows match the order supplied by the data layer

#### Scenario: Workout table represents its order

- **WHEN** an owner opens `/my/workouts`
- **THEN** the table has a sortable **Updated** column
- **AND** that header shows the down-arrow glyph on first render

#### Scenario: Clearing the default sort is still possible

- **WHEN** the owner clicks the **Updated** header until the sort is cleared
- **THEN** the header returns to the neutral glyph
- **AND** the rows keep the page-supplied order
