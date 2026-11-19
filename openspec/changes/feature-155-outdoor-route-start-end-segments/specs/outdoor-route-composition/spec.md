# Spec Delta

## ADDED Requirements

### Requirement: The builder offers start, main, and end segments

The route builder SHALL let the owner assign `START`, `MAIN`, or `END` to each segment. A start segment SHALL be offered only as the first segment, an end segment only as the last, and the lap count SHALL be editable for a `MAIN` segment only and pinned to one for a start or an end. The save SHALL refuse an ordering or cardinality the server rejects and SHALL keep the dialog open with the entered recipe.

#### Scenario: Owner builds a lead-in, a loop, and a lead-out

- **WHEN** the owner adds a start segment, a main segment with three laps, and an end segment, then saves
- **THEN** the parent route is materialized from all three segments in order
- **AND** the lead-in and the lead-out each contribute their distance once
- **AND** the lap count is three

#### Scenario: The lap field is pinned for a connector

- **WHEN** the owner changes a segment's role to start or end
- **THEN** its lap count is fixed at one and the field is not editable
- **AND** switching it back to main makes the lap count editable again

#### Scenario: The role is restored in the edit dialog

- **WHEN** the owner reopens a stored lead-in, loop, and lead-out route
- **THEN** each row shows its stored role
- **AND** the main row shows its lap count

#### Scenario: An impossible role is refused

- **WHEN** the owner saves a recipe whose start is not first, whose end is not last, that has two starts or two ends, that has no main segment, or that gives a start or an end more than one lap
- **THEN** the system refuses the save with a validation message that names the reason
- **AND** the dialog stays open with the entered recipe
- **AND** the parent route and its geometry stay unchanged

### Requirement: Composition input is validated with start, main, and end roles

The system SHALL refuse a composition that names another owner's route, a nested child, the parent itself, an empty segment list, a duplicate sort order, an unsupported role, a start that is not first, an end that is not last, more than one start or end, a recipe without a main segment, a lap count below one, a lap count above one on a start or an end, an unparseable child, or a gap between consecutive segments beyond the continuity tolerance. A refusal SHALL name the reason and SHALL store nothing.

#### Scenario: Gap between segments is refused

- **WHEN** the first point of the next segment lies farther from the previous segment's last point than the continuity tolerance
- **THEN** the system refuses the composition with a validation message that names the measured gap
- **AND** the parent geometry is unchanged

#### Scenario: A gap at a connector is refused

- **WHEN** the lead-in ends farther than the continuity tolerance from the first point of the main loop, or the end segment starts farther than that from the loop's last point
- **THEN** the system refuses the composition with a validation message that names the measured gap
- **AND** no geometry is generated

#### Scenario: A lap count must be positive

- **WHEN** a segment is offered with a lap count of zero or a negative number
- **THEN** the system refuses the composition with a validation message
- **AND** no segment is stored

#### Scenario: Only a main segment may repeat

- **WHEN** a start or an end segment is offered with a lap count above one
- **THEN** the system refuses the composition with a validation message
- **AND** no segment is stored

#### Scenario: The role order is enforced

- **WHEN** a start segment is not the first segment, an end segment is not the last, a second start or end appears, or the recipe has no main segment
- **THEN** the system refuses the composition with a validation message
- **AND** no segment is stored

#### Scenario: A shared parent asks for confirmation

- **WHEN** the parent route is used by more than one track and the caller has not confirmed the shared change
- **THEN** the system refuses the composition with a shared-confirmation result that names the track count
- **AND** the parent geometry is unchanged

## REMOVED Requirements

### Requirement: Composition input is validated and refused explicitly

**Reason**: The MAIN-only slice refused start and end roles on purpose; this change makes them authorable, so the requirement's rule and its "Only the main role is authorable" scenario no longer describe the product.

**Migration**: Use "Composition input is validated with start, main, and end roles", which carries the same owner, nesting, order, lap, child and gap refusals plus the new role rules.

