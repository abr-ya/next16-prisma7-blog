# Spec Delta

## Purpose

Defines the shared sortable column header used by every sortable column in the admin data tables: how it presents the column's current sort state, what a click on it does to that state, and the label/width contract its call sites depend on.

## ADDED Requirements

### Requirement: Sortable header indicates the current sort state

A sortable column header SHALL render a glyph that reflects the column's current sort state, so an administrator can tell at a glance whether the column is unsorted, sorted ascending, or sorted descending. The unsorted state SHALL use a neutral bidirectional arrow glyph; ascending SHALL use a single up-arrow glyph; descending SHALL use a single down-arrow glyph. A column whose sort state has been cleared is unsorted and SHALL render the neutral glyph.

#### Scenario: Column is unsorted

- **WHEN** a sortable column has no active sort
- **THEN** its header renders the neutral bidirectional arrow glyph

#### Scenario: Column is sorted ascending

- **WHEN** a sortable column is sorted ascending
- **THEN** its header renders the up-arrow glyph

#### Scenario: Column is sorted descending

- **WHEN** a sortable column is sorted descending
- **THEN** its header renders the down-arrow glyph

#### Scenario: Sort state is cleared

- **WHEN** a sortable column's sort is cleared so that it is no longer sorted
- **THEN** its header returns to the neutral bidirectional arrow glyph, indistinguishable from a column that was never sorted

#### Scenario: Indicator is consistent across tables

- **WHEN** two different admin tables both have a column sorted in the same direction
- **THEN** both headers render the same glyph for that direction

### Requirement: Header indicator does not change sort behavior

Clicking a sortable column header SHALL continue to cycle that column between ascending and descending exactly as it did before the indicator was introduced. The indicator SHALL reflect the resulting state only; it SHALL NOT add, remove, or reorder any state in the cycle. In particular, a third click SHALL return the column to ascending rather than clearing the sort, and no unsorted state SHALL be reachable by clicking.

#### Scenario: First click from an unsorted column

- **WHEN** an administrator clicks the header of an unsorted column
- **THEN** the column is sorted ascending and the header renders the up-arrow glyph

#### Scenario: Second click from an ascending column

- **WHEN** an administrator clicks the header of an ascending column
- **THEN** the column is sorted descending and the header renders the down-arrow glyph

#### Scenario: Third click from a descending column

- **WHEN** an administrator clicks the header of a descending column
- **THEN** the column is sorted ascending again and the header renders the up-arrow glyph, with no third unsorted state reachable by clicking

### Requirement: Header preserves its label and caller-supplied width

A sortable column header SHALL render its label text unchanged, and SHALL honor any width or alignment classes supplied by the calling table so that a caller can pin a header to a fixed column width. Two different columns whose labels differ only in text SHALL render identical glyphs in the same sort state.

#### Scenario: Width-pinned header keeps its width

- **WHEN** a table supplies a fixed width to one sortable header and the column is re-sorted
- **THEN** the header keeps the supplied width and the surrounding column layout does not change

#### Scenario: Header renders its label

- **WHEN** a sortable column header is rendered
- **THEN** the header shows the label text supplied by the table alongside the state glyph