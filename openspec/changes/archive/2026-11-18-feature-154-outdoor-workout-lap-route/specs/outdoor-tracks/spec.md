# Spec Delta

## ADDED Requirements

### Requirement: A workout reports the lap count of its route

A workout whose route has a composition SHALL report the laps of its `MAIN` segments and, when the route has more than one segment, its segment count on the public detail page, the public tracks list, and the owner's workouts table. Laps SHALL count `MAIN` laps only, so a lead-in or a lead-out segment never adds a lap. A workout without a composition SHALL show no lap count. The reported distance SHALL stay the generated line's distance.

#### Scenario: The public detail page shows the lap count

- **WHEN** a viewer opens a published workout built on a three-lap variant
- **THEN** the header shows a `3 laps` badge
- **AND** the distance is the generated three-loop distance

#### Scenario: A route with a lead-in and a lead-out shows laps and segments

- **WHEN** a workout's route is composed of a lead-in segment, a `MAIN` segment with three laps, and a lead-out segment
- **THEN** the header badge reads `3 laps · 3 segments`
- **AND** the lead-in and the lead-out add no lap
- **AND** the distance includes both connectors and all three laps

#### Scenario: The public list shows the lap count

- **WHEN** a viewer opens `/tracks`
- **THEN** the card of a composited workout shows its lap count
- **AND** a card of a plain route workout shows no lap badge

#### Scenario: The owner's workouts table shows the lap count

- **WHEN** the owner opens `/my/workouts`
- **THEN** the **Laps** column shows the count for a composited row, with the segment count when there is more than one segment
- **AND** it shows a dash for a row that has no composition
- **AND** the column can be sorted

#### Scenario: Distance stays the generated line

- **WHEN** a composited workout is read on any surface
- **THEN** its distance is the generated line's distance
- **AND** the lap display never recalculates the distance from the lap count
