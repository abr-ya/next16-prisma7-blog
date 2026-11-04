# Spec Delta

## ADDED Requirements

### Requirement: Table states its fallback order when no column sort is active

The shared data table SHALL accept an optional fallback-order hint that names the row order supplied by the page, and SHALL render that hint only while no column sort is active. The hint SHALL be textual and non-interactive: it SHALL NOT change the row order, the sort cycle, or pagination, and activating it SHALL have no effect. While a column sort is active the hint SHALL be hidden, because the sorted header already carries a direction glyph. A table that supplies no hint SHALL keep its current rendering. The owner-facing track table SHALL name `recently updated`, and the owner-facing workout table SHALL name `most recently started`; both hints SHALL be localized in English and Russian.

#### Scenario: Default sort remains a header concern

- **WHEN** a table opens with an active default column sort
- **THEN** the sorted header shows its direction glyph
- **AND** no fallback-order hint is rendered

#### Scenario: Clearing the sort reveals the fallback order

- **WHEN** the owner clears the active sort by clicking the sorted header a third time
- **THEN** the rows return to the page-supplied order
- **AND** the fallback-order hint appears and names that order

#### Scenario: An order without a sortable column is still named

- **WHEN** a table supplies a fallback-order hint for an order that no sortable header can represent
- **THEN** the hint renders on first load, because no column sort is active

#### Scenario: The hint does not change behaviour

- **WHEN** the owner activates or focuses the fallback-order hint
- **THEN** the sort, the row order, and the pagination stay unchanged

#### Scenario: The hint follows the interface language

- **WHEN** the owner switches between English and Russian on `/my/tracks`, `/admin/tracks`, or `/my/workouts`
- **THEN** the fallback-order hint uses the matching wording for the same order

#### Scenario: Tables without a hint are unchanged

- **WHEN** a table supplies no fallback-order hint
- **THEN** its footer and row order render exactly as before this change
