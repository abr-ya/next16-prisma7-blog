# Spec Delta

## ADDED Requirements

### Requirement: The owner composes a route from existing routes

The route library SHALL offer a **New composite route** action that opens a builder dialog. The dialog SHALL collect the parent title, an optional description, and an ordered list of segments, each naming an existing plain route and a positive lap count. Saving SHALL create an ordinary parent route whose materialized geometry comes from that recipe. Only routes without a composition SHALL be offered as segments, and the parent SHALL never be offered as its own segment.

#### Scenario: Owner builds a route from two existing routes

- **WHEN** the owner opens **New composite route**, enters a title, adds two routes in order, and saves
- **THEN** the system creates a parent route with the generated geometry
- **AND** the parent appears in the route library and in every route picker
- **AND** it can be attached to a workout like any other route

#### Scenario: A loop is repeated by its lap count

- **WHEN** the owner sets one segment to three laps and saves
- **THEN** the generated parent line contains that loop three times
- **AND** the library shows the segment count and the total lap count

#### Scenario: A composite route is not offered as its own segment

- **WHEN** the owner opens the builder for an existing composite route
- **THEN** that route is not listed among the selectable children
- **AND** no route that already has a composition is listed

#### Scenario: An incomplete recipe cannot be saved

- **WHEN** the title is empty, no segment is added, or a lap count is not a positive whole number
- **THEN** Save stays disabled
- **AND** no route is created

#### Scenario: A gap between segments is reported

- **WHEN** the chosen routes do not meet and the server refuses the recipe
- **THEN** the dialog stays open with the entered recipe
- **AND** the toast names the measured gap

### Requirement: The owner edits a stored recipe

The library SHALL let the owner reopen a composite route in the builder, change the order, remove or add segments, and change lap counts. Saving SHALL keep the same parent route and rebuild its geometry. A parent used by more than one track SHALL require the shared-route confirmation before the rebuild.

#### Scenario: Reordering segments changes the shape

- **WHEN** the owner moves the second segment above the first and saves
- **THEN** the parent's generated line follows the new order
- **AND** every track that uses the parent keeps the same route id
- **AND** their maps and distances reflect the new shape

#### Scenario: A shared composite asks for confirmation

- **WHEN** the parent route is used by more than one track
- **THEN** the dialog requires the shared confirmation before saving
- **AND** a cancelled confirmation leaves the recipe and the geometry unchanged

#### Scenario: Editing a child rebuilds the parent

- **WHEN** the owner changes the geometry of a route used as a segment
- **THEN** every parent composition using it is rebuilt
- **AND** the library shows the parent with its regenerated shape

### Requirement: The library shows composition state and rebuilds a stale parent

The route library SHALL show a composition badge with the segment count and the total lap count, SHALL mark a composition whose last rebuild failed as stale, and SHALL offer a rebuild action for a stale composition. A successful rebuild SHALL clear the stale marker.

#### Scenario: A composite route carries a composition badge

- **WHEN** the owner opens `/my/routes`
- **THEN** a composite row shows the number of segments and the total number of laps
- **AND** a plain route shows no composition badge

#### Scenario: A failed propagation is visible

- **WHEN** a child edit could not rebuild its parent
- **THEN** the parent row shows a stale marker
- **AND** the row offers a rebuild action

#### Scenario: Rebuild clears the marker

- **WHEN** the owner triggers the rebuild action and it succeeds
- **THEN** the stale marker disappears
- **AND** the parent serves its regenerated geometry

### Requirement: A composite route's geometry comes from its recipe

The library SHALL NOT offer geometry editing by placed points for a composite route, and the server SHALL refuse a points rewrite of a route that has a composition. The owner SHALL still be able to edit the parent's title and description.

#### Scenario: Geometry editing is not offered

- **WHEN** the owner opens the actions of a composite route in the library
- **THEN** no geometry-edit action is offered
- **AND** the recipe builder is the way to change the shape

#### Scenario: A direct points rewrite is refused

- **WHEN** a points rewrite reaches the server for a route that has a composition
- **THEN** the system refuses it with a validation message that points at the recipe
- **AND** the composition and its generated geometry stay unchanged

#### Scenario: Title and description stay editable

- **WHEN** the owner edits the title or the description of a composite route
- **THEN** the change is stored
- **AND** the composition is untouched
