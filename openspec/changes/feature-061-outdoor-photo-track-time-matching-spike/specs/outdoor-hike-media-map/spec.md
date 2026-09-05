## MODIFIED Requirements

### Requirement: Photo coordinate inference from track time is planned separately

The system SHALL treat timestamp-based photo-to-track coordinate inference as an explicit capability with reviewable assumptions. Before persistence, an admin-only spike MAY propose match candidates and log an accepted suggestion without writing inferred coordinates or showing public map markers.

#### Scenario: Photo capture time overlaps track time

- **WHEN** a linked published photo has a stored capture timestamp and a linked published track has a usable recording time range
- **THEN** an admin spike may propose a candidate such as matching that track's recording window
- **AND** accepting the candidate in this spike SHALL NOT persist an inferred coordinate or public map marker

#### Scenario: Photo capture time falls between nearby tracks

- **WHEN** a linked published photo has a stored capture timestamp that falls between the end of one linked track and the start of another, and those endpoints are within an accepted nearness threshold for the spike
- **THEN** an admin spike may propose a between-tracks candidate
- **AND** accepting the candidate in this spike only logs the suggestion for evaluation

#### Scenario: Time data is missing or ambiguous

- **WHEN** a linked photo or linked track lacks usable timestamp data, timezone context, or confidence needed for a spike candidate
- **THEN** the system SHALL avoid presenting an inferred coordinate as fact
- **AND** the photo remains without a track-time map marker from this spike

#### Scenario: Guest or non-admin does not see spike controls

- **WHEN** an anonymous visitor or non-admin signed-in user opens a hike surface
- **THEN** the system does not expose the track-time matching spike controls
- **AND** it does not show inferred coordinates from this spike on the public hike map
