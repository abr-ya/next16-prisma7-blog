# Spec Delta

## ADDED Requirements

### Requirement: Table states its current or fallback order

The shared data table SHALL show one always-visible textual sort status above the table whenever a sort-status configuration is supplied. When a column sort is active, the status SHALL name that column and its direction; when no column sort is active, it SHALL name the fallback order supplied by the page. The line SHALL be non-interactive and SHALL NOT change the row order, the sort cycle, or pagination. It SHALL render above the table on the leading edge, and the table SHALL accept optional header actions rendered right-aligned in that same row. Column names in the status SHALL match the labels of the visible headers. The owner-facing track and workout tables SHALL supply English and Russian wording, and SHALL name `recently updated` and `most recently started` when no sort is active.

#### Scenario: Default sort is named on first load

- **WHEN** a table opens with a declared default column sort
- **THEN** the status names that column and its direction
- **AND** the sorted header still shows its direction glyph

#### Scenario: Sorting another column updates the status

- **WHEN** the owner sorts a different column ascending or descending
- **THEN** the status names the newly sorted column and its direction
- **AND** it replaces the previous text rather than adding a second line

#### Scenario: Clearing the sort names the fallback order

- **WHEN** the owner clears the active sort
- **THEN** the rows return to the page-supplied order
- **AND** the status names that fallback order instead of a column

#### Scenario: The status does not change behaviour

- **WHEN** the owner activates or focuses the sort status
- **THEN** the sort, the row order, and the pagination stay unchanged

#### Scenario: The status sits above the table

- **WHEN** the sort status is rendered
- **THEN** it appears above the table, aligned with the table's leading edge
- **AND** it does not share a row with the pagination controls

#### Scenario: The primary action shares the status row

- **WHEN** a table supplies both the sort status and header actions
- **THEN** the status renders on the leading edge and the actions on the trailing edge of one row above the table
- **AND** the actions keep their existing order and behaviour

#### Scenario: The status follows the interface language

- **WHEN** the owner switches between English and Russian on `/my/tracks`, `/admin/tracks`, or `/my/workouts`
- **THEN** the status wording and direction use the matching language
- **AND** the column names match the visible headers

#### Scenario: Tables without a status configuration are unchanged

- **WHEN** a table supplies no sort-status configuration
- **THEN** its header area and row order render exactly as before this change
