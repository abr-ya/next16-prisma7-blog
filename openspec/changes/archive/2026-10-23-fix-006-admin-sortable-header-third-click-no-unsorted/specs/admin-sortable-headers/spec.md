# Spec Delta

## REMOVED Requirements

### Requirement: Header indicator does not change sort behavior

**Reason**: This requirement pinned the two-state cycle (unsorted → ascending → descending → ascending) as required behavior and stated that no unsorted state was reachable by clicking. It was written by `feature-119`, which deliberately preserved the pre-existing cycle so the direction-aware glyphs could ship on their own. `fix-006` supersedes it by restoring the third state; the requirement can no longer describe correct behavior.

**Migration**: Replaced by "Header cycles through unsorted, ascending, and descending". The other two requirements in this capability — that the header renders a glyph matching the current sort state, and that it preserves its label and caller-supplied width — are unaffected and continue to apply unchanged. The visible difference for an administrator is that a third click now clears the sort instead of returning the column to ascending; no call site, route, or stored value changes.

## ADDED Requirements

### Requirement: Header cycles through unsorted, ascending, and descending

Clicking a sortable column header SHALL cycle that column through three states in order: unsorted → ascending → descending → unsorted. An unsorted state SHALL therefore be reachable by clicking, without a page reload or any other navigation. The cycle SHALL continue indefinitely past the first three states. The header indicator SHALL remain a reflection of the resulting state only: it SHALL NOT determine, constrain, add, remove, or reorder any state in the cycle.

#### Scenario: First click from a fresh page load

- **WHEN** an administrator clicks the header of a column that is unsorted
- **THEN** the column is sorted ascending and the header renders the up-arrow glyph

#### Scenario: Second click from an ascending column

- **WHEN** an administrator clicks the header of an ascending column
- **THEN** the column is sorted descending and the header renders the down-arrow glyph

#### Scenario: Third click from a descending column clears the sort

- **WHEN** an administrator clicks the header of a descending column
- **THEN** the column is no longer sorted and the header renders the neutral bidirectional arrow glyph, returning the table to its original row order without a reload

#### Scenario: Fourth click restarts the cycle

- **WHEN** an administrator clicks the header again after the sort has been cleared
- **THEN** the column is sorted ascending and the header renders the up-arrow glyph, so the cycle repeats

#### Scenario: Clearing the sort changes only the sort

- **WHEN** a sort is cleared from a column in an otherwise populated table
- **THEN** the rest of the table is unchanged — the same rows remain visible in their original order, and no other column's sort is affected