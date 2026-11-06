# Spec Delta

## ADDED Requirements

### Requirement: Owner sees per-day charts and per-activity totals for the selected ISO week

While a single ISO week is selected on `/my/workouts`, the Week summary dialog SHALL show two grouped bar charts covering Monday through Sunday: the number of walks and runs per day, and the summed distance of walks and runs per day, with one bar per activity type per day. The dialog SHALL also show a compact per-activity breakdown listing walks and runs, each with its workout count and summed distance for the week. The charts and the breakdown SHALL both be derived from the complete filtered week set and the same effective-distance helper the workout table uses. The existing week totals SHALL remain visible above the breakdown and the charts.

#### Scenario: A week with walks and runs

- **WHEN** the owner opens the Week summary for an ISO week containing walks and runs
- **THEN** the first chart shows, for each of the seven days, one bar for walks and one for runs with the number of workouts of that type on that day
- **AND** the second chart shows, for each of the seven days, one bar for walk distance and one for run distance
- **AND** days without workouts render as zero so the axis always covers the whole week

#### Scenario: Per-activity totals break down the week totals

- **WHEN** the owner opens the Week summary for a selected week
- **THEN** a small table shows one row per covered activity type with its workout count and its summed distance for the week
- **AND** the walk and run counts, together with the reported other-type workouts, add up to the dialog's workout total
- **AND** each row's distance uses the same formatting as the Distance column and the chart legend names the same activity types

#### Scenario: Per-activity totals without a distance

- **WHEN** a covered activity type has workouts in the week but none of them carry a parsed distance
- **THEN** its distance cell reports that no distance is recorded instead of showing `0`
- **AND** an activity type with no workouts that week still renders a row with a zero count and no distance value

#### Scenario: Counts match the table

- **WHEN** the charts are open for a selected week
- **THEN** the sum of the walk and run bars per day equals the number of walk and run rows the week table shows for that day
- **AND** each per-activity row equals the sum of that activity type's bars across the week

#### Scenario: Distances match the Distance column

- **WHEN** a walk or run has a parsed distance
- **THEN** its distance contributes to that day's bar for its activity type, in the same `m` / `km` units the table uses
- **AND** the totals in the dialog still equal the sum of the table's Distance column

#### Scenario: Workouts without a parsed distance

- **WHEN** a plotted workout has no parsed distance
- **THEN** it still counts toward the count chart for its day
- **AND** it is not drawn as a zero-distance bar
- **AND** the dialog states how many workouts were counted for distance

#### Scenario: No walk or run in the week

- **WHEN** the selected week contains neither a walk nor a run
- **THEN** the dialog shows an explanatory line instead of the charts

#### Scenario: No distance in either series

- **WHEN** neither the walks nor the runs in the selected week have a parsed distance
- **THEN** the dialog reports that no distance is recorded instead of drawing empty or zero-distance bars

#### Scenario: Other activity types are excluded and reported

- **WHEN** the selected week contains workouts whose activity type is not walking or running
- **THEN** those workouts appear in neither chart nor the per-activity breakdown
- **AND** the dialog states how many workouts were left out of the charts

#### Scenario: Day attribution follows the recording timezone

- **WHEN** a workout's effective start falls on a different calendar day in its `recordingTimezone` than in the browser's timezone
- **THEN** the workout is charted on the day its own timezone assigns, matching the day the week filter counted it in

#### Scenario: The charts are readable by assistive technology

- **WHEN** the dialog is read by a screen reader
- **THEN** each chart exposes a text alternative naming its series and per-day values
- **AND** the legend labels are real text

#### Scenario: All time stays unchanged

- **WHEN** the owner views `All time`
- **THEN** no summary or chart is rendered
- **AND** the existing list and pagination are unchanged
