# Spec Delta

## ADDED Requirements

### Requirement: The owner promotes a secondary file to primary when no route exists

On a route-less, ready workout with several GPX files, the owner SHALL be able to make a secondary file the primary geometry. The current primary SHALL become a secondary file in the same transaction, the file-XOR-route invariant SHALL hold throughout, and the map, distance, time, and photo inference SHALL follow the new primary. A route-primary workout SHALL never offer the action, and a foreign, pending, or non-owned geometry SHALL be refused.

#### Scenario: A secondary file becomes primary

- **WHEN** the owner chooses **Make primary** on a secondary file of a route-less ready workout
- **THEN** the chosen file becomes the primary geometry
- **AND** the previous primary becomes a secondary file with its own parsed metadata
- **AND** the map, distance, total and moving time follow the new primary

#### Scenario: The previous primary keeps its own line

- **WHEN** a promotion completes
- **THEN** the previous primary file appears in the secondary list
- **AND** its parsed line is still drawn as a secondary recording
- **AND** it can be promoted back later

#### Scenario: A route-primary workout offers no promotion

- **WHEN** the owner opens a workout whose primary geometry is a route
- **THEN** no **Make primary** action is shown for its secondary files
- **AND** a direct promotion request for that workout is refused

#### Scenario: A pending or foreign geometry is refused

- **WHEN** the owner requests a promotion on a pending draft, on another user's track, or on a geometry that does not belong to the track
- **THEN** the system refuses the request with a validation or not-found result
- **AND** neither the primary nor the secondary files change

#### Scenario: A failed reparse after the swap is reported

- **WHEN** the swap succeeds but the new primary file cannot be parsed
- **THEN** the files keep the swapped state
- **AND** the action reports the failure
- **AND** the general **Update track data** action remains available on the workout

#### Scenario: Another viewer sees no action

- **WHEN** a viewer who does not own the workout opens it
- **THEN** no **Make primary** action is shown
- **AND** the stored primary and secondary files stay unchanged
